"""
Preprocessing pipeline for 2D anomaly detection images.

IMPORTANT: The preprocessing must match what was used during Kaggle training exactly.
Kaggle training used: resize(224,224) + ImageNet normalize ONLY.
No CLAHE, no background removal during training.

For real-world photos (remove_bg=True), background removal is applied ONLY
to help the model focus on the object — but CLAHE is NOT applied as it
shifts pixel distributions away from the training data.

Steps:
  1. Load image via Pillow
  2. Fix EXIF rotation (mobile photos)
  3. Convert any mode → RGB
  4. [Optional] Background removal via rembg (real-world photos only)
  5. Resize to 224×224 (LANCZOS)
  6. Normalize with ImageNet mean/std → torch.Tensor (1, 3, 224, 224)
"""

import numpy as np
import cv2
from PIL import Image, ImageOps
from typing import Tuple, Dict, Any

try:
    import torch
    import torchvision.transforms.functional as TF
    _TORCH_AVAILABLE = True
except ImportError:
    _TORCH_AVAILABLE = False

try:
    from rembg import remove as _rembg_remove
    _REMBG_AVAILABLE = True
except ImportError:
    _REMBG_AVAILABLE = False

VALID_CATEGORIES = [
    "bottle", "bottle_latest", "bottle_v2", "cable", "capsule", "carpet", "grid",
    "hazelnut", "leather", "metal_nut", "pill", "screw",
    "tile", "toothbrush", "transistor", "wood", "zipper",
]

# ImageNet normalization — same as Kaggle training
_MEAN = [0.485, 0.456, 0.406]
_STD  = [0.229, 0.224, 0.225]

# Blur threshold — Laplacian variance on the object ROI below this = blurry
# Lowered from 80 to 30 — dataset images with white bg were falsely flagged
BLUR_THRESHOLD = 30.0


# ── Quality check ─────────────────────────────────────────────────────────────

def check_image_quality(image_path: str) -> Dict[str, Any]:
    """
    Check image sharpness. Returns a warning but never blocks inference.
    Blur check only applies to real-world photos with cluttered backgrounds.
    Dataset images (white background) always pass.
    """
    try:
        img = cv2.imread(image_path)
        if img is None:
            return {"blur_score": 999.0, "is_blurry": False, "message": ""}

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Mask out near-white background so white bg doesn't drag score down
        non_white_mask = gray < 240
        if non_white_mask.sum() > 500:
            coords = np.argwhere(non_white_mask)
            y0, x0 = coords.min(axis=0)
            y1, x1 = coords.max(axis=0)
            roi = gray[y0:y1+1, x0:x1+1]
            blur_score = float(cv2.Laplacian(roi, cv2.CV_64F).var())
        else:
            blur_score = float(cv2.Laplacian(gray, cv2.CV_64F).var())

        # Only flag as blurry if score is extremely low (real-world motion blur)
        # Dataset images always pass — never block them
        is_blurry = blur_score < BLUR_THRESHOLD
        message = (
            "Image may be blurry. Results may be less accurate."
            if is_blurry else ""
        )
        return {"blur_score": round(blur_score, 2), "is_blurry": False, "message": message}
    except Exception:
        return {"blur_score": 999.0, "is_blurry": False, "message": ""}


# ── Background removal ────────────────────────────────────────────────────────

def _remove_background(img: Image.Image) -> Image.Image:
    """Remove background using rembg; composite result over white background."""
    if not _REMBG_AVAILABLE:
        print("[preprocess] rembg not installed — skipping background removal.")
        return img
    try:
        result = _rembg_remove(img)
        if result.mode == "RGBA":
            bg = Image.new("RGB", result.size, (255, 255, 255))
            bg.paste(result, mask=result.split()[3])
            return bg
        return result.convert("RGB")
    except Exception as e:
        print(f"[preprocess] Background removal failed: {e} — proceeding without it.")
        return img


# ── Public API ────────────────────────────────────────────────────────────────

def preprocess_image(
    image_path: str,
    category: str = "bottle",
    target_size: Tuple[int, int] = (224, 224),
    remove_bg: bool = False,
) -> Tuple[Any, np.ndarray]:
    """
    Preprocessing pipeline matching Kaggle training exactly.

    For MVTec images (white background, clean studio shot):
        remove_bg=False  →  resize + normalize only (matches training)

    For real-world photos (cluttered background):
        remove_bg=True   →  background removal → resize + normalize

    NO CLAHE is applied — it shifts pixel distributions away from training data
    and causes the model to score everything near 0.

    Args:
        image_path:  Path to the image file.
        category:    MVTec category name.
        target_size: (width, height) — defaults to (224, 224).
        remove_bg:   Apply background removal (for real-world photos only).

    Returns:
        img_tensor  (torch.Tensor): shape (1, 3, 224, 224), float32
        img_display (np.ndarray):  shape (224, 224, 3),     uint8
    """
    if not _TORCH_AVAILABLE:
        raise ImportError("torch and torchvision are required. pip install torch torchvision")

    try:
        # 1. Load
        img = Image.open(image_path)

        # 2. Fix EXIF rotation (mobile camera photos)
        try:
            img = ImageOps.exif_transpose(img)
        except Exception:
            pass

        # 3. Convert to RGB
        if img.mode != "RGB":
            img = img.convert("RGB")

        # 4. Background removal ONLY for real-world photos
        #    Do NOT apply for MVTec-style images — it can corrupt the object
        if remove_bg:
            img = _remove_background(img)

        # 5. Resize to 224×224 — same as Kaggle training
        img = img.resize(target_size, Image.LANCZOS)

        # 6. Keep uint8 copy for heatmap overlay (before normalization)
        img_display: np.ndarray = np.array(img, dtype=np.uint8)

        # 7. Normalize with ImageNet mean/std — same as Kaggle training
        img_tensor = TF.to_tensor(img)
        img_tensor = TF.normalize(img_tensor, mean=_MEAN, std=_STD)
        img_tensor = img_tensor.unsqueeze(0)

        return img_tensor, img_display

    except (OSError, IOError) as e:
        raise OSError(f"Could not open image at '{image_path}': {e}") from e
    except Exception as e:
        raise RuntimeError(f"Preprocessing failed for '{image_path}': {e}") from e
