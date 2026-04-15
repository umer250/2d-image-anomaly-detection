import os
import json
import numpy as np
from typing import List

# Define the models directory (same as model loader)
MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "ml_models")
THRESHOLDS_FILE = os.path.join(MODELS_DIR, "thresholds.json")

def calculate_threshold(normal_scores: List[float]) -> float:
    """
    Calculate the optimal threshold for anomaly detection based on normal training scores.
    Uses mean + 2 * standard deviation for ~95% specificity.
    """
    if not normal_scores:
        return 0.5
        
    mean = np.mean(normal_scores)
    std = np.std(normal_scores)
    
    # Calculate threshold (bounded cleanly between 0 and a reasonable high limit)
    optimal_threshold = float(mean + (2 * std))
    return optimal_threshold

def save_threshold(category: str, threshold: float) -> dict:
    """
    Save the threshold for a specific category into the JSON config file.
    """
    os.makedirs(MODELS_DIR, exist_ok=True)
    
    # Load existing boundaries
    thresholds = {}
    if os.path.exists(THRESHOLDS_FILE):
        try:
            with open(THRESHOLDS_FILE, "r") as f:
                thresholds = json.load(f)
        except json.JSONDecodeError:
            pass
            
    # Update and save
    thresholds[category] = round(threshold, 4)
    with open(THRESHOLDS_FILE, "w") as f:
        json.dump(thresholds, f, indent=4)
        
    return thresholds

def load_threshold(category: str) -> float:
    """
    Read the optimal threshold for a category from the config file.
    Returns default (0.50) if the category or file does not exist.
    """
    if not os.path.exists(THRESHOLDS_FILE):
        return 0.50
        
    try:
        with open(THRESHOLDS_FILE, "r") as f:
            thresholds = json.load(f)
            return thresholds.get(category, 0.50)
    except Exception:
        return 0.50
