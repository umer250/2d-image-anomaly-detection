# 📁 Complete Project File Structure
> **2D Image Anomaly Detection System** — Every file and directory fully explained.

---

## Root Directory

```
2d-image-anomaly-detection/
├── Backend/
├── Frontend/
├── docs/
├── scripts/
├── .gitignore
├── QUICK_START.md
└── README.md
```

| File / Folder | Purpose |
|:---|:---|
| `Backend/` | Python FastAPI server — all ML, API, and database logic |
| `Frontend/` | React + Vite web application — all UI pages |
| `docs/` | All project documentation (.md files, presentation slides, FYP report) |
| `scripts/` | Root-level utility scripts (e.g., training launchers) |
| `.gitignore` | Tells Git which files NOT to track (e.g., `venv/`, `node_modules/`, `.env`) |
| `QUICK_START.md` | 5-minute guide to get the app running locally |
| `README.md` | Project overview for GitHub |

---

## 🐍 Backend/

```
Backend/
├── app/
│   ├── api/
│   │   ├── deps.py
│   │   └── v1/
│   │       ├── api.py
│   │       └── endpoints/
│   │           ├── admin.py
│   │           ├── auth.py
│   │           ├── history.py
│   │           ├── images.py
│   │           ├── ml.py
│   │           ├── results.py
│   │           └── users.py
│   ├── core/
│   │   ├── config.py
│   │   └── security.py
│   ├── crud/
│   │   ├── crud_user.py
│   │   ├── crud_image.py
│   │   ├── crud_result.py
│   │   └── crud_history.py
│   ├── db/
│   │   ├── base.py
│   │   └── session.py
│   ├── ml/
│   │   ├── inference.py
│   │   ├── model_loader.py
│   │   ├── postprocess.py
│   │   ├── preprocess.py
│   │   ├── recalibrate_threshold.py
│   │   ├── threshold.py
│   │   └── train.py
│   ├── models/
│   │   ├── user.py
│   │   ├── image.py
│   │   ├── result.py
│   │   ├── history.py
│   │   ├── category.py
│   │   └── settings.py
│   ├── schemas/
│   │   └── *.py (Pydantic validators)
│   ├── utils/
│   └── main.py
├── alembic/
│   ├── versions/
│   └── env.py
├── heatmaps/
├── ml_models/
├── scripts/
├── static/
│   ├── uploads/
│   └── heatmaps/
├── uploads/
├── .env
├── .env.example
├── alembic.ini
├── API_DOCS.md
├── Dockerfile
├── Procfile
├── requirements.txt
└── render.yaml
```

### `app/api/`

| File | Purpose |
|:---|:---|
| `deps.py` | **Dependency injection** — provides `get_current_user` and `get_current_admin` functions used in every protected route. This is where JWT tokens are decoded and the logged-in user is retrieved from the database. |
| `v1/api.py` | **Router registry** — imports all endpoint routers (auth, users, admin, ml, history) and registers them with their URL prefixes (e.g., `/auth`, `/users`, `/ml`). |

### `app/api/v1/endpoints/`

| File | Route Prefix | Who Can Call | Purpose |
|:---|:---|:---|:---|
| `auth.py` | `/api/v1/auth` | Anyone (no login needed) | Login, Signup, Forgot Password, OTP Verify, Reset Password |
| `users.py` | `/api/v1/users` | Logged-in users | Get profile, update profile, change password |
| `admin.py` | `/api/v1/admin` | Admin only | User management, analytics, system reset, category settings |
| `ml.py` | `/api/v1/ml` | Logged-in users | Upload image for anomaly detection, get model status |
| `history.py` | `/api/v1/history` | Logged-in users | View past detection results |
| `images.py` | `/api/v1/images` | Logged-in users | Manage uploaded images |
| `results.py` | `/api/v1/results` | Logged-in users | Access detection result details |

### `app/core/`

| File | Purpose |
|:---|:---|
| `config.py` | Reads all environment variables from `.env` file using `pydantic-settings`. Contains `Settings` class with `DATABASE_URL`, `SECRET_KEY`, `SMTP_HOST`, etc. |
| `security.py` | Contains `create_access_token()`, `verify_password()`, and `get_password_hash()`. Uses `python-jose` for JWT and `passlib[bcrypt]` for password hashing. |

