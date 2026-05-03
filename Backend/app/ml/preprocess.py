
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


_MEAN = [0.485, 0.456, 0.406]
_STD  = [0.229, 0.224, 0.225]

BLUR_THRESHOLD = 30.0

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
    "carpet"     : "none",
    "grid"       : "none",
    "leather"    : "none",
    "tile"       : "none",
    "wood"       : "none",
}

VALID_CATEGORIES = list(CATEGORY_BG_COLOR.keys())


def check_image_quality(image_path: str) -> Dict[str, Any]:
    try:
        img = cv2.imread(image_path)
        if img is None:
            return {"blur_score": 999.0, "is_blurry": False, "message": ""}

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

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
        return {"blur_score": round(blur_score, 2), "is_blurry": False, "message": message}
    except Exception:
        return {"blur_score": 999.0, "is_blurry": False, "message": ""}


def _remove_background(img: Image.Image, bg_color: str = "black") -> Image.Image:
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
    lab  = cv2.cvtColor(img_np, cv2.COLOR_RGB2LAB)
    cl   = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    lab[:, :, 0] = cl.apply(lab[:, :, 0])
    return cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)


def _percentile_stretch(img_np: np.ndarray) -> np.ndarray:
    f   = img_np.astype(np.float32) / 255.0
    p2  = np.percentile(f, 2)
    p98 = np.percentile(f, 98)
    f   = np.clip((f - p2) / (p98 - p2 + 1e-8), 0.0, 1.0)
    return (f * 255).astype(np.uint8)


def _smart_object_crop(img: Image.Image) -> Image.Image:
    try:
        img_np = np.array(img, dtype=np.uint8)
        h, w = img_np.shape[:2]
        img_area = h * w

        gray = cv2.cvtColor(img_np, cv2.COLOR_RGB2GRAY)

        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        edges = cv2.Canny(blurred, 30, 100)

        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (15, 15))
        dilated = cv2.dilate(edges, kernel, iterations=3)

        contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        if not contours:
            return img

        largest = max(contours, key=cv2.contourArea)
        contour_area = cv2.contourArea(largest)

        if contour_area < img_area * 0.10 or contour_area > img_area * 0.90:
            return img

        x, y, bw, bh = cv2.boundingRect(largest)

        pad_x = int(bw * 0.10)
        pad_y = int(bh * 0.10)
        x1 = max(0, x - pad_x)
        y1 = max(0, y - pad_y)
        x2 = min(w, x + bw + pad_x)
        y2 = min(h, y + bh + pad_y)

        if (x2 - x1) < 32 or (y2 - y1) < 32:
            return img

        cropped = img_np[y1:y2, x1:x2]
        print(f"[preprocess] Smart crop: ({w}×{h}) → ({x2-x1}×{y2-y1}) "
              f"[object fills {contour_area/img_area*100:.0f}% of frame]")
        return Image.fromarray(cropped)

    except Exception as e:
        print(f"[preprocess] Smart crop failed (non-fatal): {e}")
        return img


def preprocess_image(
    image_path: str,
    category: str = "bottle",
    target_size: Tuple[int, int] = (224, 224),
    remove_bg: bool = False,
) -> Tuple[Any, np.ndarray]:
    if not _TORCH_AVAILABLE:
        raise ImportError("torch and torchvision are required. pip install torch torchvision")

    try:
        img = Image.open(image_path)

        try:
            img = ImageOps.exif_transpose(img)
        except Exception as exif_err:
            logger.warning(f"[preprocess] EXIF transpose failed (non-fatal): {exif_err}")

        if img.mode != "RGB":
            img = img.convert("RGB")

        bg_cfg = CATEGORY_BG_COLOR.get(category, "white")

        if remove_bg and bg_cfg != "none":
            print(f"[preprocess] Real-world mode: remove_bg=True, bg_color={bg_cfg}, category={category}")
            img = _remove_background(img, bg_color=bg_cfg)

            img = _smart_object_crop(img)

            img_np = np.array(img, dtype=np.uint8)
            img_np = _apply_clahe(img_np)

            img_np = _percentile_stretch(img_np)

            img = Image.fromarray(img_np)

        elif remove_bg and bg_cfg == "none":
            print(f"[preprocess] Texture category '{category}' — skipping bg removal, applying contrast fix.")
            img_np = np.array(img, dtype=np.uint8)
            img_np = _apply_clahe(img_np)
            img_np = _percentile_stretch(img_np)
            img = Image.fromarray(img_np)

        img = img.resize(target_size, Image.LANCZOS)

        img_display: np.ndarray = np.array(img, dtype=np.uint8)

        img_tensor = TF.to_tensor(img)
        img_tensor = TF.normalize(img_tensor, mean=_MEAN, std=_STD)
        img_tensor = img_tensor.unsqueeze(0)

        return img_tensor, img_display

    except (OSError, IOError) as e:
        raise OSError(f"Could not open image at '{image_path}': {e}") from e
    except Exception as e:
        raise RuntimeError(f"Preprocessing failed for '{image_path}': {e}") from e
