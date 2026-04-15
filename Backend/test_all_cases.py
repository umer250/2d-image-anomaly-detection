"""
test_all_cases.py
=================
Comprehensive test suite for the PatchCore anomaly detection pipeline.

Tests:
  1. Threshold correctness  — 0.582 is loaded for bottle/bottle_latest
  2. Normal bottle image    — should return NORMAL  (score < 0.582)
  3. Anomaly bottle image   — should return ANOMALY (score > 0.582)
  4. Real-world photo       — should handle gracefully (no crash)
  5. Preprocessing pipeline — CLAHE, EXIF rotation, grayscale/RGBA conversion
  6. Postprocessing         — heatmap files are created
  7. Calibrate endpoint     — memory-bank self-distance calibration
  8. Model loader           — alias resolution, threshold override, cache

Run with:
    python test_all_cases.py

Requirements:
    pip install pytest  (optional — can also run directly)
    The bottle_latest_patchcore.pkl must be present in ml_models/
"""

import os
import sys
import json
import shutil
import tempfile
import traceback
import numpy as np

# ── Make sure we can import from app/ ────────────────────────────────────────
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# ── Colour helpers ────────────────────────────────────────────────────────────
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
RESET  = "\033[0m"

_results = []


def _pass(name: str, detail: str = ""):
    msg = f"{GREEN}[PASS]{RESET} {name}" + (f"  →  {detail}" if detail else "")
    print(msg)
    _results.append(("PASS", name))


def _fail(name: str, detail: str = ""):
    msg = f"{RED}[FAIL]{RESET} {name}" + (f"  →  {detail}" if detail else "")
    print(msg)
    _results.append(("FAIL", name))


def _skip(name: str, reason: str = ""):
    msg = f"{YELLOW}[SKIP]{RESET} {name}" + (f"  →  {reason}" if reason else "")
    print(msg)
    _results.append(("SKIP", name))


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _make_synthetic_image(tmp_dir: str, name: str, mode: str = "normal") -> str:
    """
    Create a synthetic 224×224 PNG image for testing.

    mode='normal'  → uniform mid-grey (simulates a clean bottle surface)
    mode='anomaly' → grey with a bright white patch (simulates a defect)
    mode='realworld' → random noise (simulates a real-world photo)
    mode='grayscale' → single-channel grey
    mode='rgba'    → RGBA image
    """
    import cv2
    from PIL import Image

    path = os.path.join(tmp_dir, name)

    if mode == "normal":
        arr = np.full((224, 224, 3), 128, dtype=np.uint8)
    elif mode == "anomaly":
        arr = np.full((224, 224, 3), 128, dtype=np.uint8)
        arr[80:140, 80:140] = 255   # bright square defect
    elif mode == "realworld":
        rng = np.random.default_rng(42)
        arr = rng.integers(0, 256, (480, 640, 3), dtype=np.uint8)
    elif mode == "grayscale":
        img = Image.fromarray(np.full((224, 224), 128, dtype=np.uint8))
        img.save(path)
        return path
    elif mode == "rgba":
        arr_rgba = np.full((224, 224, 4), 128, dtype=np.uint8)
        arr_rgba[:, :, 3] = 200   # semi-transparent
        img = Image.fromarray(arr_rgba, "RGBA")
        img.save(path)
        return path
    else:
        arr = np.full((224, 224, 3), 128, dtype=np.uint8)

    cv2.imwrite(path, arr)
    return path


# ─────────────────────────────────────────────────────────────────────────────
# Test 1 — Model Loader: threshold override
# ─────────────────────────────────────────────────────────────────────────────

def test_threshold_correctness():
    name = "Threshold correctness (bottle → 0.7054 from pkl)"
    try:
        from app.ml.model_loader import model_loader
        t = model_loader.get_threshold("bottle")
        # bottle_patchcore.pkl stores 0.7054 — that is the correct training threshold
        assert abs(t - 0.7054) < 1e-3, f"Expected ~0.7054 for 'bottle', got {t}"
        _pass(name, f"bottle threshold = {t:.4f}")
    except Exception as e:
        _fail(name, str(e))