### `app/crud/`
CRUD = **C**reate, **R**ead, **U**pdate, **D**elete — these files are the **data access layer**. They talk to the database using SQLAlchemy.

| File | What it manages |
|:---|:---|
| `crud_user.py` | Get user by email/id, create user, update password, deactivate user |
| `crud_image.py` | Save uploaded image record, retrieve image by ID |
| `crud_result.py` | Save inference result (score, heatmap path), retrieve results |
| `crud_history.py` | Save detection history entry, retrieve user history |

### `app/db/`

| File | Purpose |
|:---|:---|
| `base.py` | Imports all SQLAlchemy models so Alembic can detect them during migrations |
| `session.py` | Creates the database engine and `SessionLocal` factory. Provides `get_db()` which is a FastAPI dependency that opens and closes a DB session per request. |

### `app/ml/` — The Machine Learning Engine

| File | Purpose |
|:---|:---|
| `inference.py` | **Main inference engine.** Runs PatchCore: loads backbone (WideResNet50), extracts features from layer2+layer3, computes 1-NN distances against memory bank, calculates final anomaly score. |
| `model_loader.py` | Loads `.pkl` model files from `ml_models/` directory. Caches models in memory for fast repeated inference. |
| `postprocess.py` | **Heatmap generator.** Takes the raw anomaly map and generates 4 output images: HOT colormap (panel b), JET overlay (panel c), Defect Localization with bounding boxes (panel d), and 4-panel comparison. |
| `preprocess.py` | Resizes and normalizes input images to match ImageNet training standards (224×224, mean/std normalization). Optionally removes background using `rembg`. |
| `threshold.py` | Utility to read/write the optimal threshold value from the saved `.pkl` model file. |
| `recalibrate_threshold.py` | Allows recalibrating the detection threshold using new normal reference images. |
| `train.py` | **Training script.** Extracts features from all normal training images, subsamples them using greedy coreset, and saves the memory bank + threshold to a `.pkl` file. |

### `app/models/` — Database Tables (SQLAlchemy ORM)

| File | Database Table | Key Columns |
|:---|:---|:---|
| `user.py` | `users` | id, email, hashed_password, full_name, role, is_active |
| `image.py` | `images` | id, filename, file_path, upload_date, user_id |
| `result.py` | `results` | id, image_id, anomaly_score, threshold, is_anomaly, heatmap_path |
| `history.py` | `history` | id, user_id, filename, status, score, heatmap_path, hot_map_path, contour_path, category |
| `category.py` | `categories` | id, name, model_path, threshold, i_auroc, p_auroc, is_trained |
| `settings.py` | `user_settings` | id, user_id, theme, notification_enabled, default_model |

### `app/schemas/`
Pydantic schemas define the **shape of data** for API requests and responses. They validate incoming JSON automatically.

| Example Schema | Used In | Purpose |
|:---|:---|:---|
| `UserCreate` | POST `/auth/signup` | Validates email format, password strength |
| `Token` | POST `/auth/login` | Returns `access_token` and `token_type` |
| `PredictionResponse` | POST `/ml/predict` | Defines all fields in the detection result |
| `HistoryItem` | GET `/history` | Defines fields visible in the history list |

### `app/main.py`
The **application entry point**. Creates the FastAPI app, configures CORS, mounts the static file server (`/static`), registers all routers, and runs the database seeder on startup (creates admin account + 15 categories if not present).

### `alembic/`
**Database version control system.** Alembic tracks changes to database schema over time.

| File | Purpose |
|:---|:---|
| `alembic.ini` | Configuration: sets database URL and migration script locations |
| `env.py` | Connects Alembic to SQLAlchemy models and database session |
| `versions/*.py` | Each file is one migration (e.g., "add column X to table Y") |

### Storage Directories

