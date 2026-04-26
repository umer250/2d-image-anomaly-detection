# ML Engineer's Standard Workflow for Anomaly Detection (All 15 MVTec AD Categories)

As an ML engineer, when you need to scale from a single prototype (like `bottle`) to an entire dataset (all 15 categories), you don't copy-paste the notebook 14 times. You write a single scalable pipeline that iterates through the dataset dynamically.

Here is the exact code you need to replace in your existing `PatchCore_Kaggle_Training.ipynb` to make it a professional, fully automated pipeline.

---

## 🛠️ Step 1: Update the Configuration Cell

Replace your existing `Configuration` cell with this dynamic list of all 15 MVTec AD categories.

```python
# CONFIGURATION - Professional ML Pipeline
import os

# All 15 MVTec AD categories
CATEGORIES = [
    'bottle', 'cable', 'capsule', 'carpet', 'grid', 'hazelnut', 
    'leather', 'metal_nut', 'pill', 'screw', 'tile', 
    'toothbrush', 'transistor', 'wood', 'zipper'
]

# Base Kaggle paths
DATASET_BASE_DIR = '/kaggle/input/mvtec-ad'
OUTPUT_DIR = '/kaggle/working/models'

os.makedirs(OUTPUT_DIR, exist_ok=True)

# Training parameters (Optimized for PatchCore)
CORESET_RATIO = 0.1      # Keep 10% of patches for memory bank
NUM_NEIGHBORS = 1        # K for KNN
SIGMA = 2.0              # Statistical threshold multiplier
INPUT_SIZE = (224, 224)  # Standard ResNet input size
```

---

## 🚀 Step 2: Wrap the Process in a Master Loop

Remove all the individual cells from `Collect Training Images` down to `Save Model`. Replace them with this single, unified master loop. This ensures that the heavy WideResNet50 backbone is loaded only **once**, and all 15 categories are processed sequentially.