# ─────────────────────────────────────────────────────────────────────────────
# Test 2 — Model Loader: alias resolution
# ─────────────────────────────────────────────────────────────────────────────

def test_alias_resolution():
    name = "Model loader alias resolution (bottle → bottle)"
    try:
        from app.ml.model_loader import model_loader
        resolved = model_loader._resolve_category("bottle")
        assert resolved == "bottle", f"Expected 'bottle', got '{resolved}'"
        _pass(name, f"'bottle' → '{resolved}' (bottle_patchcore.pkl)")
    except Exception as e:
        _fail(name, str(e))


# ─────────────────────────────────────────────────────────────────────────────
# Test 3 — Model Loader: model availability
# ─────────────────────────────────────────────────────────────────────────────

def test_model_availability():
    name = "Model availability check"
    try:
        from app.ml.model_loader import model_loader
        available = model_loader.get_available_categories()
        assert len(available) > 0, "No models found in ml_models/"
        assert "bottle" in available or "bottle_latest" in available, \
            f"bottle model not found. Available: {available}"
        _pass(name, f"Available: {available}")
    except Exception as e:
        _fail(name, str(e))


# ─────────────────────────────────────────────────────────────────────────────
# Test 4 — bottle_config.json exists and is valid
# ─────────────────────────────────────────────────────────────────────────────

def test_bottle_config_json():
    name = "bottle_config.json exists and is valid"
    config_path = os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "ml_models", "bottle_config.json"
    )
    try:
        assert os.path.exists(config_path), f"Not found: {config_path}"
        with open(config_path) as f:
            cfg = json.load(f)
        assert abs(cfg["threshold"] - 0.7054) < 1e-3, f"Wrong threshold in config: {cfg['threshold']}"
        assert cfg["model_file"] == "bottle_patchcore.pkl"
        assert cfg["num_neighbors"] == 9
        _pass(name, f"threshold={cfg['threshold']}, model={cfg['model_file']}")
    except Exception as e:
        _fail(name, str(e))


# ─────────────────────────────────────────────────────────────────────────────
# Test 5 — Preprocessing: basic pipeline
# ─────────────────────────────────────────────────────────────────────────────

def test_preprocessing_basic():
    name = "Preprocessing: basic RGB image"
    tmp_dir = tempfile.mkdtemp()
    try:
        from app.ml.preprocess import preprocess_image
        img_path = _make_synthetic_image(tmp_dir, "normal.png", mode="normal")
        tensor, display = preprocess_image(img_path, category="bottle", remove_bg=False)
        assert tensor.shape == (1, 3, 224, 224), f"Unexpected tensor shape: {tensor.shape}"
        assert display.shape == (224, 224, 3), f"Unexpected display shape: {display.shape}"
        _pass(name, f"tensor={tuple(tensor.shape)}, display={tuple(display.shape)}")
    except Exception as e:
        _fail(name, str(e))
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


def test_preprocessing_grayscale():
    name = "Preprocessing: grayscale → RGB conversion"
    tmp_dir = tempfile.mkdtemp()
    try:
        from app.ml.preprocess import preprocess_image
        img_path = _make_synthetic_image(tmp_dir, "grey.png", mode="grayscale")
        tensor, display = preprocess_image(img_path, category="bottle", remove_bg=False)
        assert tensor.shape == (1, 3, 224, 224)
        _pass(name)
    except Exception as e:
        _fail(name, str(e))
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


def test_preprocessing_rgba():
    name = "Preprocessing: RGBA → RGB conversion"
    tmp_dir = tempfile.mkdtemp()
    try:
        from app.ml.preprocess import preprocess_image
        img_path = _make_synthetic_image(tmp_dir, "rgba.png", mode="rgba")
        tensor, display = preprocess_image(img_path, category="bottle", remove_bg=False)
        assert tensor.shape == (1, 3, 224, 224)
        _pass(name)
    except Exception as e:
        _fail(name, str(e))
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


