
import random
import numpy as np

def run_inference(processed_image: np.ndarray) -> float:
    """
    Run mock inference.
    Returns a random anomaly score between 0 and 1.
    
    Args:
        processed_image: Numpy array of the preprocessed image
        
    Returns:
        float: Anomaly score (0.0 to 1.0)
    """
    # Mock logic: Generate random score
    # In real scenario: model.predict(processed_image)
    
    # Simulate some processing time or variation
    # For demo purposes, we'll return a score that tends to be low (normal)
    # but occasionally high (anomaly)
    
    score = random.random()
    
    # Bias towards normal for realism, but ensure we get some anomalies
    # Let's make it completely random for now as requested "random anomaly score"
    return score
