"""
PatchCore Inference Engine
==========================
Scoring matches notebook training EXACTLY:
  1. 1-NN patch distances from memory bank
  2. raw_score = mean of top-1% highest distances (top_k_ratio=0.01)
  3. score = raw_score / p99_normal   (p99 from training normal images)
  4. threshold from pkl (max-F1 on validation, default=1.0)

Normal images  → score < threshold (~0.4–0.9)
Anomaly images → score > threshold (~1.1–2.0+)
"""

import os
import threading
import time
import traceback

import numpy as np
import cv2
from scipy.ndimage import gaussian_filter
import torch
import torch.nn.functional as F
import torchvision.models as models
from typing import Dict, Any, Optional

from app.ml.model_loader import model_loader
from app.ml.preprocess import preprocess_image, check_image_quality

VALID_CATEGORIES = [
    "bottle", "bottle_latest", "bottle_v2", "cable", "capsule", "carpet", "grid",
    "hazelnut", "leather", "metal_nut", "pill", "screw",
    "tile", "toothbrush", "transistor", "wood", "zipper",
]

_features: Dict[str, torch.Tensor] = {}

def _make_hook(name: str):
    def hook(module, input, output):
        _features[name] = output.detach()
    return hook


class _BackboneCache:
    _instance = None
    _init_lock = threading.Lock()

    def __new__(cls):
        with cls._init_lock:
            if cls._instance is None:
                inst = super().__new__(cls)
                inst.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
                print(f"[PatchCore] Loading WideResNet50 on {inst.device}…")
                backbone = models.wide_resnet50_2(pretrained=True)
                backbone.eval()
                backbone.to(inst.device)
                backbone.layer2.register_forward_hook(_make_hook("layer2"))
                backbone.layer3.register_forward_hook(_make_hook("layer3"))
                inst.avg_pool = torch.nn.AvgPool2d(3, stride=1, padding=1)
                inst.model = backbone
                cls._instance = inst
        return cls._instance


_backbone: Optional[_BackboneCache] = None
_backbone_lock = threading.Lock()
_memory_bank_cache: Dict[str, torch.Tensor] = {}
_memory_bank_lock = threading.Lock()


def _get_backbone() -> _BackboneCache:
    global _backbone
    if _backbone is None:
        with _backbone_lock:
            if _backbone is None:
                _backbone = _BackboneCache()
    return _backbone


def _get_memory_bank(category: str, device: torch.device) -> torch.Tensor:
    with _memory_bank_lock:
        if category not in _memory_bank_cache:
            model_data = model_loader.get_model(category)
            mb = torch.tensor(model_data["memory_bank"], dtype=torch.float32, device=device)
            _memory_bank_cache[category] = mb
        return _memory_bank_cache[category]