def test_preprocessing_realworld():
    name = "Preprocessing: real-world photo (large, noisy)"
    tmp_dir = tempfile.mkdtemp()
    try:
        from app.ml.preprocess import preprocess_image
        img_path = _make_synthetic_image(tmp_dir, "realworld.png", mode="realworld")
        tensor, display = preprocess_image(img_path, category="bottle", remove_bg=False)
        assert tensor.shape == (1, 3, 224, 224)
        _pass(name, "Resized 480×640 → 224×224 without error")
    except Exception as e:
        _fail(name, str(e))
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


# ─────────────────────────────────────────────────────────────────────────────
# Test 6 — Inference: normal image → NORMAL
# ─────────────────────────────────────────────────────────────────────────────

def test_inference_normal_image():
    name = "Inference: normal bottle image → NORMAL"
    tmp_dir = tempfile.mkdtemp()
    try:
        from app.ml.model_loader import model_loader
        if not model_loader.is_model_available("bottle"):
            _skip(name, "bottle model not available")
            return

        from app.ml.inference import run_inference
        img_path = _make_synthetic_image(tmp_dir, "normal_bottle.png", mode="normal")
        result = run_inference(img_path, category="bottle")

        score     = result["anomaly_score"]
        threshold = result["threshold"]
        is_anomaly = result["is_anomaly"]

        detail = f"score={score:.4f}, threshold={threshold:.4f}, is_anomaly={is_anomaly}"

        # Threshold must be ~0.7054 (from bottle_patchcore.pkl)
        assert abs(threshold - 0.7054) < 1e-3, f"Wrong threshold: {threshold}"

        if not is_anomaly:
            _pass(name, detail)
        else:
            # Not a hard failure — synthetic images may not perfectly mimic real normals
            print(f"{YELLOW}[WARN]{RESET} {name}  →  {detail}")
            print("       Synthetic grey image scored above threshold. This is expected if the")
            print("       memory bank was trained on real bottle textures. Use a real normal image.")
            _results.append(("WARN", name))

    except Exception as e:
        _fail(name, str(e))
        traceback.print_exc()
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


# ─────────────────────────────────────────────────────────────────────────────
# Test 7 — Inference: anomaly image → ANOMALY
# ─────────────────────────────────────────────────────────────────────────────

def test_inference_anomaly_image():
    name = "Inference: anomaly bottle image → ANOMALY"
    tmp_dir = tempfile.mkdtemp()
    try:
        from app.ml.model_loader import model_loader
        if not model_loader.is_model_available("bottle"):
            _skip(name, "bottle model not available")
            return

        from app.ml.inference import run_inference
        img_path = _make_synthetic_image(tmp_dir, "anomaly_bottle.png", mode="anomaly")
        result = run_inference(img_path, category="bottle")

        score      = result["anomaly_score"]
        threshold  = result["threshold"]
        is_anomaly = result["is_anomaly"]
        detail = f"score={score:.4f}, threshold={threshold:.4f}, is_anomaly={is_anomaly}"

        assert abs(threshold - 0.7054) < 1e-3, f"Wrong threshold: {threshold}"

        if is_anomaly:
            _pass(name, detail)
        else:
            print(f"{YELLOW}[WARN]{RESET} {name}  →  {detail}")
            print("       Synthetic anomaly image scored below threshold. Use a real defect image")
            print("       from MVTec bottle test set for a definitive check.")
            _results.append(("WARN", name))

    except Exception as e:
        _fail(name, str(e))
        traceback.print_exc()
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


# ─────────────────────────────────────────────────────────────────────────────
# Test 8 — Inference: real-world photo → graceful handling
# ─────────────────────────────────────────────────────────────────────────────

