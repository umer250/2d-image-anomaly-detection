# ML Engineer's Standard Workflow for Anomaly Detection

---

## PHASE 1: Problem Understanding & Setup

**Step 1: Understand the Task**
- Define what "anomaly" means for this specific product
- Bottle example: crack, contamination, broken lid, color defect
- Understand that training happens on NORMAL images only (unsupervised)
- No labeled defect images needed for training — this is the key advantage

**Step 2: Environment Setup**
```
Hardware needed:
- GPU: NVIDIA with 8GB+ VRAM (T4, V100, A100)
- RAM: 16GB+ system RAM
- Storage: 50GB+ for dataset + models

Software stack:
- Python 3.10+
- PyTorch + CUDA
- torchvision
- scikit-learn
- OpenCV
- numpy, matplotlib, scipy
- tqdm (progress bars)
```

**Step 3: Understand Dataset Structure**
```
MVTec AD standard structure:
category/
├── train/
│   └── good/          ← ONLY normal images here
│       ├── 000.png
│       ├── 001.png
│       └── ...
├── test/
│   ├── good/          ← Normal test images
│   ├── crack/         ← Defect type 1
│   ├── contamination/ ← Defect type 2
│   └── broken_large/  ← Defect type 3
└── ground_truth/
    ├── crack/         ← Pixel masks for defects
    └── contamination/
```

---

## PHASE 2: Data Analysis (Before Training)

**Step 4: Exploratory Data Analysis (EDA)**
- Count training images per category
- Check image dimensions (MVTec is 1024x1024)
- Check color distribution (RGB vs grayscale)
- Visualize sample normal images
- Visualize sample defect images with ground truth masks
- Check class imbalance in test set

```python
# Standard EDA code ML engineers run first
import os
from pathlib import Path

for cat in categories:
    train_count = len(list(Path(f'data/{cat}/train/good').glob('*.png')))
    defect_types = [d.name for d in Path(f'data/{cat}/test').iterdir() if d.is_dir()]
    print(f'{cat}: {train_count} train, defects: {defect_types}')
```

**Step 5: Decide Preprocessing Strategy**
Based on EDA, decide:
- Resize to 224x224 or 256x256?
- Center crop or resize directly?
- Use augmentation or not?
- Color normalization values (ImageNet standard)

---

## PHASE 3: Model Selection

**Step 6: Choose Architecture**
ML engineers evaluate options:

```
Option A: PatchCore (WideResNet50)
  Pros: State-of-the-art, no training needed, fast
  Cons: Large memory bank, slow inference on CPU
  Best for: High accuracy requirement
  I-AUROC on bottle: ~99%

Option B: EfficientAD
  Pros: Fastest inference, small model
  Cons: Needs some training time
  Best for: Real-time deployment
  I-AUROC on bottle: ~98%

Option C: SPADE
  Pros: Simple, interpretable
  Cons: Lower accuracy than PatchCore
  Best for: Quick baseline

Option D: FastFlow
  Pros: Good accuracy, reasonable speed
  Cons: More complex training
  Best for: Production deployment

Decision: PatchCore for maximum accuracy baseline
```

---

## PHASE 4: Training Pipeline

**Step 7: Feature Extraction Setup**
```
WideResNet50 layers used:
- layer2: spatial 28x28, channels 512 → fine-grained details
- layer3: spatial 14x14, channels 1024 → semantic features
- Upsample layer3 → 28x28, concatenate → 1536 channels
- Each 28x28 = 784 patch embeddings per image
```

**Step 8: Memory Bank Construction**
```
Process:
1. Pass all training normal images through backbone
2. Collect 784 patch embeddings per image
3. If 200 normal images: 200 × 784 = 156,800 total patches
4. Apply coreset sampling → reduce to 25% = ~39,200 patches
5. Store as memory bank numpy array
```

**Step 9: Coreset Sampling (Why it matters)**
```
Without coreset:
- 156,800 patches × 1536 dimensions = 961 MB memory bank
- Inference time: very slow

With coreset (25%):
- 39,200 patches × 1536 dimensions = 240 MB
- Inference time: 4x faster
- Accuracy loss: < 0.5%

Algorithm: Greedy farthest point sampling
- Keep patches that are most spread out
- Remove redundant/duplicate patches
```

