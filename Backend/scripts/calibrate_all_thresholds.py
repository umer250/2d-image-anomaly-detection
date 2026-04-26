"""
Batch calibration script: recalibrates anomaly thresholds for all 15 categories
using memory-bank self-distances (no reference images needed).

Usage:
    cd Backend
    python scripts/calibrate_all_thresholds.py

Optional env vars:
    CALIBRATE_PERCENTILE — percentile to use (default: 95)
"""

import os
import sys
import logging
import pickle
import numpy as np
import torch

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger("calibrate_thresholds")

ALL_CATEGORIES = [
    "bottle", "cable", "capsule", "carpet", "grid",
    "hazelnut", "leather", "metal_nut", "pill", "screw",
    "tile", "toothbrush", "transistor", "wood", "zipper",
]


def calibrate_from_memory_bank(category: str, percentile: float = 95.0) -> float:
    """
    Compute a threshold from the model's own memory bank using nearest-neighbour
    self-distances. This is a proven zero-shot calibration technique for PatchCore.
    """
    from app.ml.model_loader import model_loader
    from app.ml.inference import _get_backbone

    if not model_loader.is_model_available(category):
        raise FileNotFoundError(f"No trained model for: {category}")

    backbone = _get_backbone()
    device = backbone.device

    model_data = model_loader.get_model(category)
    memory_bank_np = model_data["memory_bank"]
    memory_bank = torch.tensor(memory_bank_np, dtype=torch.float32, device=device)

    n = memory_bank.shape[0]
    sample_size = min(n, 2000)
    idx = torch.randperm(n, device=device)[:sample_size]
    sample = memory_bank[idx]

    # Pairwise L2 distances to full memory bank
    dists = torch.cdist(sample, memory_bank, p=2.0)
    # Exclude self-distance
    dists[torch.arange(sample_size), idx[:sample_size]] = 1e9
    min_dists, _ = dists.min(dim=1)

    raw_scores = min_dists.cpu().numpy()
    # Normalize to [0, 1]
    scores = [float(r / (r + 1.0)) for r in raw_scores]

    threshold = float(np.percentile(scores, percentile))
    return round(threshold, 6)


def main():
    percentile = float(os.getenv("CALIBRATE_PERCENTILE", "95"))
    logger.info(f"Starting threshold calibration at {percentile}th percentile...")
    logger.info(f"Categories: {ALL_CATEGORIES}")

    from app.ml.model_loader import model_loader

    results = {}
    failed = []

    for cat in ALL_CATEGORIES:
        try:
            threshold = calibrate_from_memory_bank(cat, percentile)
            model_loader.update_threshold(cat, threshold)
            results[cat] = threshold
            logger.info(f"  ✅  {cat:<15} threshold = {threshold:.6f}")
        except FileNotFoundError:
            logger.warning(f"  ⚠️   {cat:<15} — model not found, skipping.")
            failed.append(cat)
        except Exception as exc:
            logger.error(f"  ❌  {cat:<15} — calibration failed: {exc}")
            failed.append(cat)

    logger.info("=" * 60)
    logger.info(f"Calibration complete: {len(results)}/{len(ALL_CATEGORIES)} categories updated.")
    if failed:
        logger.warning(f"Failed/skipped: {failed}")
    logger.info("Thresholds are now active in memory. Restart the server to persist.")


if __name__ == "__main__":
    main()
