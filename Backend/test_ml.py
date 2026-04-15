"""
test_ml.py — End-to-end ML pipeline test
=========================================
Tests preprocess → inference → postprocess on test_image.jpg.

Usage:
    cd Backend
    python test_ml.py
"""

import os
import sys
import traceback

# Allow imports from the Backend package root
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    sys.stdout.reconfigure(encoding="utf-8")
except AttributeError:
    pass

# ── Helpers ───────────────────────────────────────────────────────────────────

PASS = "  [PASS]"
FAIL = "  [FAIL]"
SKIP = "  [SKIP]"

results = []

def report(tag: str, label: str, detail: str = ""):
    bullet = "✅" if tag == PASS else ("❌" if tag == FAIL else "⚠️")
    line = f"{bullet}{tag} {label}"
    if detail:
        line += f" — {detail}"
    print(line)
    results.append((tag, label))


# ── Test fixtures ─────────────────────────────────────────────────────────────

TEST_IMAGE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "test_image.jpg")
OUT_DIR    = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static", "heatmaps")
OUT_PATH   = os.path.join(OUT_DIR, "test_ml_heatmap.png")
CATEGORY   = "bottle"

os.makedirs(OUT_DIR, exist_ok=True)

print()
print("=" * 60)
print("  ML Pipeline Integration Test")
print("=" * 60)

# ── CHECK: test image exists ──────────────────────────────────────────────────
print("\n[Prerequisites]")
if not os.path.exists(TEST_IMAGE):
    print(f"  ❌ test_image.jpg not found at {TEST_IMAGE}")
    print("  Create a test image first:  python test_image_gen.py")
    sys.exit(1)
else:
    print(f"  ✅ test_image.jpg found ({os.path.getsize(TEST_IMAGE)} bytes)")


# ── TEST 1: Preprocess ────────────────────────────────────────────────────────
print("\n[TEST 1] Preprocess")
img_tensor = None
img_display = None

try:
    from app.ml.preprocess import preprocess_image
    img_tensor, img_display = preprocess_image(TEST_IMAGE, category=CATEGORY)

    ok_tensor  = (img_tensor.shape == (1, 3, 224, 224))
    ok_display = (img_display.shape == (224, 224, 3))

    if ok_tensor:
        report(PASS, "img_tensor shape", str(img_tensor.shape))
    else:
        report(FAIL, "img_tensor shape", f"got {img_tensor.shape}")

    if ok_display:
        report(PASS, "img_display shape", str(img_display.shape))
    else:
        report(FAIL, "img_display shape", f"got {img_display.shape}")

    dtype_ok = str(img_tensor.dtype) == "torch.float32"
    if dtype_ok:
        report(PASS, "img_tensor dtype", "torch.float32")
    else:
        report(FAIL, "img_tensor dtype", str(img_tensor.dtype))

    uint8_ok = str(img_display.dtype) == "uint8"
    if uint8_ok:
        report(PASS, "img_display dtype", "uint8")
    else:
        report(FAIL, "img_display dtype", str(img_display.dtype))

except Exception as exc:
    report(FAIL, "preprocess_image raised exception", str(exc))
    traceback.print_exc()


# ── TEST 2: Inference ─────────────────────────────────────────────────────────
print("\n[TEST 2] Inference")
result = None

try:
    from app.ml.model_loader import model_loader

    available = model_loader.get_available_categories()
    if CATEGORY not in available:
        report(SKIP, f"category '{CATEGORY}' model not found", f"available: {available}")
    else:
        from app.ml.inference import run_inference
        result = run_inference(TEST_IMAGE, category=CATEGORY)

        score_ok   = isinstance(result.get("anomaly_score"), float) and 0.0 <= result["anomaly_score"] <= 1.0
        map_ok     = result.get("anomaly_map") is not None and len(result["anomaly_map"].shape) == 2
        bool_ok    = isinstance(result.get("is_anomaly"), bool)
        thresh_ok  = isinstance(result.get("threshold"), float)
        loaded_ok  = result.get("model_loaded") is True
        cat_ok     = result.get("category") == CATEGORY

        report(PASS if score_ok  else FAIL, "anomaly_score in [0,1]",   f"{result.get('anomaly_score'):.4f}")
        report(PASS if map_ok    else FAIL, "anomaly_map shape",        str(getattr(result.get("anomaly_map"), "shape", "?")))
        report(PASS if bool_ok   else FAIL, "is_anomaly is bool",       str(result.get("is_anomaly")))
        report(PASS if thresh_ok else FAIL, "threshold is float",       str(result.get("threshold")))
        report(PASS if loaded_ok else FAIL, "model_loaded flag",        str(result.get("model_loaded")))
        report(PASS if cat_ok    else FAIL, "category in response",     str(result.get("category")))

        print(f"\n  ℹ️  inference_time_ms : {result.get('inference_time_ms')} ms")

except Exception as exc:
    report(FAIL, "run_inference raised exception", str(exc))
    traceback.print_exc()


# ── TEST 3: Postprocess / Heatmap ────────────────────────────────────────────
print("\n[TEST 3] Postprocess (Heatmap Generation)")

try:
    import numpy as np
    from app.ml.postprocess import generate_heatmap

    # Use real anomaly_map if available, else a synthetic one
    if result is not None and result.get("anomaly_map") is not None:
        amap   = result["anomaly_map"]
        ascore = result["anomaly_score"]
        athresh = result["threshold"]
    else:
        print("  ⚠️  Using synthetic anomaly map (inference was skipped).")
        amap    = np.random.rand(224, 224).astype(np.float32)
        ascore  = 0.55
        athresh = 0.35

    returned = generate_heatmap(
        original_image_path=TEST_IMAGE,
        output_path=OUT_PATH,
        anomaly_map=amap,
        anomaly_score=ascore,
        threshold=athresh,
        category=CATEGORY,
    )

    file_ok   = os.path.exists(OUT_PATH) and os.path.getsize(OUT_PATH) > 0
    return_ok = returned == OUT_PATH

    report(PASS if file_ok   else FAIL, "heatmap PNG saved",           f"size={os.path.getsize(OUT_PATH)} bytes" if file_ok else "file missing")
    report(PASS if return_ok else FAIL, "returns output_path",          returned)

    comp_dir, comp_name = os.path.split(OUT_PATH)
    comp_path = os.path.join(comp_dir, f"comparison_{comp_name}")
    comp_ok = os.path.exists(comp_path)
    report(PASS if comp_ok else FAIL, "comparison PNG saved",          comp_path if comp_ok else "file missing")

except Exception as exc:
    report(FAIL, "generate_heatmap raised exception", str(exc))
    traceback.print_exc()


# ── Summary ───────────────────────────────────────────────────────────────────
print()
print("=" * 60)
passes = sum(1 for t, _ in results if t == PASS)
fails  = sum(1 for t, _ in results if t == FAIL)
skips  = sum(1 for t, _ in results if t == SKIP)
total  = len(results)

print(f"  Results: {passes}/{total} PASS   {fails} FAIL   {skips} SKIP")
print("=" * 60)
print()

if fails > 0:
    sys.exit(1)
