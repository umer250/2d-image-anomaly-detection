# 🚀 Project Commands Reference
> **2D Image Anomaly Detection System** — Every CLI command explained.

All commands must be run from the correct directory. **Read the directory indicator** before each command block.

---

## 📋 Table of Contents
1. [One-Time Setup (First Time Only)](#1-one-time-setup-first-time-only)
2. [Running the Project Daily](#2-running-the-project-daily)
3. [Database Commands](#3-database-commands)
4. [ML Model Training Commands](#4-ml-model-training-commands)
5. [Package Management Commands](#5-package-management-commands)
6. [Git Commands](#6-git-commands)
7. [Utility & Debug Commands](#7-utility--debug-commands)
8. [Production & Deployment Commands](#8-production--deployment-commands)

---

## 1. One-Time Setup (First Time Only)

### 1.1 Clone the Repository
```bash
# Run from anywhere — downloads the project to your machine
git clone <your-github-repo-url>
cd 2d-image-anomaly-detection
```

### 1.2 Backend — Create Python Virtual Environment
```bash
# Run from: 2d-image-anomaly-detection/Backend/
cd Backend

# Create a virtual environment named 'venv'
python -m venv venv
# Explanation: Creates an isolated Python environment so packages
# installed here don't conflict with your global Python installation.
```

### 1.3 Backend — Activate Virtual Environment

**Windows (PowerShell):**
```powershell
# Run from: Backend/
venv\Scripts\Activate.ps1
# After this, your terminal shows (venv) — you are inside the environment
```

**Windows (Command Prompt):**
```cmd
venv\Scripts\activate.bat
```

**Linux / macOS:**
```bash
source venv/bin/activate
```

### 1.4 Backend — Install All Python Dependencies
```bash
# Run from: Backend/ (with venv active)
pip install -r requirements.txt
# Explanation: Reads requirements.txt and installs all listed packages
# (FastAPI, SQLAlchemy, PyTorch, OpenCV, etc.) with exact pinned versions.
# This takes 5-10 minutes on first run due to PyTorch download.
```

### 1.5 Backend — Create .env File
```bash
# Run from: Backend/
# Windows PowerShell:
copy .env.example .env

# Linux / macOS:
cp .env.example .env
```
Then open `Backend/.env` and fill in your actual values.

### 1.6 Backend — Set Up Database
```bash
# Run from: Backend/ (with venv active)

# Step 1: Apply all database migrations (creates all tables)
alembic upgrade head
# Explanation: Runs all migration scripts in alembic/versions/ in order.
# This creates the users, images, results, history, categories tables.

# Step 2: Seed the database (creates admin account + 15 categories)
# This happens AUTOMATICALLY when you start the server for the first time.
# But if you want to seed manually:
python scripts/seed_admin.py
```

### 1.7 Frontend — Install Node.js Dependencies
```bash
# Run from: 2d-image-anomaly-detection/Frontend/
cd Frontend
npm install
# Explanation: Reads package.json and downloads all packages from npm registry
# (React, Axios, TailwindCSS, Recharts, etc.) into node_modules/ folder.
# First run takes 1-3 minutes.
```

---

## 2. Running the Project Daily

### 2.1 Start the Backend Server
```bash
# Run from: Backend/ (with venv active)

# Development mode (auto-reloads on file save):
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Breakdown of this command:
# uvicorn       → The ASGI server that runs FastAPI applications
# app.main:app  → Location of the app: app/main.py, variable named 'app'
# --reload      → Restart server automatically when you save any Python file
# --host 0.0.0.0 → Accept connections from any IP (not just localhost)
# --port 8000   → Listen on port 8000
```

**After starting, visit:**
- API server: http://localhost:8000
- Interactive API docs (Swagger): http://localhost:8000/docs
- Health check: http://localhost:8000/health

### 2.2 Set Admin Credentials Before Starting (First Time)

**Windows (PowerShell — do this before uvicorn):**
```powershell
$env:ADMIN_EMAIL="admin@anomalydetect.io"
$env:ADMIN_PASSWORD="Admin@2026FYP!"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Windows (Command Prompt):**
```cmd
set ADMIN_EMAIL=admin@anomalydetect.io
set ADMIN_PASSWORD=Admin@2026FYP!
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2.3 Start the Frontend Development Server
```bash
# Run from: Frontend/
npm run dev
# Explanation: Starts Vite's development server on port 5173.
# Opens a hot-reload server — any file you save instantly reflects in the browser.
```

**Visit the app at:** http://localhost:5173

> ⚠️ **Both backend (port 8000) and frontend (port 5173) must be running at the same time.**

---

## 3. Database Commands

### 3.1 Apply New Migrations (After Someone Adds a Migration)
```bash
# Run from: Backend/ (venv active)
alembic upgrade head
# Applies all un-applied migrations to bring DB to latest state.
```

### 3.2 Check Current Migration Version
```bash
# Run from: Backend/ (venv active)
alembic current
# Shows which migration version your database is currently at.
```

### 3.3 View Migration History
```bash
# Run from: Backend/ (venv active)
alembic history --verbose
# Lists all migration scripts and which one is currently applied.
```

### 3.4 Create a New Migration (When You Change a Model)
```bash
# Run from: Backend/ (venv active)
alembic revision --autogenerate -m "add column X to table Y"
# Explanation: Alembic compares your SQLAlchemy models to the actual DB
# and generates a migration script automatically.
# Always review the generated file in alembic/versions/ before applying.
```

### 3.5 Roll Back (Undo) Last Migration
```bash
# Run from: Backend/ (venv active)
alembic downgrade -1
# Reverts the most recent migration. Useful if a migration caused an error.
```

### 3.6 Reset Database Completely
```bash
# Run from: Backend/ (venv active)
# WARNING: This deletes ALL data.
alembic downgrade base    # Reverts all migrations (drops all tables)
alembic upgrade head      # Re-applies all migrations (creates empty tables)
```

### 3.7 Connect to SQLite Database (if using SQLite)
```bash
# Run from: Backend/
sqlite3 anomaly.db
# Opens the SQLite command line. Type .tables to see all tables.
# Type .quit to exit.
```

---

## 4. ML Model Training Commands

### 4.1 Train a Single Category
```bash
# Run from: Backend/ (venv active)
python -m app.ml.train --category bottle
# Trains the PatchCore model for 'bottle' category.
# Requires: Training images in correct folder.
# Output: Saves ml_models/bottle_latest_patchcore.pkl
```

### 4.2 Train All 15 Categories
```bash
# Run from: Backend/ (venv active)
python scripts/train_all.py
# Loops through all 15 MVTec AD categories and trains each one.
# Takes 30-90 minutes depending on GPU availability.
```

### 4.3 Recalibrate Model Threshold (via API)
```bash
# Via curl:
curl -X POST "http://localhost:8000/api/v1/ml/calibrate" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "category=bottle" \
  -F "percentile=95.0"
# Recalculates the optimal detection threshold from your current normal images.
```

### 4.4 Check Which Models Are Trained
```bash
curl http://localhost:8000/api/v1/ml/model-status
# Returns a JSON list of all categories that have trained .pkl files.
```

---

## 5. Package Management Commands

### 5.1 Backend — Add a New Python Package
```bash
# Run from: Backend/ (venv active)
pip install package-name
# After installing, update the requirements file:
pip freeze > requirements.txt
# Explanation: Saves ALL installed packages with exact versions to requirements.txt.
```

### 5.2 Backend — Update a Package
```bash
# Run from: Backend/ (venv active)
pip install --upgrade package-name
pip freeze > requirements.txt
```

### 5.3 Backend — Remove a Package
```bash
# Run from: Backend/ (venv active)
pip uninstall package-name
pip freeze > requirements.txt
```

### 5.4 Frontend — Add a New npm Package
```bash
# Run from: Frontend/
npm install package-name
# Adds to dependencies in package.json

# For dev-only packages (not included in production build):
npm install --save-dev package-name
```

### 5.5 Frontend — Remove an npm Package
```bash
# Run from: Frontend/
npm uninstall package-name
```

### 5.6 Frontend — Update All Packages
```bash
# Run from: Frontend/
npm update
# Updates packages to latest versions within version ranges in package.json.
```

### 5.7 Frontend — Clean Install (Fix Corrupted node_modules)
```bash
# Run from: Frontend/
# Delete node_modules and reinstall fresh:
# Windows:
rmdir /s /q node_modules
npm install

# Linux / macOS:
rm -rf node_modules
npm install
```

---

## 6. Git Commands

### 6.1 Check File Status
```bash
git status
# Shows which files are changed (red = not staged, green = staged for commit)
```

### 6.2 Stage Changes
```bash
git add .
# Stages ALL changed files for commit.

git add specific-file.py
# Stages only one specific file.
```

### 6.3 Commit Changes
```bash
git commit -m "Short, descriptive message about what you changed"
# Saves a snapshot of all staged changes with your message.
# Good message examples:
#   "Fix threshold normalization in postprocess.py"
#   "Add user profile update endpoint"
#   "Update Section 1.4 costing table in FYP docs"
```

### 6.4 Push to GitHub
```bash
git push origin main
# Uploads your local commits to GitHub remote repository.
```

### 6.5 Pull Latest Changes
```bash
git pull origin main
# Downloads and merges teammates' latest changes into your local branch.
# Run this BEFORE starting work each day.
```

### 6.6 View Commit History
```bash
git log --oneline -20
# Shows last 20 commits in a compact one-line format.
```

### 6.7 Discard Unsaved Changes to a File
```bash
git checkout -- filename.py
# WARNING: Permanently discards all changes to that file since last commit.
```

---

## 7. Utility & Debug Commands

### 7.1 Check if Backend is Running
```bash
curl http://localhost:8000/health
# Expected response: {"status": "healthy"}
```

### 7.2 Test Login via curl
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@anomalydetect.io&password=Admin@2026FYP!"
# Returns JWT token if credentials are correct.
```

### 7.3 Test Image Upload via curl
```bash
curl -X POST http://localhost:8000/api/v1/ml/predict \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -F "file=@/path/to/image.jpg" \
  -F "category=bottle" \
  -F "remove_bg=false"
```

### 7.4 View Backend Logs (Live)
```bash
# Run from: Backend/ (venv active)
uvicorn app.main:app --reload --log-level debug
# Shows all request logs, SQL queries, and debug messages.
```

### 7.5 Check Python Version
```bash
python --version
# Should be Python 3.9, 3.10, or 3.11 for compatibility.
```

### 7.6 Check Node.js Version
```bash
node --version
# Should be v18 or v20 (LTS versions).
npm --version
```

### 7.7 Check if a Package is Installed (Python)
```bash
# Inside venv:
pip show package-name
# Example: pip show fastapi
# Shows version, location, dependencies.
```

### 7.8 List All Installed Python Packages
```bash
pip list
# Shows all packages installed in current virtual environment.
```

### 7.9 Kill Process on Port 8000 (if server won't start)
```bash
# Windows:
netstat -ano | findstr :8000
taskkill /PID <PID_NUMBER> /F

# Linux / macOS:
lsof -i :8000
kill -9 <PID>
```

### 7.10 Kill Process on Port 5173 (Frontend)
```bash
# Windows:
netstat -ano | findstr :5173
taskkill /PID <PID_NUMBER> /F
```

### 7.11 Build Frontend for Production
```bash
# Run from: Frontend/
npm run build
# Compiles React app into optimized static files in Frontend/dist/ folder.
# These files are what gets deployed to a web server.
```

### 7.12 Preview Production Build Locally
```bash
# Run from: Frontend/ (after npm run build)
npm run preview
# Serves the built dist/ folder locally at http://localhost:4173
```

---

## 8. Production & Deployment Commands

### 8.1 Run Backend Without Auto-Reload (Production Mode)
```bash
# Run from: Backend/ (venv active)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
# --workers 4: Runs 4 parallel worker processes for handling more requests.
# Remove --reload for production (it slows things down).
```

### 8.2 Docker Build & Run (Backend)
```bash
# Run from: Backend/
docker build -t anomaly-backend .
# Builds Docker container image from Dockerfile.

docker run -p 8000:8000 --env-file .env anomaly-backend
# Runs the container, mapping port 8000 and loading .env variables.
```

### 8.3 Check Disk Space (for large model files)
```bash
# Windows:
dir ml_models\ /s
# Shows total size of ml_models directory.

# Linux / macOS:
du -sh ml_models/
```

---

## ⚡ Quick Reference Card

| Task | Command | Where to Run |
|:---|:---|:---|
| Activate Python env | `venv\Scripts\Activate.ps1` | `Backend/` |
| Start backend | `uvicorn app.main:app --reload` | `Backend/` (venv) |
| Start frontend | `npm run dev` | `Frontend/` |
| Install backend deps | `pip install -r requirements.txt` | `Backend/` (venv) |
| Install frontend deps | `npm install` | `Frontend/` |
| Apply DB migrations | `alembic upgrade head` | `Backend/` (venv) |
| Train a model | `python -m app.ml.train --category bottle` | `Backend/` (venv) |
| Build frontend | `npm run build` | `Frontend/` |
| Git pull latest | `git pull origin main` | Root |
| Git push changes | `git add . && git commit -m "msg" && git push` | Root |
