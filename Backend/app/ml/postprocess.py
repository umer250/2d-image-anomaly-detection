
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
    try:
        base_img = cv2.imread(original_image_path)
        if base_img is None:
            raise FileNotFoundError(f"Could not load image at '{original_image_path}'.")
        orig_h, orig_w = base_img.shape[:2]

        resized_map = cv2.resize(
            anomaly_map.astype(np.float32),
            (orig_w, orig_h),
            interpolation=cv2.INTER_CUBIC,
        )
        resized_map = gaussian_filter(resized_map, sigma=4)

        safe_map = np.clip(resized_map, 0.0, 1.0)
        norm_map = (safe_map * 255).astype(np.uint8)

        os.makedirs(
            os.path.dirname(output_path) if os.path.dirname(output_path) else ".",
            exist_ok=True,
        )

        hot_colored = cv2.applyColorMap(norm_map, cv2.COLORMAP_HOT)
        hot_path = _variant_path(output_path, "_hot")
        cv2.imwrite(hot_path, hot_colored)

        jet_colored = cv2.applyColorMap(norm_map, cv2.COLORMAP_JET)
        overlay = cv2.addWeighted(base_img, 0.5, jet_colored, 0.5, 0)
        cv2.imwrite(output_path, overlay)

        contour_img = _draw_contours(base_img, safe_map, norm_map, anomaly_score, threshold)
        contour_path = _variant_path(output_path, "_contour")
        cv2.imwrite(contour_path, contour_img)

        comp_path = _save_kaggle_style_comparison(
            base_img, hot_colored, overlay, contour_img,
            output_path, anomaly_score, threshold, category,
        )

        return {
            "overlay":    output_path,
            "hot":        hot_path,
            "contour":    contour_path,
            "comparison": comp_path,
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
    orig_h, orig_w = base_img.shape[:2]

    if anomaly_score <= threshold:
        output = base_img.copy()
        label = "NORMAL"
        font = cv2.FONT_HERSHEY_SIMPLEX
        (tw, th), _ = cv2.getTextSize(label, font, 0.7, 2)
        cv2.rectangle(output, (8, 8), (tw + 20, th + 20), (0, 180, 0), -1)
        cv2.putText(output, label, (14, th + 14), font, 0.7, (255, 255, 255), 2, cv2.LINE_AA)
        return output

    _, max_val, _, max_loc = cv2.minMaxLoc(norm_map)
    cx_peak, cy_peak = max_loc

    p97 = int(np.percentile(norm_map, 97))
    dynamic_thresh = max(p97, 50)

    _, binary_mask = cv2.threshold(norm_map, dynamic_thresh, 255, cv2.THRESH_BINARY)
    binary_mask = binary_mask.astype(np.uint8)

    k9 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
    k3 = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    binary_mask = cv2.morphologyEx(binary_mask, cv2.MORPH_OPEN, k3)
    binary_mask = cv2.dilate(binary_mask, k9, iterations=2)
    binary_mask = cv2.morphologyEx(binary_mask, cv2.MORPH_CLOSE, k9)

    contours, _ = cv2.findContours(binary_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    img_area = orig_h * orig_w
    min_area  = img_area * 0.00001
    max_area  = img_area * 0.90
    diag      = (orig_w**2 + orig_h**2) ** 0.5
    max_dist  = diag * 0.15

    valid_contours = []
    for cnt in contours:
        if not (min_area < cv2.contourArea(cnt) < max_area):
            continue
        dist = cv2.pointPolygonTest(cnt, (float(cx_peak), float(cy_peak)), True)
        if dist >= 0 or abs(dist) < max_dist:
            valid_contours.append((cnt, dist))

    valid_contours.sort(key=lambda x: -x[1])
    valid_contours = [c for c, _ in valid_contours[:2]]

    output = cv2.addWeighted(base_img, 0.75, np.zeros_like(base_img), 0.25, 0)
    font = cv2.FONT_HERSHEY_SIMPLEX

    if not valid_contours:
        fpad = max(orig_w, orig_h) // 10
        fx1 = max(0, cx_peak - fpad)
        fy1 = max(0, cy_peak - fpad)
        fx2 = min(orig_w, cx_peak + fpad)
        fy2 = min(orig_h, cy_peak + fpad)
        cv2.rectangle(output, (fx1, fy1), (fx2, fy2), (0, 0, 255), 4)
        cv2.circle(output, (cx_peak, cy_peak), 8, (57, 255, 20), -1)
        cv2.circle(output, (cx_peak, cy_peak), 8, (255, 255, 255), 2)
        label_fb = f"Defect #1  {anomaly_score*100:.1f}%"
        (lw, lh), _ = cv2.getTextSize(label_fb, font, 0.45, 1)
        cv2.rectangle(output, (fx1, max(0, fy1 - lh - 8)), (fx1 + lw + 10, fy1), (0, 0, 200), -1)
        cv2.putText(output, label_fb, (fx1 + 4, fy1 - 4), font, 0.45, (255, 255, 255), 1, cv2.LINE_AA)
    else:
        for i, cnt in enumerate(valid_contours):
            cv2.drawContours(output, [cnt], -1, (57, 255, 20), 3, cv2.LINE_AA)

            x, y, w, h = cv2.boundingRect(cnt)
            pad = 8
            bx = max(0, x - pad)
            by = max(0, y - pad)
            bw = min(orig_w - bx, w + 2 * pad)
            bh = min(orig_h - by, h + 2 * pad)
            cv2.rectangle(output, (bx, by), (bx + bw, by + bh), (0, 0, 255), 4)

            corner_len = max(12, min(bw, bh) // 5)
            cw = 4
            for pts in [
                [(bx, by), (bx + corner_len, by)],
                [(bx, by), (bx, by + corner_len)],
                [(bx + bw, by), (bx + bw - corner_len, by)],
                [(bx + bw, by), (bx + bw, by + corner_len)],
                [(bx, by + bh), (bx + corner_len, by + bh)],
                [(bx, by + bh), (bx, by + bh - corner_len)],
                [(bx + bw, by + bh), (bx + bw - corner_len, by + bh)],
                [(bx + bw, by + bh), (bx + bw, by + bh - corner_len)],
            ]:
                cv2.line(output, pts[0], pts[1], (0, 255, 255), cw)

            M = cv2.moments(cnt)
            if M["m00"] > 0:
                cx = int(M["m10"] / M["m00"])
                cy = int(M["m01"] / M["m00"])
                cv2.circle(output, (cx, cy), 7, (0, 165, 255), -1)
                cv2.circle(output, (cx, cy), 7, (255, 255, 255), 2)

            label = f"Defect #{i+1}  {anomaly_score*100:.1f}%"
            font_scale = 0.45
            (lw, lh), _ = cv2.getTextSize(label, font, font_scale, 1)
            tab_y1 = max(0, by - lh - 10)
            tab_y2 = max(lh + 10, by)
            cv2.rectangle(output, (bx, tab_y1), (bx + lw + 12, tab_y2), (0, 0, 200), -1)
            cv2.putText(output, label, (bx + 5, tab_y2 - 4), font, font_scale, (255, 255, 255), 1, cv2.LINE_AA)

    score_label = f"Score: {anomaly_score*100:.1f}%"
    (sw, sh), _ = cv2.getTextSize(score_label, font, 0.5, 1)
    bx2 = orig_w - sw - 18
    cv2.rectangle(output, (bx2 - 6, 8), (orig_w - 8, sh + 18), (0, 0, 180), -1)
    cv2.putText(output, score_label, (bx2, sh + 12), font, 0.5, (255, 255, 255), 1, cv2.LINE_AA)

    return output


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
            resized = cv2.resize(img, (TARGET_W, TARGET_H), interpolation=cv2.INTER_AREA)
            header = np.full((HEADER_H, TARGET_W, 3), DARK_BG, dtype=np.uint8)
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