```python
import json
import time
from datetime import datetime
import gc

print(f"[{datetime.now().strftime('%H:%M:%S')}] Starting Batch Training for {len(CATEGORIES)} categories...")

results_summary = []

for idx, category in enumerate(CATEGORIES):
    print(f"\n{'='*60}")
    print(f"[{idx+1}/{len(CATEGORIES)}] 🚀 TRAINING CATEGORY: {category.upper()}")
    print(f"{'='*60}")
    
    start_time = time.time()
    
    # 1. Setup paths for current category
    train_dir = Path(DATASET_BASE_DIR) / category / 'train' / 'good'
    test_dir = Path(DATASET_BASE_DIR) / category / 'test'
    output_file = Path(OUTPUT_DIR) / f"{category}_patchcore_fixed.pkl"
    
    # 2. Collect Training Images
    train_images = list(train_dir.glob('*.png')) + list(train_dir.glob('*.jpg'))
    if len(train_images) == 0:
        print(f"⚠️ WARNING: No images found for {category} in {train_dir}. Skipping...")
        continue
    
    print(f"  Found {len(train_images)} training images.")
    
    # 3. Extract Features
    print("  [1/4] Extracting patch embeddings...")
    all_patches = []
    for img_path in tqdm(train_images, desc=f"  {category} Embedding", leave=False):
        try:
            patches = extract_patches(img_path)
            all_patches.append(patches)
        except Exception as e:
            print(f"  Skipped {img_path.name}: {e}")
            
    all_patches_np = np.concatenate(all_patches, axis=0)
    print(f"    Total patches: {all_patches_np.shape[0]:,}")

    # 4. Coreset Subsampling
    print("  [2/4] Coreset subsampling...")
    memory_bank_np = greedy_coreset(all_patches_np, CORESET_RATIO)
    memory_bank = torch.tensor(memory_bank_np, dtype=torch.float32, device=device)
    print(f"    Memory bank size: {memory_bank_np.shape[0]:,} patches")

    # 5. Calculate p99_normal and Threshold
    print("  [3/4] Computing p99_normal and threshold...")
    raw_distances = []
    for img_path in tqdm(train_images, desc=f"  {category} Scoring", leave=False):
        try:
            raw_max = score_image(img_path, memory_bank, NUM_NEIGHBORS)
            raw_distances.append(raw_max)
        except Exception as e:
            print(f"  Skipped {img_path.name}: {e}")

    raw_distances = np.array(raw_distances)
    p99_normal = float(np.percentile(raw_distances, 99))
    normalized_scores = raw_distances / p99_normal
    mean_score = float(np.mean(normalized_scores))
    std_score = float(np.std(normalized_scores))
    threshold = round(max(1.0, mean_score + SIGMA * std_score), 6)

    print(f"    p99_normal: {p99_normal:.4f}")
    print(f"    Threshold:  {threshold:.4f}")

    # 6. Evaluate on Test Set (If available)
    auroc = None
    if test_dir.exists():
        print("  [4/4] Evaluating on test set...")
        labels, scores = [], []
        for subdir in sorted(test_dir.iterdir()):
            if not subdir.is_dir(): continue
            label = 0 if subdir.name == 'good' else 1
            images = list(subdir.glob('*.png')) + list(subdir.glob('*.jpg'))
            
            for img_path in tqdm(images, desc=f"    Testing {subdir.name}", leave=False):
                try:
                    raw_max = score_image(img_path, memory_bank, NUM_NEIGHBORS)
                    normalized_score = raw_max / p99_normal
                    scores.append(normalized_score)
                    labels.append(label)
                except Exception as e:
                    pass
        
        if labels:
            auroc = roc_auc_score(labels, scores)
            print(f"    ✅ AUROC: {auroc:.4f}")

    # 7. Save Model
    print(f"  Saving model to {output_file.name}...")
    model_data = {
        'memory_bank': memory_bank_np,
        'threshold': threshold,
        'num_neighbors': NUM_NEIGHBORS,
        'p99_normal': p99_normal,
        'raw_distances': raw_distances.tolist(),
        'normalized_scores': normalized_scores.tolist(),
        'config': {
            'category': category,
            'backbone': 'wide_resnet50_2',
            'layers': ['layer2', 'layer3'],
            'coreset_ratio': CORESET_RATIO,
            'sigma': SIGMA,
            'i_auroc': auroc,
            'p99_normal': p99_normal,
        }
    }

    with open(output_file, 'wb') as f:
        pickle.dump(model_data, f)
        
    duration = (time.time() - start_time) / 60
    print(f"  ✅ Completed {category} in {duration:.1f} minutes.")
    
    results_summary.append({
        'category': category,
        'auroc': round(auroc, 4) if auroc else None,
        'time_mins': round(duration, 1),
        'threshold': threshold
    })
    
    # Memory management - prevent RAM overflow on Kaggle
    del all_patches, all_patches_np, memory_bank, memory_bank_np, model_data
    gc.collect()
    torch.cuda.empty_cache()

# ============================================================
# Print Final Summary
# ============================================================
print(f"\n{'='*60}")
print("🏆 BATCH TRAINING COMPLETE")
print(f"{'='*60}")
for res in results_summary:
    print(f"{res['category'].ljust(15)} | AUROC: {res['auroc']} | Time: {res['time_mins']}m | Threshold: {res['threshold']}")
```

---

## 💡 Why this is the "ML Engineer Way":
1. **DRY Principle (Don't Repeat Yourself)**: Instead of 15 notebooks, you have 1 master notebook.
2. **Resource Optimization**: `WideResNet50` is heavy. The loop loads it once and runs all 15 items through it, saving Kaggle GPU time.
3. **Memory Management**: The `gc.collect()` and `torch.cuda.empty_cache()` are critical. Without them, Kaggle will crash out of RAM by the 3rd or 4th category.
4. **Error Handling**: Using `try/except` around file reads ensures one corrupted image won't crash a 2-hour pipeline.
