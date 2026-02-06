# 2D Image Anomaly Detection Platform

A full-stack industrial anomaly detection platform designed for 2D image inspection using deep learning.

## 🚀 Overview

This platform allows users to upload images of industrial components and receive immediate feedback on potential anomalies. It features a modern React frontend, a high-performance FastAPI backend, and an extensible ML pipeline.

### Core Features
- **User Dashboard:** Upload images, view analysis results, and track history.
- **Admin Panel:** Monitor system analytics, manage users, and audit image results.
- **ML Pipeline:** Pre-processing, inference, and heatmap generation for visual evidence.
- **Security:** JWT Authentication, Role-Based Access Control (RBAC), and CORS protection.

## 🛠️ Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Framer Motion, Lucide Icons, Recharts.
- **Backend:** FastAPI, PostgreSQL, SQLAlchemy, Alembic.
- **ML/Core:** TensorFlow/Keras (mocked for demo), OpenCV (Pillow), NumPy.

## 🏁 Getting Started

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

## 📊 ML Pipeline Contract
The system enforces a strict JSON contract for ML results:
```json
{
  "image_id": 12,
  "anomaly_score": 0.73,
  "is_anomaly": true,
  "heatmap_url": "/static/heatmaps/xyz.png",
  "model_version": "v1.0"
}
```

## 📜 License
Internal FYP Project - 2026.
