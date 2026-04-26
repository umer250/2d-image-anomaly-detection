# 2D Image Anomaly Detection Platform

A full-stack industrial anomaly detection platform designed for 2D image inspection using PatchCore deep learning models.

## 🚀 Overview

This platform enables real-time anomaly detection in industrial components through image analysis. It features a modern React frontend, high-performance FastAPI backend, and production-ready PatchCore ML models trained on the MVTec AD dataset.

### Core Features
- **User Dashboard:** Upload images, view analysis results with heatmaps, and track detection history
- **Admin Panel:** Monitor system analytics, manage users, and audit detection results
- **ML Pipeline:** PatchCore-based anomaly detection with preprocessing, inference, and heatmap generation
- **Security:** JWT authentication, role-based access control (RBAC), and CORS protection

## 🛠️ Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Framer Motion, Lucide Icons, Recharts
- **Backend:** FastAPI, PostgreSQL, SQLAlchemy, Alembic
- **ML/AI:** PatchCore (PyTorch), Wide ResNet-50, OpenCV, NumPy, Pillow

## 📁 Project Structure

```
2d-image-anomaly-detection/
├── Backend/                        # FastAPI backend
│   ├── alembic/                    # Database migrations
│   │   └── versions/               # Migration scripts
│   ├── app/                        # Application source
│   │   ├── api/v1/endpoints/       # REST API endpoints
│   │   ├── core/                   # Config & security
│   │   ├── crud/                   # Database operations
│   │   ├── db/                     # DB session & base
│   │   ├── ml/                     # ML inference pipeline
│   │   ├── models/                 # SQLAlchemy models
│   │   ├── schemas/                # Pydantic schemas
│   │   └── utils/                  # Utilities (email, etc.)
│   ├── ml_models/                  # Trained model files
│   │   └── notebooks/              # Training notebooks
│   ├── scripts/                    # Utility scripts
│   ├── static/                     # Runtime file storage
│   │   ├── heatmaps/               # Generated heatmaps (gitignored)
│   │   └── uploads/                # Uploaded images (gitignored)
│   ├── .env.example                # Environment template
│   ├── alembic.ini                 # Alembic config
│   ├── Dockerfile                  # Docker config
│   ├── requirements.txt            # Python dependencies
│   └── seed_admin.py               # Admin seeder script
│
├── Frontend/                       # React + Vite frontend
│   ├── public/                     # Static public assets
│   └── src/
│       ├── components/             # Reusable UI components
│       │   ├── icons/              # Icon components
│       │   └── layout/             # Layout wrappers
│       ├── context/                # React context (Auth)
│       ├── pages/
│       │   ├── admin/              # Admin pages
│       │   ├── shared/             # Auth & public pages
│       │   └── user/               # User dashboard pages
│       ├── routes/                 # App routing
│       └── services/               # API service layer
│
├── docs/                           # Project documentation
├── .gitignore
└── README.md
```

## 🏁 Getting Started

For a quick 5-minute setup, see [QUICK_START.md](QUICK_START.md).

### Prerequisites
- Python 3.9+
- Node.js 18+
- PostgreSQL

### 1. Backend Setup
```bash
cd Backend
# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Setup environment variables in .env
# (Ensure database credentials are correct)

# Run migrations
alembic upgrade head

# Seed admin (Optional)
python seed_admin.py

# Start server
python -m uvicorn app.main:app --reload
```

### 2. Frontend Setup
```bash
cd Frontend
# Install dependencies
npm install

# Setup environment variables in .env
# VITE_API_URL=http://localhost:8000/api/v1

# Start development server
npm run dev
```

## 🔒 Security Measures
- **JWT tokens** stored in localStorage with multi-tab logout synchronization.
- **Environment-based** API endpoints for production readiness.
- **Soft Delete** logic for user management to preserve data integrity.
- **Strict ML Contract** validation for future-proofing model integration.

## 📊 ML Pipeline

The platform uses PatchCore models for anomaly detection:

- **Model Architecture:** Wide ResNet-50 backbone with memory bank
- **Training:** Kaggle GPU environment with MVTec AD dataset
- **Performance:** >99% AUROC, <5% false positive rate
- **Categories:** Bottle (expandable to 15 MVTec categories)

For training new models, see [docs/TRAINING_GUIDE.md](docs/TRAINING_GUIDE.md).

### ML Result Contract
```json
{
  "image_id": 12,
  "anomaly_score": 0.73,
  "is_anomaly": true,
  "heatmap_url": "/static/heatmaps/xyz.png",
  "model_version": "v1.0"
}
```

## 📚 Documentation

- [Project Structure](PROJECT_STRUCTURE.md) - Detailed directory layout
- [Training Guide](docs/TRAINING_GUIDE.md) - ML model training instructions
- [Backend README](Backend/README.md) - Backend-specific documentation
- [ML Models README](Backend/ml_models/README.md) - Model usage and configuration

## 📜 License

Internal FYP Project - 2026
