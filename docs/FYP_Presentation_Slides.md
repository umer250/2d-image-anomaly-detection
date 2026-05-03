---
marp: true
theme: default
class: lead
paginate: true
backgroundColor: #0a0f1e
style: |
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;900&display=swap');

  section {
    font-family: 'Inter', 'Segoe UI', sans-serif;
    color: #e2e8f0;
    padding: 45px 55px;
    background: linear-gradient(135deg, #0a0f1e 0%, #0d1b3e 60%, #0a1628 100%);
    position: relative;
    overflow: hidden;
  }

  section::before {
    content: '';
    position: absolute;
    top: -120px; right: -120px;
    width: 350px; height: 350px;
    background: radial-gradient(circle, rgba(0,115,230,0.15) 0%, transparent 70%);
    border-radius: 50%;
    pointer-events: none;
  }

  h1 {
    font-size: 2.4em;
    font-weight: 900;
    background: linear-gradient(90deg, #60a5fa, #a78bfa);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 0.3em;
    line-height: 1.2;
  }

  h2 {
    font-size: 1.6em;
    font-weight: 700;
    color: #60a5fa;
    border-bottom: 2px solid rgba(96,165,250,0.35);
    padding-bottom: 8px;
    margin-bottom: 18px;
  }

  h3 {
    font-size: 1.05em;
    font-weight: 600;
    color: #a78bfa;
    margin: 10px 0 5px;
  }

  p, li {
    font-size: 0.88em;
    line-height: 1.65;
    color: #cbd5e1;
  }

  strong { color: #93c5fd; }

  table {
    border-collapse: collapse;
    width: 100%;
    font-size: 0.82em;
  }

  th {
    background: rgba(96,165,250,0.2);
    color: #93c5fd;
    padding: 8px 12px;
    text-align: left;
    border-bottom: 2px solid rgba(96,165,250,0.4);
  }

  td {
    padding: 7px 12px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    color: #cbd5e1;
  }

  tr:nth-child(even) td { background: rgba(255,255,255,0.03); }

  .badge {
    display: inline-block;
    background: rgba(96,165,250,0.18);
    border: 1px solid rgba(96,165,250,0.4);
    color: #93c5fd;
    border-radius: 20px;
    padding: 3px 12px;
    font-size: 0.75em;
    font-weight: 600;
    margin: 3px 4px;
  }

  .badge-green  { background: rgba(52,211,153,0.15); border-color: rgba(52,211,153,0.4); color: #6ee7b7; }
  .badge-purple { background: rgba(167,139,250,0.15); border-color: rgba(167,139,250,0.4); color: #c4b5fd; }
  .badge-yellow { background: rgba(251,191,36,0.15);  border-color: rgba(251,191,36,0.4);  color: #fcd34d; }
  .badge-red    { background: rgba(248,113,113,0.15); border-color: rgba(248,113,113,0.4); color: #fca5a5; }

  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-top: 14px; }
  .grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; margin-top: 14px; }

  .card {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    padding: 16px 18px;
  }

  .card-blue   { border-left: 4px solid #60a5fa; }
  .card-green  { border-left: 4px solid #34d399; }
  .card-purple { border-left: 4px solid #a78bfa; }
  .card-yellow { border-left: 4px solid #fbbf24; }
  .card-red    { border-left: 4px solid #f87171; }

  .team-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-top: 20px;
  }

  .team-member {
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(96,165,250,0.25);
    padding: 18px 14px;
    border-radius: 14px;
    text-align: center;
    font-size: 0.82em;
  }

  .metric-row {
    display: flex;
    justify-content: space-around;
    margin-top: 18px;
    gap: 14px;
  }

  .metric-box {
    flex: 1;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(96,165,250,0.2);
    border-radius: 12px;
    padding: 18px 12px;
    text-align: center;
  }

  .metric-num {
    font-size: 2em;
    font-weight: 900;
    background: linear-gradient(90deg, #60a5fa, #a78bfa);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .slide-tag {
    position: absolute;
    top: 18px; right: 22px;
    font-size: 0.68em;
    font-weight: 600;
    color: rgba(148,163,184,0.7);
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  footer {
    font-size: 0.65em;
    color: rgba(148,163,184,0.5);
    text-align: center;
  }
---

<!-- SLIDE 1 — TITLE -->

# 🤖 2D Image Anomaly Detection System
## Final Year Project Defense

<br>

**Presented By:** Muhammad Umer &nbsp;|&nbsp; Subhan Ahmed &nbsp;|&nbsp; Mehak Mehmood

**Supervisor:** Sir Qaisar Abbas

**Department of Computer Science**
University of Gujrat &nbsp;·&nbsp; April 2026

---

<!-- SLIDE 2 — TEAM -->

## 👥 Meet the Team

<div class="team-grid">
  <div class="team-member">
    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Umer" width="64" style="border-radius:50%; border:2px solid #60a5fa;"><br>
    <strong>Muhammad Umer</strong><br>
    22081519-013<br>
    <span class="badge">Backend &amp; AI/ML</span>
  </div>
  <div class="team-member">
    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Subhan" width="64" style="border-radius:50%; border:2px solid #a78bfa;"><br>
    <strong>Subhan Ahmed</strong><br>
    22081519-005<br>
    <span class="badge badge-purple">Frontend Developer</span>
  </div>
  <div class="team-member">
    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Mehak" width="64" style="border-radius:50%; border:2px solid #34d399;"><br>
    <strong>Mehak Mehmood</strong><br>
    22081519-003<br>
    <span class="badge badge-green">Documentation &amp; DB</span>
  </div>
</div>

---

<!-- SLIDE 3 — OUTLINE -->

## 📋 Presentation Outline

<div class="grid2">
<div>

| # | Topic |
|---|-------|
| 1 | Introduction & Problem |
| 2 | Objectives & Scope |
| 3 | System Architecture |
| 4 | **AI / ML Module** |
| 5 | **Backend (FastAPI)** |

</div>
<div>

| # | Topic |
|---|-------|
| 6 | **Frontend (React)** |
| 7 | **Database (PostgreSQL)** |
| 8 | Results & Evaluation |
| 9 | Conclusion & Future Work |
| 10 | Q&A |

</div>
</div>

---

<!-- SLIDE 4 — INTRODUCTION & PROBLEM -->

## 🌐 Introduction & Problem Statement
<span class="slide-tag">Background</span>

<div class="grid2">
<div class="card card-blue">

### 🏭 Industry Context
- Industry 4.0 demands **zero-defect manufacturing**
- Visual inspection is the **bottleneck** in smart factories
- Manual inspectors are subjective and fatigue-prone

</div>
<div class="card card-red">

### 🚨 Core Problem
- **Data Scarcity** — defective items are rare; supervised learning fails
- **Micro-Defects** — scratches invisible to humans under pressure
- **Speed** — manual inspection halts production lines

</div>
</div>

<br>

> **Our Solution:** An unsupervised AI platform that detects anomalies *without ever seeing a defective sample during training.*

---

<!-- SLIDE 5 — OBJECTIVES & SCOPE -->

## 🎯 Objectives & Scope
<span class="slide-tag">Goals</span>

<div class="grid2">
<div class="card card-purple">

### Objectives
1. Implement **PatchCore** unsupervised detection
2. Achieve **> 98% AUROC** accuracy
3. Provide **Explainable AI** via heatmaps
4. Build a full-stack **Web Dashboard**
5. Support **15 MVTec AD** product categories

</div>
<div class="card card-green">

### Scope
- Works on standard **2D industrial cameras**
- Supports: Bottle · Cable · Carpet · Grid · Hazelnut · Leather · Metal Nut · Pill · Screw · Tile · Toothbrush · Transistor · Wood · Zipper · + more
- Real-time inference **< 150 ms**
- Role-based access: **Admin / Operator**

</div>
</div>

---

<!-- SLIDE 6 — SYSTEM ARCHITECTURE -->

## 🏗️ System Architecture
<span class="slide-tag">Overview</span>

<div class="grid3">
<div class="card card-purple">

### 🧠 AI/ML Layer
- PatchCore Model (PyTorch)
- WideResNet-50 Backbone
- Heatmap Generator
- `.pkl` Model Store

</div>
<div class="card card-blue">

### ⚙️ Backend Layer
- FastAPI (Python)
- REST API Endpoints
- JWT Authentication
- Async Processing

</div>
<div class="card card-green">

### 🖥️ Frontend Layer
- React 18 + Vite
- Tailwind CSS
- Admin Dashboard
- Operator Upload Portal

</div>
</div>

<div class="card card-yellow" style="margin-top:14px;">

### 🗄️ Data Layer — PostgreSQL + SQLAlchemy ORM · Users · Predictions · Audit Logs

</div>

---

<!-- SLIDE 7 — AI / ML MODULE -->

## 🧠 AI / ML Module — PatchCore
<span class="slide-tag">Artificial Intelligence</span>

<div class="grid2">
<div>

### How PatchCore Works
1. **Feature Extraction** — WideResNet-50 deep layers capture shape & texture patches
2. **Coreset Subsampling** — Reduces memory bank while preserving coverage
3. **Nearest-Neighbour Search** — FAISS index compares new patches to "normal" bank
4. **Anomaly Score Map** — Localises deviations at pixel level → heatmap overlay

</div>
<div class="card card-purple">

### Model Details

| Property | Value |
|----------|-------|
| Backbone | WideResNet-50 |
| Training Type | Unsupervised |
| Categories | 15 (MVTec AD) |
| Image AUROC | **99.2 %** |
| Pixel AUROC | **97.8 %** |
| Inference | < 150 ms |

</div>
</div>

---

<!-- SLIDE 8 — BACKEND -->

## ⚙️ Backend — FastAPI
<span class="slide-tag">Backend</span>

<div class="grid2">
<div>

### Key API Endpoints

| Method | Route | Purpose |
|--------|-------|---------|
| `POST` | `/auth/login` | JWT Login |
| `POST` | `/predict` | Run Inference |
| `GET`  | `/predictions` | History |
| `GET`  | `/dashboard/stats` | Analytics |
| `GET`  | `/models` | Model List |

</div>
<div class="card card-blue">

### Architecture Highlights
- **FastAPI** — async, auto-docs (Swagger)
- **SQLAlchemy ORM** — DB abstraction
- **JWT + OAuth2** — secure auth flow
- **Uvicorn** — ASGI production server
- **CORS Middleware** — React ↔ API
- **Background Tasks** — non-blocking inference
- **Pydantic v2** — strict schema validation

</div>
</div>

---

<!-- SLIDE 9 — FRONTEND -->

## 🖥️ Frontend — React 18 + Vite
<span class="slide-tag">Frontend</span>

<div class="grid2">
<div class="card card-green">

### Admin Dashboard
- Live statistics: anomaly rate, prediction count, accuracy trend
- Model management panel
- Full prediction history table with filters
- User management (CRUD)
- Heatmap overlay viewer

</div>
<div class="card card-purple">

### Operator Upload Portal
- Drag-and-drop image upload
- Category selector (15 MVTec classes)
- Real-time result with confidence score
- Side-by-side: **Original ↔ Heatmap**
- Responsive mobile-friendly layout

</div>
</div>

<div style="margin-top:14px;">
<span class="badge">React 18</span>
<span class="badge badge-green">Vite</span>
<span class="badge badge-purple">Tailwind CSS</span>
<span class="badge badge-yellow">Axios</span>
<span class="badge">React Router v6</span>
<span class="badge badge-red">Recharts</span>
<span class="badge badge-green">React Dropzone</span>
</div>

---

<!-- SLIDE 10 — DATABASE -->

## 🗄️ Database — PostgreSQL
<span class="slide-tag">Database</span>

<div class="grid2">
<div>

### Schema Design

| Table | Key Columns |
|-------|-------------|
| `users` | id, email, role, hashed_pw |
| `predictions` | id, image_path, category, score, label, user_id, created_at |
| `models` | id, name, category, path, auroc |
| `audit_logs` | id, action, user_id, timestamp |

</div>
<div class="card card-yellow">

### DB Highlights
- **PostgreSQL 15** — ACID compliant
- **SQLAlchemy 2.0** — async ORM
- **Alembic** — schema migrations
- **Indexed** on `created_at`, `user_id`, `category` for fast queries
- **Role-based rows** — Operator sees only own predictions; Admin sees all
- **Cascade deletes** — referential integrity

</div>
</div>

---

<!-- SLIDE 11 — RESULTS & METRICS -->

## 📈 Results & Evaluation
<span class="slide-tag">Performance</span>

<div class="metric-row">
  <div class="metric-box">
    <div class="metric-num">99.2%</div>
    <div>Image-Level AUROC</div>
  </div>
  <div class="metric-box">
    <div class="metric-num">97.8%</div>
    <div>Pixel-Level AUROC</div>
  </div>
  <div class="metric-box">
    <div class="metric-num">&lt;150ms</div>
    <div>Inference Latency</div>
  </div>
  <div class="metric-box">
    <div class="metric-num">15</div>
    <div>MVTec Categories</div>
  </div>
</div>

<div class="grid2" style="margin-top:16px;">
<div class="card card-green">

### ✅ Strengths
- Exceeds 98% AUROC target across 15 classes
- No defect samples needed for training
- Explainable output via visual heatmaps

</div>
<div class="card card-red">

### ⚠️ Limitations
- Reflective surfaces cause occasional false positives
- Large memory bank size for all 15 categories
- GPU recommended for real-time deployment

</div>
</div>

---

<!-- SLIDE 12 — TECH STACK SUMMARY -->

## 🛠️ Full Technology Stack
<span class="slide-tag">Technologies</span>

<div class="grid3">
<div class="card card-purple">

### 🧠 AI / ML
- PyTorch 2.x
- Anomalib Framework
- WideResNet-50
- FAISS (Vector Search)
- OpenCV
- Scikit-learn

</div>
<div class="card card-blue">

### ⚙️ Backend
- Python 3.11
- FastAPI
- SQLAlchemy 2.0
- Alembic
- Uvicorn (ASGI)
- Pydantic v2
- JWT / OAuth2

</div>
<div class="card card-green">

### 🖥️ Frontend & DB
- React 18 + Vite
- Tailwind CSS
- Axios + React Router
- Recharts
- PostgreSQL 15
- pgAdmin 4
- Docker (Dev)

</div>
</div>

---

<!-- SLIDE 13 — LITERATURE REVIEW & METHODOLOGY -->

## 📚 Literature Review
<span class="slide-tag">Research</span>

| Method | Approach | Pro | Con |
|--------|----------|-----|-----|
| **Supervised CNN** | Labelled defect images | High accuracy when data available | Requires defect samples |
| **GANs (AnoGAN)** | Generative reconstruction | No defect data needed | Unstable training, slow |
| **AutoEncoder** | Reconstruction error | Simple & fast | Poor on texture defects |
| **PatchCore (Ours)** | Memory-bank patch matching | **SOTA · No defect data · Fast** | Higher memory footprint |

<br>

> **Why PatchCore?** It achieves **State-of-the-Art** performance with **zero defect training data**, making it ideal for industrial cold-start scenarios where defects are rare.

---

<!-- SLIDE 14 — CONCLUSION & FUTURE WORK -->

## 🚀 Conclusion & Future Work
<span class="slide-tag">Summary</span>

<div class="grid2">
<div class="card card-blue">

### ✅ What We Achieved
- End-to-end anomaly detection platform deployed
- PatchCore trained on all **15 MVTec AD** categories
- Full-stack web app: Admin + Operator roles
- **99.2% image AUROC** — exceeded target
- Heatmap-based Explainable AI integrated

</div>
<div class="card card-purple">

### 🔮 Future Roadmap
1. **Edge Deployment** — NVIDIA Jetson for real-time conveyor belt inference
2. **Active Learning** — Operator feedback to refine memory bank
3. **3D Fusion** — Combine RGB with depth sensors
4. **Multi-camera** — Simultaneous product streams
5. **AutoML** — Auto-select best model per category

</div>
</div>

---

<!-- SLIDE 15 — Q&A / THANK YOU -->

## 🎉 Thank You & Q&A
<span class="slide-tag">Slide 15 / 15</span>

<div style="text-align:center; margin: 20px 0 10px;">

### *"Innovating Quality Assurance through Unsupervised AI"*

</div>

<div class="grid3">
<div class="team-member">
  <strong>Muhammad Umer</strong><br>
  <span class="badge">Backend &amp; AI/ML</span><br>
  <small>22081519-013</small>
</div>
<div class="team-member">
  <strong>Subhan Ahmed</strong><br>
  <span class="badge badge-purple">Frontend</span><br>
  <small>22081519-005</small>
</div>
<div class="team-member">
  <strong>Mehak Mehmood</strong><br>
  <span class="badge badge-green">Documentation &amp; DB</span><br>
  <small>22081519-003</small>
</div>
</div>

<div style="margin-top:20px; text-align:center;">

**Supervisor:** Sir Qaisar Abbas &nbsp;·&nbsp; **University of Gujrat** &nbsp;·&nbsp; April 2026

<span class="badge">GitHub: anomaly-detection-fyp</span>
<span class="badge badge-green">Live Demo Available</span>

</div>
