"""
Postprocessing — Heatmap Generation
=====================================
Visualization matches the Kaggle training output exactly:
  Panel 1: Original Image
  Panel 2: Anomaly Map (HOT colormap + colorbar, black background)
  Panel 3: Heatmap Overlay (JET blend on original)
  Panel 4: Defect Contours (dimmed original + red contours + bounding box)

Header bar: green = NORMAL, red = ANOMALY DETECTED
"""

import os
import logging
import cv2
import numpy as np
from scipy.ndimage import gaussian_filter
from typing import Dict

logger = logging.getLogger("app.ml.postprocess")


def generate_heatmap(
    original_image_path: str,
    output_path: str,
    anomaly_map: np.ndarray,
    anomaly_score: float,
    threshold: float = 0.7054,
    category: str = "bottle",
) -> Dict[str, str]:
    """
    Generate heatmap visualizations matching the Kaggle training output.

    Returns:
        Dict with keys 'overlay', 'hot', 'contour', 'comparison'
    """
    try:
        base_img = cv2.imread(original_image_path)
        if base_img is None:
            raise FileNotFoundError(f"Could not load image at '{original_image_path}'.")
        orig_h, orig_w = base_img.shape[:2]

        # Resize anomaly map to original image size
        resized_map = cv2.resize(
            anomaly_map.astype(np.float32),
            (orig_w, orig_h),
            interpolation=cv2.INTER_CUBIC,
        )
        # Smooth (sigma=4 matches Kaggle)
        resized_map = gaussian_filter(resized_map, sigma=4)

        # Normalize to [0, 1]
        safe_map = np.clip(resized_map, 0, 1)
        norm_map = (safe_map * 255).astype(np.uint8)

        os.makedirs(
            os.path.dirname(output_path) if os.path.dirname(output_path) else ".",
            exist_ok=True,
        )

        # ── Panel 2: HOT anomaly map (black bg, matches Kaggle) ──────────────
        hot_colored = cv2.applyColorMap(norm_map, cv2.COLORMAP_HOT)
        hot_path = _variant_path(output_path, "_hot")
        cv2.imwrite(hot_path, hot_colored)

        # ── Panel 3: JET overlay (matches Kaggle heatmap overlay) ────────────
        jet_colored = cv2.applyColorMap(norm_map, cv2.COLORMAP_JET)
        # Blend: 50% original + 50% JET (matches Kaggle visual style)
        overlay = cv2.addWeighted(base_img, 0.5, jet_colored, 0.5, 0)
        cv2.imwrite(output_path, overlay)

        # ── Panel 4: Contour map ──────────────────────────────────────────────
        contour_img = _draw_contours(base_img, safe_map, norm_map, anomaly_score, threshold)
        contour_path = _variant_path(output_path, "_contour")
        cv2.imwrite(contour_path, contour_img)

        # ── 4-panel comparison (matches Kaggle layout) ────────────────────────
        comp_path = _save_kaggle_style_comparison(
            base_img, hot_colored, overlay, contour_img,
            output_path, anomaly_score, threshold, category,
        )

        return {
            "overlay":     output_path,
            "hot":         hot_path,
            "contour":     contour_path,
            "comparison":  comp_path,
        }

    except Exception as e:
        logger.error(f"[postprocess] Heatmap generation error: {e}", exc_info=True)
        try:
            import shutil
            os.makedirs(
                os.path.dirname(output_path) if os.path.dirname(output_path) else ".",
                exist_ok=True,
            )
            shutil.copy2(original_image_path, output_path)
        except Exception as copy_err:
            logger.error(f"[postprocess] Fallback copy also failed: {copy_err}")
        return {"overlay": output_path, "hot": output_path, "contour": output_path, "comparison": output_path}


# ── Helpers ───────────────────────────────────────────────────────────────────

def _variant_path(base_path: str, suffix: str) -> str:
    root, ext = os.path.splitext(base_path)
    return f"{root}{suffix}{ext or '.png'}"


