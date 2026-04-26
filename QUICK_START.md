# 🚀 Quick Start Guide — 2D Image Anomaly Detection System

## Prerequisites
- Python 3.9+ (3.11 recommended)
- Node.js 18+
- PostgreSQL 14+

---

## 1️⃣ Backend Setup

```bash
cd Backend

# Create & activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux / Mac

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start the server
# Admin account + 15 categories are auto-created on first startup
# Make sure ADMIN_EMAIL and ADMIN_PASSWORD are set in .env
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Backend URL:** http://localhost:8000  
**Swagger API Docs:** http://localhost:8000/docs  
**Health Check:** http://localhost:8000/health

---

## 2️⃣ Frontend Setup

```bash
cd Frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

**Frontend URL:** http://localhost:5175

---

## 3️⃣ First Login

Admin credentials are set in `Backend/.env`:

```
ADMIN_EMAIL=admin@anomalydetect.io
ADMIN_PASSWORD=Admin@2026FYP!
```

> ⚠️ Admin **cannot** be created via the signup page — this is by design.  
> Change the password after first login.

---

## 📂 Documentation

| File | Purpose |
|------|---------|
| `Backend/API_DOCS.md` | All 33+ REST API endpoints with examples |
| `docs/TRAINING_GUIDE.md` | How to train new PatchCore models |
| `docs/COMPLETE_TRAINING_GUIDE.md` | Full 15-category training workflow |
| `docs/PatchCore_All_15_Workflow.md` | PatchCore architecture & training flow |

---

## 🎯 Key Features

- Upload images → AI detects anomalies → 4 heatmap visualisations
- Supports all 15 MVTec AD categories
- JWT authentication + OTP email password reset
- Admin panel: analytics, user management, threshold control
- User panel: dashboard, history, results, profile

---

## 🔧 .env Configuration

```env
# Required
DATABASE_URL=postgresql://postgres:12345@localhost:5432/anomaly_detection
SECRET_KEY=super-secret-jwt-key-change-this-in-production-2026
ADMIN_EMAIL=admin@anomalydetect.io
ADMIN_PASSWORD=Admin@2026FYP!

# Email OTP (for forgot-password)
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

---

## 🛠️ Utility Scripts

```bash
# Manually seed admin (if not using auto-startup)
cd Backend
set ADMIN_EMAIL=admin@anomalydetect.io
set ADMIN_PASSWORD=Admin@2026FYP!
python scripts/seed_admin.py

# Recalibrate all 15 thresholds
python scripts/calibrate_all_thresholds.py
```

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|---------|
| Backend won't start | Check PostgreSQL is running, verify DATABASE_URL in `.env` |
| Model not loading | Verify `.pkl` file exists in `Backend/ml_models/` |
| Frontend won't start | Delete `node_modules`, run `npm install` again |
| Admin can't login | Check ADMIN_EMAIL/PASSWORD in `.env`, restart server |
| Email OTP not sending | Check SMTP_USER, SMTP_PASSWORD in `.env` |

---

**System Version:** 1.0.0 | **Last Updated:** April 26, 2026