| Directory | Purpose |
|:---|:---|
| `static/uploads/` | Stores all user-uploaded images. Served at `/static/uploads/filename.jpg`. |
| `static/heatmaps/` | Stores generated heatmap images (overlay, hot, contour, comparison). |
| `ml_models/` | Stores trained PatchCore `.pkl` files (e.g., `bottle_latest_patchcore.pkl`). |

### Config Files

| File | Purpose |
|:---|:---|
| `.env` | **Secret configuration** — database URL, JWT secret, SMTP credentials. Never commit this to Git. |
| `.env.example` | Template showing which variables are needed (safe to commit). |
| `requirements.txt` | All Python package dependencies with pinned versions. |
| `Dockerfile` | Instructions to build a Docker container image of the backend. |
| `Procfile` | Tells platforms like Render/Heroku how to start the app. |
| `render.yaml` | Render.com deployment configuration. |

---

## ⚛️ Frontend/

```
Frontend/
├── public/
│   ├── samples/
│   │   ├── bottle/
│   │   ├── wood/
│   │   └── ... (15 category folders, each with 2 sample images)
│   └── logos/
├── src/
│   ├── components/
│   │   ├── ChartComponents.jsx
│   │   ├── Footer.jsx
│   │   ├── ProtectedRoute.jsx
│   │   ├── Sidebar.jsx
│   │   ├── SkeletonCard.jsx
│   │   ├── icons/
│   │   └── layout/
│   │       ├── AdminLayout.jsx
│   │       └── UserLayout.jsx
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── pages/
│   │   ├── admin/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── UserManagement.jsx
│   │   │   ├── ImageMonitoring.jsx
│   │   │   ├── Reports.jsx
│   │   │   ├── AdminSettings.jsx
│   │   │   └── UserModal.jsx
│   │   ├── user/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Upload.jsx
│   │   │   ├── Results.jsx
│   │   │   ├── History.jsx
│   │   │   ├── Profile.jsx
│   │   │   └── Settings.jsx
│   │   └── shared/
│   │       ├── Login.jsx
│   │       ├── Register.jsx
│   │       └── ForgotPassword.jsx
│   ├── routes/
│   │   └── AppRoutes.jsx
│   ├── services/
│   │   ├── api.js
│   │   └── mlApi.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

### `src/components/`

| File | Purpose |
|:---|:---|
| `Sidebar.jsx` | Navigation sidebar with role-aware links. Admin sees admin links; users see user links. Uses `lucide-react` icons. |
| `ChartComponents.jsx` | Recharts-based chart wrappers: `BarChart`, `LineChart`, `PieChart` for analytics dashboards. |
| `ProtectedRoute.jsx` | Guards routes — if user is not logged in, redirects to `/login`. If role doesn't match, redirects to correct dashboard. |
| `Footer.jsx` | Static footer component. |
| `SkeletonCard.jsx` | Loading placeholder animation shown while data is being fetched. |
| `layout/AdminLayout.jsx` | Wrapper layout for all admin pages — renders Sidebar + page content. |
| `layout/UserLayout.jsx` | Wrapper layout for all user pages — renders Sidebar + page content. |

### `src/context/AuthContext.jsx`
**Global authentication state.** Wraps the entire app and provides `user`, `token`, `login()`, and `logout()` to every component via React Context. Stores the JWT token in `localStorage`.

### `src/pages/admin/`

| File | URL Path | Purpose |
|:---|:---|:---|
| `Dashboard.jsx` | `/admin/dashboard` | Shows system-wide stats: total users, total detections, anomaly rate, activity charts. |
| `UserManagement.jsx` | `/admin/users` | Table of all registered users. Admin can create, edit, deactivate, or delete users. |
| `ImageMonitoring.jsx` | `/admin/images` | View all uploaded images across all users with their detection results. |
| `Reports.jsx` | `/admin/reports` | Generate and download PDF reports of system activity using jsPDF. |
| `AdminSettings.jsx` | `/admin/settings` | Configure detection thresholds per category, toggle notifications, reset system. |
| `UserModal.jsx` | (modal) | Popup form component used inside UserManagement for creating/editing users. |

### `src/pages/user/`

| File | URL Path | Purpose |
|:---|:---|:---|
| `Dashboard.jsx` | `/dashboard` | Shows user's personal stats: total images uploaded, anomalies found, daily activity chart. |
| `Upload.jsx` | `/upload` | Main detection page. Select product category, upload image, call `/ml/predict`, display results. |
| `Results.jsx` | `/results` | Displays the 4-panel IEEE-style visualization: Input, Anomaly Map, Overlay, Defect Localization. |
| `History.jsx` | `/history` | Table of all previous detections with search/filter and option to re-view results. |
| `Profile.jsx` | `/profile` | Update display name and avatar. |
| `Settings.jsx` | `/settings` | Change password, notification preferences, default detection category. |

### `src/pages/shared/`

| File | URL Path | Purpose |
|:---|:---|:---|
| `Login.jsx` | `/login` | Email + password login form. Calls `/auth/login`, saves token to AuthContext. |
| `Register.jsx` | `/register` | New user signup form with validation. Calls `/auth/signup`. |
| `ForgotPassword.jsx` | `/forgot-password` | 3-step OTP flow: enter email → verify OTP → set new password. |

### `src/services/`

| File | Purpose |
|:---|:---|
| `api.js` | **Axios instance** pre-configured with `baseURL = http://localhost:8000/api/v1`. Automatically attaches `Authorization: Bearer TOKEN` header to every request from `localStorage`. Contains all API call functions (login, getUsers, updateProfile, etc.). |
| `mlApi.js` | Separate Axios instance for ML-specific calls (`/ml/predict`, `/ml/model-status`). Handles `multipart/form-data` for file uploads. |

