"""
Preprocessing pipeline for 2D anomaly detection images.

TWO MODES:
─────────────────────────────────────────────────────────────────
1. Dataset mode  (remove_bg=False)  — MVTec-style studio images
   Steps: Load → EXIF fix → RGB → Resize 224×224 → ImageNet normalize
   Used for: MVTec training images, dataset test images

2. Real-world mode (remove_bg=True) — phone / camera photos
   Steps: Load → EXIF fix → RGB → BG removal → CLAHE → Percentile
          stretch → Resize 224×224 → ImageNet normalize
   Used for: user-uploaded real-world images via the web UI

WHY CLAHE for real-world:
   Phone cameras have variable exposure, contrast, and white balance.
   CLAHE (in LAB space, L-channel only) normalises the lightness without
   shifting hue.  Percentile stretch then maps the pixel range to match
   MVTec studio lighting (p2–p98).  Without these, the model sees
   "alien" pixel distributions → flat / incorrect heatmaps.

WHY NO CLAHE for dataset images:
   MVTec images were shot under controlled studio conditions with
   consistent lighting.  Applying CLAHE would add artificial variation
   and degrade the anomaly map quality.
─────────────────────────────────────────────────────────────────
"""

import io
import logging
import numpy as np
import cv2
from PIL import Image, ImageOps
from typing import Tuple, Dict, Any

logger = logging.getLogger("app.ml.preprocess")

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


# ── Constants ─────────────────────────────────────────────────────────────────

# ImageNet normalization — must match WideResNet50 pretraining and Kaggle training
_MEAN = [0.485, 0.456, 0.406]
_STD  = [0.229, 0.224, 0.225]

# Blur threshold (Laplacian variance)
BLUR_THRESHOLD = 30.0

# ── Per-category background colour for rembg composite ───────────────────────
# 'black' → bottle, cable, capsule, metal_nut, transistor  (dark MVTec background)
# 'white' → hazelnut, pill, screw, toothbrush, zipper      (light MVTec background)
# 'none'  → textures (no bg removal at all regardless of remove_bg flag)
CATEGORY_BG_COLOR: Dict[str, str] = {
    "bottle"     : "black",
    "cable"      : "black",
    "capsule"    : "black",
    "metal_nut"  : "black",
    "transistor" : "black",
    "hazelnut"   : "white",
    "pill"       : "white",
    "screw"      : "white",
    "toothbrush" : "white",
    "zipper"     : "white",
    # Textures — bg removal skipped even if remove_bg=True
    "carpet"     : "none",
    "grid"       : "none",
    "leather"    : "none",
    "tile"       : "none",
    "wood"       : "none",
}

VALID_CATEGORIES = list(CATEGORY_BG_COLOR.keys())


# ── Quality check ─────────────────────────────────────────────────────────────