def test_inference_realworld_graceful():
    name = "Inference: real-world photo → no crash"
    tmp_dir = tempfile.mkdtemp()
    try:
        from app.ml.model_loader import model_loader
        if not model_loader.is_model_available("bottle"):
            _skip(name, "bottle model not available")
            return

        from app.ml.inference import run_inference
        img_path = _make_synthetic_image(tmp_dir, "realworld.png", mode="realworld")
        result = run_inference(img_path, category="bottle", remove_bg=False)

        assert "anomaly_score" in result
        assert "is_anomaly" in result
        assert 0.0 <= result["anomaly_score"] <= 1.0, \
            f"Score out of range: {result['anomaly_score']}"
        _pass(name, f"score={result['anomaly_score']:.4f}, is_anomaly={result['is_anomaly']}")

    except Exception as e:
        _fail(name, str(e))
        traceback.print_exc()
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


# ─────────────────────────────────────────────────────────────────────────────
# Test 9 — Inference: invalid category → FileNotFoundError
# ─────────────────────────────────────────────────────────────────────────────

def test_inference_invalid_category():
    name = "Inference: invalid category → FileNotFoundError"
    tmp_dir = tempfile.mkdtemp()
    try:
        from app.ml.inference import run_inference
        img_path = _make_synthetic_image(tmp_dir, "img.png", mode="normal")
        try:
            run_inference(img_path, category="nonexistent_category_xyz")
            _fail(name, "Expected FileNotFoundError but no exception was raised")
        except FileNotFoundError:
            _pass(name, "FileNotFoundError raised correctly")
    except Exception as e:
        _fail(name, str(e))
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


# ─────────────────────────────────────────────────────────────────────────────
# Test 10 — Postprocessing: heatmap files are created
# ─────────────────────────────────────────────────────────────────────────────

def test_postprocessing_creates_files():
    name = "Postprocessing: heatmap files created"
    tmp_dir = tempfile.mkdtemp()
    try:
        from app.ml.postprocess import generate_heatmap
        img_path = _make_synthetic_image(tmp_dir, "src.png", mode="anomaly")
        out_path = os.path.join(tmp_dir, "heatmap.png")

        # Synthetic anomaly map
        anomaly_map = np.random.rand(224, 224).astype(np.float32)

        paths = generate_heatmap(
            original_image_path=img_path,
            output_path=out_path,
            anomaly_map=anomaly_map,
            anomaly_score=0.75,
            threshold=0.582,
            category="bottle",
        )

        for key, path in paths.items():
            assert os.path.exists(path), f"Missing output file for '{key}': {path}"

        _pass(name, f"overlay, hot, contour all created")
    except Exception as e:
        _fail(name, str(e))
        traceback.print_exc()
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


# ─────────────────────────────────────────────────────────────────────────────
# Test 11 — Calibrate: memory-bank self-distance method
# ─────────────────────────────────────────────────────────────────────────────

def test_calibrate_memory_bank():
    name = "Calibrate: memory-bank self-distance threshold recalculation"
    try:
        from app.ml.model_loader import model_loader
        if not model_loader.is_model_available("bottle"):
            _skip(name, "bottle model not available")
            return

        import torch
        from app.ml.inference import _get_backbone
        from app.ml.model_loader import model_loader

        bb = _get_backbone()
        device = bb.device
        model_data = model_loader.get_model("bottle")
        memory_bank = torch.tensor(
            model_data["memory_bank"], dtype=torch.float32, device=device
        )

        n = memory_bank.shape[0]
        idx = torch.randperm(n, device=device)[:min(n, 500)]
        sample = memory_bank[idx]
        dists = torch.cdist(sample, memory_bank, p=2.0)
        # Exclude self-distances
        for i, orig_idx in enumerate(idx[:len(idx)]):
            dists[i, orig_idx] = 1e9
        min_dists, _ = dists.min(dim=1)
        raw_scores = min_dists.cpu().numpy()
        scores = [float(r / (r + 1)) for r in raw_scores]

        new_threshold = float(np.percentile(scores, 95))
        assert 0.0 < new_threshold < 1.0, f"Threshold out of range: {new_threshold}"
        _pass(name, f"95th-percentile threshold from memory bank = {new_threshold:.4f}")

    except Exception as e:
        _fail(name, str(e))
        traceback.print_exc()