### `src/routes/AppRoutes.jsx`
Defines all client-side routes using `react-router-dom`. Wraps routes in `ProtectedRoute` to enforce authentication and role checks.

### Config Files

| File | Purpose |
|:---|:---|
| `index.html` | HTML shell — root div where React mounts the app. |
| `vite.config.js` | Vite build configuration. Configures the dev proxy to forward `/api/v1/*` to `http://localhost:8000` to avoid CORS issues during development. |
| `tailwind.config.js` | TailwindCSS configuration — extends default theme with custom colors. |
| `postcss.config.js` | PostCSS configuration required for TailwindCSS processing. |
| `package.json` | Lists all npm dependencies and defines `npm run dev`, `npm run build` scripts. |
| `.env` | Stores `VITE_API_BASE_URL` — the backend URL for production builds. |

---

## 📚 docs/

| File | Purpose |
|:---|:---|
| `FYP_Documentation.md` | Full academic FYP report (~1200 lines). Chapters 1–8 covering feasibility, SRS, design, UI, testing, results, user manual, conclusion. |
| `FYP_Presentation_Slides.md` | Marp-based presentation slides for the defense. Uses dark glassmorphism design. |
| `FILE_STRUCTURE.md` | This file — complete directory map. |
| `API_REFERENCE.md` | Complete API documentation with curl examples for every endpoint. |
| `COMMANDS.md` | All CLI commands for install, run, train, deploy, and troubleshoot. |
| `LEARN_THE_PROJECT.md` | Role-based comprehensive guide for all team members (0 to hero). |
| `COMPLETE_TRAINING_GUIDE.md` | Step-by-step ML model training guide for all 15 categories. |
| `PatchCore_All_15_Workflow.md` | Workflow documentation for PatchCore training pipeline. |
| `Project_Directory_Structure.md` | Older, shorter version of file structure (superseded by this file). |

---

## 📂 scripts/ (Root Level)
Training launcher scripts for running model training from the root directory without navigating into Backend.

---

## Key Architectural Decisions

### Why FastAPI?
FastAPI is **async-native**, meaning multiple image uploads can be processed simultaneously without blocking. It also auto-generates OpenAPI docs at `/docs`.

### Why PatchCore?
PatchCore is an **unsupervised** algorithm — it only needs normal images for training. No defect labels are required, making it practical for real factory environments.

### Why Vite + React?
Vite provides **extremely fast** hot-module replacement during development. React's component model maps cleanly to the role-based UI (admin vs. user views).

### Why Alembic?
Alembic allows **incremental database schema changes** without losing data. When a new column is added to a model, a migration script updates the production database safely.
