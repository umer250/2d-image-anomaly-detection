import os
import json
import logging
import numpy as np
from typing import List

logger = logging.getLogger("app.ml.threshold")

MODELS_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "ml_models",
)
THRESHOLDS_FILE = os.path.join(MODELS_DIR, "thresholds.json")


def calculate_threshold(normal_scores: List[float]) -> float:
    if not normal_scores:
        return 0.5

    mean = np.mean(normal_scores)
    std = np.std(normal_scores)
    return float(mean + (2 * std))


def save_threshold(category: str, threshold: float) -> dict:
    os.makedirs(MODELS_DIR, exist_ok=True)

    thresholds = {}
    if os.path.exists(THRESHOLDS_FILE):
        try:
            with open(THRESHOLDS_FILE, "r") as f:
                thresholds = json.load(f)
        except json.JSONDecodeError as e:
            logger.warning(f"[threshold] Corrupt thresholds.json, resetting: {e}")
            thresholds = {}

    thresholds[category] = round(threshold, 4)
    with open(THRESHOLDS_FILE, "w") as f:
        json.dump(thresholds, f, indent=4)

    return thresholds


def load_threshold(category: str) -> float:
    if not os.path.exists(THRESHOLDS_FILE):
        return 0.50

    try:
        with open(THRESHOLDS_FILE, "r") as f:
            thresholds = json.load(f)
            return thresholds.get(category, 0.50)
    except Exception as e:
        logger.error(f"[threshold] Failed to load thresholds.json: {e}")
        return 0.50