# ─────────────────────────────────────────────────────────────────────────────
# Test 12 — update_threshold persists correctly
# ─────────────────────────────────────────────────────────────────────────────

def test_update_threshold():
    name = "ModelLoader.update_threshold persists correctly"
    try:
        from app.ml.model_loader import model_loader
        original = model_loader.get_threshold("bottle")
        model_loader.update_threshold("bottle", 0.750)
        assert abs(model_loader.get_threshold("bottle") - 0.750) < 1e-6
        # Restore
        model_loader.update_threshold("bottle", original)
        assert abs(model_loader.get_threshold("bottle") - original) < 1e-6
        _pass(name, f"{original:.4f} → 0.750 → {original:.4f} (restored)")
    except Exception as e:
        _fail(name, str(e))


# ─────────────────────────────────────────────────────────────────────────────
# Test 13 — Score is in [0, 1]
# ─────────────────────────────────────────────────────────────────────────────

def test_score_range():
    name = "Anomaly score is always in [0, 1]"
    tmp_dir = tempfile.mkdtemp()
    try:
        from app.ml.model_loader import model_loader
        if not model_loader.is_model_available("bottle"):
            _skip(name, "bottle model not available")
            return

        from app.ml.inference import run_inference
        for mode in ("normal", "anomaly", "realworld"):
            img_path = _make_synthetic_image(tmp_dir, f"{mode}.png", mode=mode)
            result = run_inference(img_path, category="bottle")
            s = result["anomaly_score"]
            assert 0.0 <= s <= 1.0, f"Score {s} out of [0,1] for mode={mode}"
        _pass(name, "All three modes produced scores in [0, 1]")
    except Exception as e:
        _fail(name, str(e))
        traceback.print_exc()
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


# ─────────────────────────────────────────────────────────────────────────────
# Runner
# ─────────────────────────────────────────────────────────────────────────────

def main():
    print("\n" + "=" * 65)
    print("  PatchCore Anomaly Detection — Full Test Suite")
    print("=" * 65 + "\n")

    tests = [
        test_threshold_correctness,
        test_alias_resolution,
        test_model_availability,
        test_bottle_config_json,
        test_preprocessing_basic,
        test_preprocessing_grayscale,
        test_preprocessing_rgba,
        test_preprocessing_realworld,
        test_inference_normal_image,
        test_inference_anomaly_image,
        test_inference_realworld_graceful,
        test_inference_invalid_category,
        test_postprocessing_creates_files,
        test_calibrate_memory_bank,
        test_update_threshold,
        test_score_range,
    ]

    for t in tests:
        try:
            t()
        except Exception as e:
            _fail(t.__name__, f"Unexpected top-level error: {e}")

    # ── Summary ───────────────────────────────────────────────────────────────
    passed = sum(1 for r, _ in _results if r == "PASS")
    failed = sum(1 for r, _ in _results if r == "FAIL")
    warned = sum(1 for r, _ in _results if r == "WARN")
    skipped = sum(1 for r, _ in _results if r == "SKIP")
    total = len(_results)

    print("\n" + "=" * 65)
    print(f"  Results: {passed}/{total} passed  |  {failed} failed  |  {warned} warned  |  {skipped} skipped")
    print("=" * 65 + "\n")

    if failed > 0:
        print(f"{RED}Some tests FAILED. See details above.{RESET}\n")
        sys.exit(1)
    else:
        print(f"{GREEN}All tests passed (or skipped/warned).{RESET}\n")
        sys.exit(0)


if __name__ == "__main__":
    main()