def check_image_quality(image_path: str) -> Dict[str, Any]:
    """
    Check image sharpness via Laplacian variance.
    Returns a warning flag but never blocks inference.
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
            roi = gray[y0:y1 + 1, x0:x1 + 1]
            blur_score = float(cv2.Laplacian(roi, cv2.CV_64F).var())
        else:
            blur_score = float(cv2.Laplacian(gray, cv2.CV_64F).var())

        is_blurry = blur_score < BLUR_THRESHOLD
        message   = "Image may be blurry. Results may be less accurate." if is_blurry else ""
        # Never block inference — only warn
        return {"blur_score": round(blur_score, 2), "is_blurry": False, "message": message}
    except Exception:
        return {"blur_score": 999.0, "is_blurry": False, "message": ""}


# ── Real-world helpers ────────────────────────────────────────────────────────

def _remove_background(img: Image.Image, bg_color: str = "black") -> Image.Image:
    """
    Remove background using rembg and composite on a solid colour.

    bg_color='black'  → MVTec dark background (bottle, cable, capsule …)
    bg_color='white'  → MVTec light background (hazelnut, pill, screw …)
    """
    if not _REMBG_AVAILABLE:
        print("[preprocess] rembg not installed — skipping background removal.")
        return img
    try:
        buf  = io.BytesIO()
        img.save(buf, format="PNG")
        raw  = _rembg_remove(buf.getvalue())
        rgba = Image.open(io.BytesIO(raw)).convert("RGBA")
        rgb  = (0, 0, 0) if bg_color == "black" else (255, 255, 255)
        bg   = Image.new("RGB", rgba.size, rgb)
        bg.paste(rgba.convert("RGB"), mask=rgba.split()[3])
        return bg
    except Exception as e:
        print(f"[preprocess] Background removal failed: {e} — using original.")
        return img.convert("RGB")


def _apply_clahe(img_np: np.ndarray) -> np.ndarray:
    """
    CLAHE in LAB space — normalises lightness without shifting hue/saturation.
    Applied only to the L channel to avoid colour distortion.
    Fixes dark, overexposed, or unevenly lit phone photos.
    """
    lab  = cv2.cvtColor(img_np, cv2.COLOR_RGB2LAB)
    cl   = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    lab[:, :, 0] = cl.apply(lab[:, :, 0])
    return cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)


def _percentile_stretch(img_np: np.ndarray) -> np.ndarray:
    """
    Percentile contrast stretch (p2–p98) to match MVTec studio lighting.
    Maps the usable pixel range to [0, 255], clipping extreme outliers.
    This bridges the gap between phone camera exposure and MVTec distribution.
    """
    f   = img_np.astype(np.float32) / 255.0
    p2  = np.percentile(f, 2)
    p98 = np.percentile(f, 98)
    f   = np.clip((f - p2) / (p98 - p2 + 1e-8), 0.0, 1.0)
    return (f * 255).astype(np.uint8)


# ── Public API ────────────────────────────────────────────────────────────────

def preprocess_image(
    image_path: str,
    category: str = "bottle",
    target_size: Tuple[int, int] = (224, 224),
    remove_bg: bool = False,
) -> Tuple[Any, np.ndarray]:
    """
    Unified preprocessing pipeline.

    Dataset mode (remove_bg=False):
        Load → EXIF fix → RGB → Resize 224×224 → ImageNet normalize
        Matches Kaggle training exactly — no augmentation, no CLAHE.

    Real-world mode (remove_bg=True):
        Load → EXIF fix → RGB
        → BG removal (category-aware bg_color)
        → CLAHE contrast fix  (normalise phone camera lighting)
        → Percentile stretch  (match MVTec studio distribution)
        → Resize 224×224
        → ImageNet normalize

    NOTE: Texture categories (carpet, grid, leather, tile, wood) skip
    background removal even if remove_bg=True — they fill the frame.

    Args:
        image_path  : Path to image file.
        category    : MVTec category name (used for bg_color selection).
        target_size : (width, height) — defaults to (224, 224).
        remove_bg   : True → apply real-world pipeline (bg removal + CLAHE).

    Returns:
        img_tensor  (torch.Tensor) : shape (1, 3, 224, 224), float32
        img_display (np.ndarray)   : shape (224, 224, 3),    uint8  (for heatmap)
    """
    if not _TORCH_AVAILABLE:
        raise ImportError("torch and torchvision are required. pip install torch torchvision")

    try:
        # ── 1. Load ───────────────────────────────────────────────────────────
        img = Image.open(image_path)

        # ── 2. EXIF rotation fix (portrait phone photos can be rotated 90°) ──
        try:
            img = ImageOps.exif_transpose(img)
        except Exception as exif_err:
            logger.warning(f"[preprocess] EXIF transpose failed (non-fatal): {exif_err}")

        # ── 3. Convert to RGB ─────────────────────────────────────────────────
        if img.mode != "RGB":
            img = img.convert("RGB")

        # ── 4. Real-world pipeline ────────────────────────────────────────────
        bg_cfg = CATEGORY_BG_COLOR.get(category, "white")

        if remove_bg and bg_cfg != "none":
            # 4a. Background removal (category-aware bg colour)
            print(f"[preprocess] Real-world mode: remove_bg=True, bg_color={bg_cfg}, category={category}")
            img = _remove_background(img, bg_color=bg_cfg)

            # 4b. CLAHE — normalise lighting from phone camera
            img_np = np.array(img, dtype=np.uint8)
            img_np = _apply_clahe(img_np)

            # 4c. Percentile contrast stretch — match MVTec studio distribution
            img_np = _percentile_stretch(img_np)

            img = Image.fromarray(img_np)

        elif remove_bg and bg_cfg == "none":
            # Texture category — skip bg removal, but still apply contrast fix
            print(f"[preprocess] Texture category '{category}' — skipping bg removal, applying contrast fix.")
            img_np = np.array(img, dtype=np.uint8)
            img_np = _apply_clahe(img_np)
            img_np = _percentile_stretch(img_np)
            img = Image.fromarray(img_np)

        # ── 5. Resize to 224×224 ──────────────────────────────────────────────
        img = img.resize(target_size, Image.LANCZOS)

        # ── 6. uint8 copy for heatmap generation (before normalization) ────────
        img_display: np.ndarray = np.array(img, dtype=np.uint8)

        # ── 7. ImageNet normalize → tensor (1, 3, 224, 224) ───────────────────
        img_tensor = TF.to_tensor(img)
        img_tensor = TF.normalize(img_tensor, mean=_MEAN, std=_STD)
        img_tensor = img_tensor.unsqueeze(0)

        return img_tensor, img_display

    except (OSError, IOError) as e:
        raise OSError(f"Could not open image at '{image_path}': {e}") from e
    except Exception as e:
        raise RuntimeError(f"Preprocessing failed for '{image_path}': {e}") from e
