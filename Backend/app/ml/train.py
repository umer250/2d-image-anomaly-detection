
import os
import sys
import argparse
import pickle
import numpy as np
import torch
import torch.nn.functional as F
from pathlib import Path
from tqdm import tqdm
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.ml.preprocess import preprocess_image
from app.ml.inference import _get_backbone, _features

MODELS_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "ml_models",
)
os.makedirs(MODELS_DIR, exist_ok=True)

SUPPORTED_EXTS = {".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".webp"}


def _collect_images(directory: str) -> list:
    p = Path(directory)
    if not p.exists():
        raise FileNotFoundError(f"Directory not found: {directory}")
    imgs = [f for f in p.iterdir() if f.suffix.lower() in SUPPORTED_EXTS]
    if not imgs:
        raise ValueError(f"No supported images found in: {directory}")
    return sorted(imgs)


def _extract_patches(img_path: str, bb, device: torch.device) -> torch.Tensor:
    img_tensor, _ = preprocess_image(str(img_path), remove_bg=False)
    img_tensor = img_tensor.to(device)

    with torch.no_grad():
        bb.model(img_tensor)

    l2 = bb.avg_pool(_features["layer2"])
    l3 = bb.avg_pool(_features["layer3"])
    l3 = F.interpolate(l3, size=l2.shape[2:], mode="bilinear", align_corners=False)

    embedding = torch.cat([l2, l3], dim=1)   # (1, C, H, W)
    b, c, h, w = embedding.shape
    patches = embedding.reshape(c, h * w).T  # (H*W, C)
    return patches


def _greedy_coreset(features: np.ndarray, ratio: float) -> np.ndarray:
    n = features.shape[0]
    target = max(1, int(n * ratio))
    if target >= n:
        return features

    print(f"  Coreset: {n} -> {target} patches ({ratio*100:.0f}%)")

    rng = np.random.default_rng(42)
    selected = [int(rng.integers(n))]
    min_dists = np.full(n, np.inf)

    for _ in tqdm(range(target - 1), desc="  Coreset selection", leave=False):
        last = features[selected[-1]]
        dists = np.linalg.norm(features - last, axis=1)
        min_dists = np.minimum(min_dists, dists)
        selected.append(int(np.argmax(min_dists)))

    return features[selected]


def _score_image(img_path: str, memory_bank: torch.Tensor, bb, device: torch.device,
                 num_neighbors: int) -> tuple:
    patches = _extract_patches(img_path, bb, device)
    dists = torch.cdist(patches, memory_bank, p=2.0)
    topk, _ = dists.topk(num_neighbors, dim=1, largest=False)
    avg_dists = topk.mean(dim=1)
    raw_max = float(avg_dists.max().item())
    return raw_max, raw_max


def train(
    category: str,
    train_dir: str,
    test_dir: str = None,
    coreset_ratio: float = 0.1,
    num_neighbors: int = 9,
    sigma: float = 2.0,
    output_name: str = None,
):
    print(f"\n{'='*60}")
    print(f"  PatchCore Training — category: {category}")
    print(f"{'='*60}")
    print(f"  Train dir    : {train_dir}")
    print(f"  Coreset ratio: {coreset_ratio}")
    print(f"  Num neighbors: {num_neighbors}")
    print(f"  Sigma        : {sigma}")

    train_images = _collect_images(train_dir)
    print(f"\n  Found {len(train_images)} training images.")

    bb = _get_backbone()
    device = bb.device
    print(f"  Backbone: WideResNet50 on {device}")

    print("\n[1/4] Extracting patch embeddings...")
    all_patches = []
    for img_path in tqdm(train_images, desc="  Embedding"):
        try:
            patches = _extract_patches(img_path, bb, device)
            all_patches.append(patches.cpu().numpy())
        except Exception as e:
            print(f"\n  ⚠  Skipped {img_path.name}: {e}")

    if not all_patches:
        raise RuntimeError("No patches extracted — check your training images.")

    all_patches_np = np.concatenate(all_patches, axis=0)
    print(f"  Total patches: {all_patches_np.shape[0]:,}  dim={all_patches_np.shape[1]}")

    print("\n[2/4] Coreset subsampling...")
    memory_bank_np = _greedy_coreset(all_patches_np, coreset_ratio)
    print(f"  Memory bank size: {memory_bank_np.shape[0]:,} patches")

    memory_bank = torch.tensor(memory_bank_np, dtype=torch.float32, device=device)

    print("\n[3/4] Computing p99_normal and threshold from training scores...")
    raw_distances = []
    for img_path in tqdm(train_images, desc="  Scoring"):
        try:
            raw_max, _ = _score_image(img_path, memory_bank, bb, device, num_neighbors)
            raw_distances.append(raw_max)
        except Exception as e:
            print(f"\n  ⚠  Skipped {img_path.name}: {e}")

    p99_normal = float(np.percentile(raw_distances, 99))
    
    normal_scores = [raw / p99_normal for raw in raw_distances]
    
    mean_s = float(np.mean(normal_scores))
    std_s  = float(np.std(normal_scores))
    
    threshold = round(max(1.0, mean_s + sigma * std_s), 6)

    print(f"  p99_normal (raw)  : {p99_normal:.4f}")
    print(f"  Normal score mean : {mean_s:.4f}")
    print(f"  Normal score std  : {std_s:.4f}")
    print(f"  Threshold         : {threshold:.4f}")

    i_auroc, p_auroc = None, None
    if test_dir:
        print(f"\n[3b] Evaluating on test set: {test_dir}")
        try:
            from sklearn.metrics import roc_auc_score
            test_path = Path(test_dir)
            labels, scores = [], []

            for subdir in sorted(test_path.iterdir()):
                if not subdir.is_dir():
                    continue
                label = 0 if subdir.name == "good" else 1
                for img_path in sorted(subdir.iterdir()):
                    if img_path.suffix.lower() not in SUPPORTED_EXTS:
                        continue
                    try:
                        raw_max, _ = _score_image(img_path, memory_bank, bb, device, num_neighbors)
                        normalized_score = raw_max / p99_normal
                        scores.append(normalized_score)
                        labels.append(label)
                    except Exception as e:
                        print(f"  ⚠  Skipped {img_path.name}: {e}")

            if labels:
                i_auroc = round(float(roc_auc_score(labels, scores)), 4)
                print(f"  Image AUROC: {i_auroc:.4f}")
            else:
                print("  No test images found — skipping AUROC.")
        except ImportError:
            print("  scikit-learn not installed — skipping AUROC evaluation.")
        except Exception as e:
            print(f"  AUROC evaluation failed: {e}")

    print("\n[4/4] Saving model...")
    stem = output_name or f"{category}_patch_core_updated"
    output_path = os.path.join(MODELS_DIR, f"{stem}.pkl")

    model_data = {
        "memory_bank":   memory_bank_np,
        "threshold":     threshold,
        "num_neighbors": num_neighbors,
        "p99_normal":    p99_normal,
        "normal_scores": normal_scores,
        "raw_distances": raw_distances,
        "config": {
            "category":      category,
            "backbone":      "wide_resnet50_2",
            "layers":        ["layer2", "layer3"],
            "coreset_ratio": coreset_ratio,
            "sigma":         sigma,
            "num_train_images": len(train_images),
            "memory_bank_size": memory_bank_np.shape[0],
            "embedding_dim":    memory_bank_np.shape[1],
            "i_auroc":       i_auroc,
            "p_auroc":       p_auroc,
            "output_file":   f"{stem}.pkl",
            "p99_normal":    p99_normal,
        },
    }

    with open(output_path, "wb") as f:
        pickle.dump(model_data, f)

    size_mb = os.path.getsize(output_path) / (1024 * 1024)
    print(f"\n{'='*60}")
    print(f"  [SUCCESS] Model saved: {output_path}")
    print(f"     Size        : {size_mb:.1f} MB")
    print(f"     p99_normal  : {p99_normal:.4f}")
    print(f"     Threshold   : {threshold:.4f}")
    if i_auroc:
        print(f"     Image AUROC : {i_auroc:.4f}")
    print(f"{'='*60}\n")

    return output_path, threshold


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Train a PatchCore model for a given MVTec category."
    )
    parser.add_argument(
        "--category", type=str, required=True,
        help="Category name, e.g. bottle"
    )
    parser.add_argument(
        "--train_dir", type=str, required=True,
        help="Path to directory of NORMAL (good) training images"
    )
    parser.add_argument(
        "--test_dir", type=str, default=None,
        help="(Optional) Path to test directory with 'good/' and defect subdirs for AUROC"
    )
    parser.add_argument(
        "--coreset_ratio", type=float, default=0.1,
        help="Fraction of patches to keep in memory bank (default: 0.1)"
    )
    parser.add_argument(
        "--num_neighbors", type=int, default=9,
        help="K for KNN scoring (default: 9)"
    )
    parser.add_argument(
        "--sigma", type=float, default=2.0,
        help="Threshold = mean + sigma * std of normal scores (default: 2.0)"
    )
    parser.add_argument(
        "--output_name", type=str, default=None,
        help="Override output filename stem (default: <category>_patch_core_updated)"
    )

    args = parser.parse_args()
    train(
        category=args.category,
        train_dir=args.train_dir,
        test_dir=args.test_dir,
        coreset_ratio=args.coreset_ratio,
        num_neighbors=args.num_neighbors,
        sigma=args.sigma,
        output_name=args.output_name,
    )
