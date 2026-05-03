
import os
import sys
import argparse
import pickle
import numpy as np
import torch
import torch.nn.functional as F
from tqdm import tqdm
from pathlib import Path
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.ml.model_loader import model_loader
from app.ml.preprocess import preprocess_image
from app.ml.threshold import save_threshold, calculate_threshold

def recalibrate(category: str, img_dir: str, sigma_multiplier: float = 2.0):
    print(f"\n[Recalibrate] Starting recalibration for category: '{category}'")
    print(f"[Recalibrate] Dataset Path: {img_dir}")
    
    if not model_loader.is_model_available(category):
        print(f"❌ Error: Model for '{category}' not found in ml_models/")
        return

    path = Path(img_dir)
    if not path.exists():
        print(f"❌ Error: Image directory not found at {img_dir}")
        return

    image_paths = list(path.glob("*.png")) + list(path.glob("*.jpg")) + list(path.glob("*.jpeg"))
    if not image_paths:
        print("❌ Error: No images found in the specified directory.")
        return
    
    print(f"Found {len(image_paths)} images. Loading model...")

    model_data = model_loader.get_model(category)
    memory_bank_raw = model_data["memory_bank"]
    
    from app.ml.inference import _get_backbone
    bb = _get_backbone()
    device = bb.device
    memory_bank = torch.tensor(memory_bank_raw, dtype=torch.float32, device=device)

    raw_distances = []
    print(f"Computing raw distances on {device}...")
    
    with torch.no_grad():
        for img_p in tqdm(image_paths, desc="Processing"):
            try:
                img_tensor, _ = preprocess_image(str(img_p), remove_bg=False)
                img_tensor = img_tensor.to(device)
                
                bb.model(img_tensor)
                
                from app.ml.inference import _features
                l2 = bb.avg_pool(_features["layer2"])
                l3 = bb.avg_pool(_features["layer3"])
                l3 = F.interpolate(l3, size=l2.shape[2:], mode="bilinear", align_corners=False)
                
                embedding = torch.cat([l2, l3], dim=1)
                b, c, h, w = embedding.shape
                patches = embedding.reshape(c, h * w).T
                
                num_neighbors = int(model_data.get("num_neighbors", 1))
                dists = torch.cdist(patches, memory_bank, p=2.0)
                topk_dists, _ = dists.topk(num_neighbors, dim=1, largest=False)
                avg_dists = topk_dists.mean(dim=1)
                
                raw_max = float(avg_dists.max().item())
                raw_distances.append(raw_max)
                
            except Exception as e:
                print(f"\n⚠️  Skipped {img_p.name}: {e}")

    if not raw_distances:
        print("❌ Error: No scores were successfully computed.")
        return

    p99_normal = float(np.percentile(raw_distances, 99))
    
    normal_scores = [raw / p99_normal for raw in raw_distances]
    
    mean_s = np.mean(normal_scores)
    std_s = np.std(normal_scores)
    new_threshold = float(max(1.0, mean_s + sigma_multiplier * std_s))
    
    print(f"\n[Results]")
    print(f"  p99_normal (raw): {p99_normal:.4f}")
    print(f"  Mean Score:       {mean_s:.4f}")
    print(f"  Std Dev:          {std_s:.4f}")
    print(f"  NEW Threshold:    {new_threshold:.4f} (at {sigma_multiplier} sigma)")

    save_threshold(category, new_threshold)
    
    model_path = model_loader._get_model_path(category)
    model_data["threshold"] = new_threshold
    model_data["p99_normal"] = p99_normal
    model_data["normal_scores"] = normal_scores
    model_data["raw_distances"] = raw_distances
    
    with open(model_path, "wb") as f:
        pickle.dump(model_data, f)
        
    print(f"\n✅ Success! Model '{category}' updated at {model_path}")
    print(f"   p99_normal: {p99_normal:.4f}")
    print(f"   Threshold: {new_threshold:.4f}")
    print(f"   Values are now persistent in .pkl and thresholds.json")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Recalibrate PatchCore threshold using normal images.")
    parser.add_argument("--category", type=str, required=True, help="Category name (e.g., bottle)")
    parser.add_argument("--img_dir", type=str, required=True, help="Path to directory containing normal images")
    parser.add_argument("--sigma", type=float, default=2.0, help="Sigma multiplier for threshold (default 2.0)")
    
    args = parser.parse_args()
    recalibrate(args.category, args.img_dir, args.sigma)