def _draw_contours(
    base_img: np.ndarray,
    safe_map: np.ndarray,
    norm_map: np.ndarray,
    anomaly_score: float,
    threshold: float,
) -> np.ndarray:
    """Draw defect contours on a dimmed copy of the original image."""
    orig_h, orig_w = base_img.shape[:2]
    # Dim background (matches Kaggle contour panel)
    contour_img = (base_img.astype(np.float32) * 0.5).astype(np.uint8)

    if anomaly_score <= threshold:
        return contour_img

    # 85th percentile threshold for binary mask
    dynamic_thresh = float(np.percentile(safe_map, 85)) * 255
    _, binary_mask = cv2.threshold(norm_map, dynamic_thresh, 255, cv2.THRESH_BINARY)
    binary_mask = binary_mask.astype(np.uint8)

    k7 = cv2.getStructuringElement(cv2.MORPH_RECT, (7, 7))
    binary_mask = cv2.morphologyEx(binary_mask, cv2.MORPH_CLOSE, k7)
    binary_mask = cv2.morphologyEx(binary_mask, cv2.MORPH_OPEN, k7)

    contours, _ = cv2.findContours(binary_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    img_area = orig_h * orig_w
    valid_contours = [
        cnt for cnt in contours
        if 300 < cv2.contourArea(cnt) < img_area * 0.60
    ]
    valid_contours = sorted(valid_contours, key=cv2.contourArea, reverse=True)[:3]

    cv2.drawContours(contour_img, valid_contours, -1, (0, 0, 255), 2)

    if valid_contours:
        x, y, w, h = cv2.boundingRect(valid_contours[0])
        cv2.rectangle(contour_img, (x, y), (x + w, y + h), (0, 0, 255), 2)

    return contour_img


def _save_kaggle_style_comparison(
    original: np.ndarray,
    hot_map: np.ndarray,
    overlay: np.ndarray,
    contour_img: np.ndarray,
    output_path: str,
    score: float,
    threshold: float,
    category: str,
) -> str:
    """
    Save a 4-panel comparison matching the Kaggle training visualization:
      [Original Image] [Anomaly Map] [Heatmap Overlay] [Defect Contours]
    with a coloured header bar showing verdict + score + threshold.
    """
    try:
        TARGET_H = 300  # panel height
        TARGET_W = 300  # panel width

        font       = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = 0.55
        thickness  = 1
        HEADER_H   = 50
        DARK_BG    = (20, 20, 20)

        is_anomaly = score > threshold
        verdict    = "ANOMALY DETECTED" if is_anomaly else "NORMAL"
        hdr_color  = (0, 0, 220) if is_anomaly else (0, 180, 0)
        score_txt  = f"{verdict} | Score: {score * 100:.1f}% | Threshold: {threshold * 100:.1f}%"

        def _make_panel(img: np.ndarray, label: str) -> np.ndarray:
            """Resize image to TARGET_H×TARGET_W and add a label header."""
            resized = cv2.resize(img, (TARGET_W, TARGET_H), interpolation=cv2.INTER_AREA)
            header = np.full((HEADER_H, TARGET_W, 3), DARK_BG, dtype=np.uint8)
            # Label in white, centred vertically
            (tw, th), _ = cv2.getTextSize(label, font, font_scale, thickness)
            tx = max(5, (TARGET_W - tw) // 2)
            ty = (HEADER_H + th) // 2
            cv2.putText(header, label, (tx, ty), font, font_scale, (200, 200, 200), thickness, cv2.LINE_AA)
            return np.vstack([header, resized])

        panels = [
            _make_panel(original,    "Original Image"),
            _make_panel(hot_map,     "Anomaly Map"),
            _make_panel(overlay,     "Heatmap Overlay"),
            _make_panel(contour_img, "Defect Contours"),
        ]

        comparison = np.hstack(panels)
        total_w = comparison.shape[1]

        # Top verdict bar (full width)
        verdict_bar = np.full((HEADER_H, total_w, 3), hdr_color, dtype=np.uint8)
        (tw, th), _ = cv2.getTextSize(score_txt, font, font_scale, thickness)
        tx = max(10, (total_w - tw) // 2)
        ty = (HEADER_H + th) // 2
        cv2.putText(verdict_bar, score_txt, (tx, ty), font, font_scale, (255, 255, 255), thickness, cv2.LINE_AA)

        final = np.vstack([verdict_bar, comparison])

        dir_name, file_name = os.path.split(output_path)
        comp_path = os.path.join(dir_name, f"comparison_{file_name}")
        cv2.imwrite(comp_path, final)
        return comp_path

    except Exception as exc:
        logger.warning(f"[postprocess] Comparison image skipped: {exc}")
        return output_path