**Step 10: Score Calibration**
```
After memory bank built:
1. Run all training images through inference
2. Collect raw distance scores
3. Compute p99 = 99th percentile
4. Set normalization: score = raw / p99
5. Split train 80/20 for validation
6. Find threshold on val set by maximizing F1
```

---

## PHASE 5: Evaluation — What ML Engineers Check

**Step 11: Primary Metrics**
```
Image-level metrics:
├── I-AUROC (Image AUROC)
│   - Measures ability to separate normal vs anomaly images
│   - Target: > 95%
│   - State of art: 99%+ on bottle
│
├── Accuracy at threshold
│   - After threshold is set
│   - Target: > 90%
│
└── F1 Score
    - Balance of precision and recall
    - Target: > 85%

Pixel-level metrics:
├── P-AUROC (Pixel AUROC)
│   - Measures how well anomaly map highlights defect region
│   - Compared against ground truth mask
│   - Target: > 95%
│
└── PRO Score (Per-Region Overlap)
    - More strict than P-AUROC
    - Standard benchmark metric
```

**Step 12: Confusion Matrix Analysis**
```
What ML engineers look for:
                 Pred Normal  Pred Anomaly
True Normal  |    TN          FP        |
True Anomaly |    FN          TP        |

Priority 1: Minimize FP (False Positives)
  - Good bottles flagged as defective
  - Causes production line slowdowns
  - Business cost: waste, rework

Priority 2: Minimize FN (False Negatives)
  - Defective bottles pass as good
  - Quality control failure
  - Business cost: customer complaints, recalls

Acceptable FP rate: < 5%
Acceptable FN rate: < 10%
```

**Step 13: Score Distribution Analysis**
ML engineers always plot this to verify model health:

```
What good distribution looks like:
Normal images:   |████         |  0.0 - 0.45
Anomaly images:  |         ████|  0.55 - 1.0
Threshold:                ^0.5

Separation gap must be > 0.05
If gap < 0.01: model is not learning, try different normalization
```

---

## PHASE 6: Visualization Pipeline

**Step 14: Standard Visualization Outputs**

Every ML engineer produces these 4 panels for each test image:

```
Panel 1: Original Image
- Raw test image as-is
- Resize to 224x224 for display

Panel 2: Anomaly Map
- Raw patch-level distance map
- Resized to 224x224 (bilinear)
- Gaussian smoothed (sigma=4)
- Colormap: 'hot' (black→red→yellow→white)
- Shows WHERE the model found anomalies

Panel 3: Heatmap Overlay
- 60% original + 40% JET colormap heatmap
- Blue = normal regions
- Red = anomaly regions
- Shows anomaly intensity on the actual image

Panel 4: Contour Marking
- Binary threshold on anomaly map (top 38% region)
- Morphological cleanup (open + close operations)
- Red filled contours + bounding box
- Similar to ground truth marking style
```

**Step 15: Training Curves (if training-based model)**
```
For PatchCore: no training curves (non-parametric)
For EfficientAD/FastFlow: plot
- Train loss vs epoch
- Val loss vs epoch
- Check for: overfitting gap, underfitting, convergence
```

**Step 16: Overfitting / Underfitting Check for PatchCore**
```
PatchCore overfitting check is different:
- It is NON-PARAMETRIC (no weights updated)
- "Overfitting" = memory bank is too large (memorizes noise)
- "Underfitting" = memory bank too small (misses normal patterns)

Check method:
1. Compare train score distribution vs test normal distribution
2. If gap > 0.05: memory bank may be overfitting
3. If test normal scores > 0.45: underfitting (coreset too aggressive)

Healthy state:
- Train normal mean score: 0.30-0.40
- Test normal mean score:  0.32-0.43
- Anomaly mean score:      0.60-0.85
```

---

## PHASE 7: Hyperparameter Tuning

**Step 17: What ML Engineers Tune**
```
Coreset ratio:
- 0.10 → fast, less accurate
- 0.25 → balanced (recommended)
- 0.50 → slower, more accurate
- 1.00 → no compression, maximum accuracy

Backbone layer selection:
- layer2 only → fast, less accurate
- layer3 only → semantic only
- layer2 + layer3 → best (recommended)
- layer1 + layer2 + layer3 → slower, marginal gain

Image size:
- 224×224 → standard, fast
- 256×256 → slightly better
- 320×320 → better for small defects, slower

Top-K ratio for scoring:
- 0.01 (top 1%) → fewer false positives
- 0.05 (top 5%) → more sensitive
```

