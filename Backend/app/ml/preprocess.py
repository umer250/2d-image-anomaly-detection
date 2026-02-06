
from PIL import Image
import numpy as np

def preprocess_image(image_path: str, target_size: tuple = (224, 224)) -> np.ndarray:
    """
    Preprocess the image for model inference.
    - Resize
    - Normalize
    
    Args:
        image_path: Path to the image file
        target_size: Tuple of (width, height)
        
    Returns:
        Preprocessed image as numpy array
    """
    try:
        # Load image
        img = Image.open(image_path).convert('RGB')
        
        # Resize
        img = img.resize(target_size)
        
        # Convert to numpy array
        img_array = np.array(img).astype(np.float32)
        
        # Normalize (0-1)
        img_array /= 255.0
        
        # Add batch dimension if needed (usually models expect batch)
        # img_array = np.expand_dims(img_array, axis=0)
        
        return img_array
    except Exception as e:
        print(f"Error in preprocessing: {e}")
        raise e
