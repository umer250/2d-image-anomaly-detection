# ML Models Directory

This directory contains trained PatchCore models for anomaly detection and related training resources.

## 📁 Directory Contents

### Model Files
- `bottle_patchcore_model.pkl` - Production-ready PatchCore model for bottle category
- `bottle_config.json` - Model configuration and metadata

### Training Notebooks
- `PatchCore_Kaggle_FINAL.ipynb` - Final production training notebook
- `PatchCore_Kaggle_Training.ipynb` - Training notebook with optimized hyperparameters

### Documentation
- `COMPLETE_TRAINING_GUIDE.md` - Comprehensive guide for training and deploying models

## 🚀 Quick Start

### Using Pre-trained Models

The model loader automatically detects and loads models from this directory:

```python
from app.ml.inference import run_inference

result = run_inference(
    image_path="path/to/image.jpg",
    category="bottle",
    remove_bg=False
)
```

### Training New Models

1. Open `PatchCore_Kaggle_FINAL.ipynb` in Kaggle
2. Configure GPU environment (T4 x2 or P100)
3. Add MVTec AD dataset
4. Run all cells
5. Download trained model and place in this directory

For detailed step-by-step instructions, see [../../docs/TRAINING_GUIDE.md](../../docs/TRAINING_GUIDE.md).

## 📊 Model Configuration

Each model requires a corresponding JSON config file with:

```json
{
    "category": "bottle",
    "model_file": "bottle_patchcore_model.pkl",
    "backbone": "wide_resnet50_2",
    "layers": ["layer2", "layer3"],
    "coreset_ratio": 0.40,
    "top_k_ratio": 0.05,
    "threshold": 0.85,
    "metrics": {
        "image_auroc": 1.0000,
        "fp_rate": 0.00
    }
}
```

## 🎯 Supported Model Formats

- `.pkl` (Pickle) - PatchCore models
- `.pt` / `.pth` (PyTorch)
- `.h5` (Keras/TensorFlow)
- `.onnx` (ONNX)

## 📝 Model Naming Convention

Use descriptive names with version numbers:
- `{category}_patchcore_model.pkl` - Production model
- `{category}_patchcore_v{version}.pkl` - Versioned models

## 🔧 Environment Variables

Update `.env` to point to your model:

```bash
MODEL_PATH=ml_models/bottle_patchcore_model.pkl
```

## 📚 Additional Resources

- [MVTec AD Dataset](https://www.mvtec.com/company/research/datasets/mvtec-ad)
- [PatchCore Paper](https://arxiv.org/abs/2106.08265)
- [Training Guide](../../docs/TRAINING_GUIDE.md) - Complete training and deployment guide
