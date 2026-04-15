import os
import sys

try:
    sys.stdout.reconfigure(encoding='utf-8')
except AttributeError:
    pass
import numpy as np

# Ensure Backend package paths are accessible
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.ml.preprocess import preprocess_image, VALID_CATEGORIES
from app.ml.inference import run_inference
from app.ml.postprocess import generate_heatmap
from app.ml.model_loader import model_loader

def run_tests():
    print("=" * 50)
    print("🚀 ML Pipeline Integration Tests")
    print("=" * 50)

    # Make dummy dirs if they don't exist
    os.makedirs("static/uploads", exist_ok=True)
    os.makedirs("static/heatmaps", exist_ok=True)

    dummy_image_path = "static/uploads/dummy_test_image.jpg"
    out_heatmap_path = "static/heatmaps/test_overlay.png"

    # Create an active dummy image to process via CV2
    import cv2
    cv2.imwrite(dummy_image_path, np.random.randint(0, 255, (400, 400, 3), dtype=np.uint8))

    # --- TEST 1: Preprocessing ---
    print("\n[TEST 1] Preprocessing System")
    processed = None
    try:
        img_tensor, img_display = preprocess_image(dummy_image_path, category="bottle")
        if img_tensor.shape == (1, 3, 224, 224) and img_display.shape == (224, 224, 3):
            print("  ✅ [PASS] Tensor shape (1,3,224,224) and display shape (224,224,3) correct.")
        else:
            print(f"  ❌ [FAIL] Unexpected shapes: tensor={img_tensor.shape} display={img_display.shape}")
    except Exception as e:
        print(f"  ❌ [FAIL] Preprocessing crashed: {e}")

    # --- TEST 2: Model Checks ---
    print("\n[TEST 2] Model Loading Availability")
    cats = model_loader.get_available_categories()
    if not cats:
        print("  ⚠️ No models trained yet. Inference will be skipped to protect system state.")
        test_cat = None
    else:
        test_cat = cats[0]
        print(f"  ✅ [PASS] Found trained categories: {cats}")
        print(f"  ✅ [PASS] Selected '{test_cat}' for deep inference testing.")

    # --- TEST 3: Inference Pipeline ---
    print(f"\n[TEST 3] PyTorch WideResNet50 + PatchCore Inference")
    if test_cat:
        try:
            res = run_inference(dummy_image_path, category=test_cat)
            
            # Sub-checks inside inference
            is_valid = True
            if "anomaly_map" not in res: 
                is_valid = False
            if type(res["anomaly_score"]) != float:
                is_valid = False
                
            if is_valid:
                print(f"  ✅ [PASS] Successfully mapped features! Shape: {res['anomaly_map'].shape}")
                print(f"  ✅ [PASS] Extraction overhead complete: {res['inference_time_ms']} ms")
            else:
                print("  ❌ [FAIL] Missing dict schema components in inference returns.")
                res = None
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"  ❌ [FAIL] Inference logic error: {e}")
            res = None
    else:
        print("  ⏩ [SKIP] Generating mock inference arrays to pass forward to Heatmap testing.")
        res = {
            "anomaly_map": np.random.random((224, 224)),
            "anomaly_score": 0.85,
            "threshold": 0.5
        }

    # --- TEST 4: Heatmap Generation ---
    print("\n[TEST 4] Post-Processing Visual Isolation (Heatmaps / Opencv Jets)")
    try:
        generate_heatmap(
            original_image_path=dummy_image_path,
            output_path=out_heatmap_path,
            anomaly_map=res["anomaly_map"],
            anomaly_score=res["anomaly_score"],
            threshold=res["threshold"],
            category=test_cat or "bottle"
        )
        
        # Verify generation physically exists
        if os.path.exists(out_heatmap_path):
            dir_name, file_name = os.path.split(out_heatmap_path)
            comp_path = os.path.join(dir_name, f"comparison_{file_name}")
            
            if os.path.exists(comp_path):
                 print("  ✅ [PASS] Heatmap overlay successfully rendered & separated visual comparative sheet saved.")
            else:
                 print("  ⚠️ [WARN] Standard file created but 3-Part comparison was missed.")
        else:
            print("  ❌ [FAIL] Generate heatmap triggered but no explicit output PNG saved.")
    except Exception as e:
         print(f"  ❌ [FAIL] Execution crash during opencv visualization handling: {e}")

    # Cleanup artifacts directly
    try:
        if os.path.exists(dummy_image_path): os.remove(dummy_image_path)
        if os.path.exists(out_heatmap_path): os.remove(out_heatmap_path)
        if 'comp_path' in locals() and os.path.exists(comp_path): os.remove(comp_path)
    except Exception: pass

    print("\n" + "=" * 50)
    print("Test Suite Execution Finished.")

if __name__ == "__main__":
    run_tests()