---

## PHASE 8: Multi-Category Training

**Step 18: Systematic Training Protocol**
```
For all 15 MVTec categories:

Order of training (recommended by compute time):
1. toothbrush   ← smallest, test first
2. screw
3. pill
4. capsule
5. bottle       ← already done
6. cable
7. metal_nut
8. hazelnut
9. transistor
10. zipper
11. grid
12. wood
13. tile
14. leather
15. carpet      ← largest, train last

Per category checklist:
□ Dataset loaded correctly
□ Train count verified
□ Memory bank built
□ p99 calibrated
□ Threshold found on val set
□ I-AUROC > 95% verified
□ P-AUROC > 90% verified
□ Confusion matrix checked
□ FP rate < 5% verified
□ Sample visualizations saved
□ .pkl file saved
□ Checkpoint saved
```

---

## PHASE 9: Real World Testing Protocol

**Step 19: How ML Engineers Test Real World Images**

```
Standard protocol:

1. IMAGE ACQUISITION
   - Use same setup as training data if possible
   - For bottle: top-down view, consistent lighting
   - Camera distance: same as dataset
   - Background: black or dark (matches MVTec)

2. PREPROCESSING (must match training)
   - Resize to 224×224
   - Same normalization: ImageNet (mean=[0.485,0.456,0.406])
   - If image quality differs: apply CLAHE
   - If background cluttered: remove with rembg

3. INFERENCE
   - Load .pkl file
   - Extract patches
   - Compare to memory bank
   - Apply top-1% scoring
   - Normalize by p99

4. SCORE INTERPRETATION
   Score 0.00-0.35: Clearly Normal (high confidence)
   Score 0.35-0.50: Normal (low confidence, borderline)
   Score 0.50-0.65: Anomaly (low confidence, borderline)
   Score 0.65-1.00: Clearly Anomaly (high confidence)

5. FAILURE ANALYSIS
   If good image shows as anomaly:
   □ Check if image is top-down (not side view)
   □ Check if background was removed properly
   □ Check lighting conditions
   □ Check if bottle type matches training data
   □ Try remove_bg=False if rembg made it worse
   □ Check if threshold needs adjustment for this deployment
```

---

## PHASE 10: Production Readiness Checklist

**Step 20: Before Deploying Model**
```
Performance:
□ I-AUROC > 95% on all 15 categories
□ FP rate < 5% on test normal images
□ FN rate < 10% on test anomaly images
□ Inference time < 2 seconds per image on CPU
□ Memory bank size < 500 MB per category

Robustness:
□ Tested on real-world images (not just dataset)
□ Tested on slightly rotated images (±15°)
□ Tested on different lighting conditions
□ Tested on partial occlusion

Files to deploy:
□ bottle_patchcore.pkl    (bottle model)
□ cable_patchcore.pkl     (cable model)
□ [all 15 categories].pkl
□ thresholds.json         (all thresholds)
□ inference.py            (inference code)
□ postprocess.py          (visualization code)

API requirements:
□ /predict endpoint returns score + heatmap path
□ Graceful fallback if .pkl missing
□ Error handling for unsupported file types
□ Async inference for multiple requests
```

---

## SUMMARY: Standard ML Engineer Report Format

After training, every ML engineer writes this summary:

```
MODEL TRAINING REPORT
=====================
Model: PatchCore + WideResNet50
Dataset: MVTec AD
Date: [date]

RESULTS TABLE:
Category    | I-AUROC | P-AUROC | Threshold | FP Rate | Training Time
-----------------------------------------------------------------------
bottle      | 99.2%   | 98.1%   | 0.512     | 2.1%    | 4.2 min
cable       | 95.1%   | 92.3%   | 0.489     | 4.3%    | 5.1 min
capsule     | 97.8%   | 96.4%   | 0.501     | 3.2%    | 3.8 min
[...]

AVERAGE:    | 97.3%   | 94.8%

FAILURES / EDGE CASES:
- Category X: I-AUROC only 91%, investigate
- Category Y: High FP rate 8%, threshold needs review

DEPLOYMENT STATUS:
- Models saved: 15/15
- Total size: 2.3 GB
- Ready for production: YES
```