def run_inference(
    image_path: str,
    category: str = "bottle",
    remove_bg: bool = False,
) -> Dict[str, Any]:
    """
    Run PatchCore anomaly detection.

    remove_bg=False by default — only enable for real-world cluttered photos
    (controlled by the 'Isolate Object' toggle in the UI).
    Preprocessing must match Kaggle training: resize(224) + ImageNet normalize only.
    """
    print(f"[inference] Starting: category={category}, image={image_path}, remove_bg={remove_bg}")

    if not model_loader.is_model_available(category):
        raise FileNotFoundError(f"Model not trained for category: '{category}'")

    # Blur / quality check
    quality = check_image_quality(image_path)
    print(f"[inference] Quality check: blur_score={quality['blur_score']}, is_blurry={quality['is_blurry']}")

    bb = _get_backbone()
    device = bb.device

    # Load model data (bottle → bottle_latest_patchcore.pkl)
    model_data = model_loader.get_model(category)
    threshold = float(model_data["threshold"])
    print(f"[inference] Model loaded. threshold={threshold:.4f}, memory_bank={np.array(model_data['memory_bank']).shape}")

    # Preprocess — NO CLAHE, just resize + normalize (matches Kaggle training)
    try:
        img_tensor, img_display = preprocess_image(
            image_path, category=category, remove_bg=remove_bg
        )
    except Exception as e:
        print(f"[inference] Preprocessing FAILED: {e}")
        traceback.print_exc()
        raise RuntimeError(f"Preprocessing failed: {e}") from e

    img_tensor = img_tensor.to(device)
    print(f"[inference] Preprocessed tensor: {img_tensor.shape}, device={device}")

    start_ts = time.time()

    # Forward pass
    with torch.no_grad():
        bb.model(img_tensor)

    if "layer2" not in _features or "layer3" not in _features:
        raise RuntimeError("Forward hooks did not fire — backbone may not have run correctly")

    layer2: torch.Tensor = _features["layer2"]
    layer3: torch.Tensor = _features["layer3"]
    print(f"[inference] Features: layer2={layer2.shape}, layer3={layer3.shape}")

    layer2 = bb.avg_pool(layer2)
    layer3 = bb.avg_pool(layer3)
    layer3 = F.interpolate(layer3, size=layer2.shape[2:], mode="bilinear", align_corners=False)

    embedding = torch.cat([layer2, layer3], dim=1)
    b, c, h, w = embedding.shape
    patch_features = embedding.reshape(c, h * w).T   # (HW, C)
    print(f"[inference] Patch features: {patch_features.shape}")

    # ── Top-K% scoring ──────────────────────────────────────────────────────────────────────────
    # Uses SAME scoring as Kaggle notebook:
    #   raw_score = mean of top-1% patch distances (top_k_ratio=0.01)
    #   score = raw_score / p99_normal
    # p99_normal is stored in pkl — computed from training normals with same method
    # This ensures training and inference are perfectly aligned.
    memory_bank  = torch.tensor(model_data["memory_bank"], dtype=torch.float32, device=device)
    num_neighbors = int(model_data.get("num_neighbors", 1))
    p99_normal    = float(model_data.get("p99_normal", 0.0))

    # Pull top_k_ratio from config if available, else default to 0.01 (1%)
    model_config  = model_data.get("config", {})
    top_k_ratio   = float(model_config.get("top_k_ratio", 0.01))

    # 1-NN distances: each patch vs memory bank
    distances = torch.cdist(patch_features, memory_bank, p=2.0)  # (HW, M)
    nn_dists, _ = distances.min(dim=1)                            # (HW,) nearest neighbor

    # Top-K mean: mean of the top_k_ratio most anomalous patches
    # This matches notebook training — robust vs single noisy patch
    top_k = max(1, int(len(nn_dists) * top_k_ratio))
    topk_vals, _ = torch.topk(nn_dists, k=top_k, largest=True)   # (top_k,)
    raw_score    = float(topk_vals.mean().item())                  # mean of top-1%

    if p99_normal > 0:
        anomaly_score = float(raw_score / p99_normal)
    else:
        # Fallback if pkl has no p99_normal (old format)
        anomaly_score = float(raw_score / (raw_score + 1))

    is_anomaly = bool(anomaly_score > threshold)

    print(f"[inference] top_k={top_k}/{len(nn_dists)} ({top_k_ratio*100:.1f}%), "
          f"raw_score={raw_score:.4f}, p99={p99_normal:.4f}, "
          f"score={anomaly_score:.4f}, thr={threshold:.4f}, is_anomaly={is_anomaly}")

    # Build anomaly map for visualization
    # Use nn_dists (1-NN distances per patch) for spatial heatmap
    anomaly_map_raw = nn_dists.reshape(h, w).cpu().numpy()  # (H, W)
    anomaly_map_viz = cv2.resize(
        anomaly_map_raw,
        (img_tensor.shape[3], img_tensor.shape[2]),
        interpolation=cv2.INTER_CUBIC,
    )
    anomaly_map_viz  = gaussian_filter(anomaly_map_viz, sigma=4)
    map_min          = anomaly_map_viz.min()
    map_max          = anomaly_map_viz.max()
    anomaly_map_norm = (anomaly_map_viz - map_min) / (map_max - map_min + 1e-8)

    inference_ms = round((time.time() - start_ts) * 1000, 2)
    print(f"[inference] Done in {inference_ms}ms")

    return {
        "anomaly_score":     anomaly_score,
        "anomaly_map":       anomaly_map_norm.astype(np.float32),
        "is_anomaly":        is_anomaly,
        "threshold":         threshold,
        "category":          category,
        "model_loaded":      True,
        "inference_time_ms": inference_ms,
        "image_quality":     quality,
    }
