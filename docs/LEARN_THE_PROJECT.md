# 📖 Learn the Project — Zero to Hero Guide
> **2D Image Anomaly Detection System**
> For: Mehak Mahmood · Subhan Ahmad · Muhammad Umer

---

## 👥 Member Roles

| Member | Role |
|:---|:---|
| **Mehak Mahmood** | UI/UX Design · Documentation Writing · QA Testing |
| **Subhan Ahmad** | Database Management · QA Testing |
| **Muhammad Umer** | ML Model Development · Backend API Integration |

---

# 🎨 MEHAK MAHMOOD — UI/UX Design, Documentation, QA

## What You Own
You are responsible for everything the **user sees and experiences** in the browser, the written FYP report, and ensuring the system works correctly through testing.

---

## Section A: UI/UX Design

### Tools & Libraries

| Tool / Library | Definition | Where Used in Project |
|:---|:---|:---|
| **React 18** | A JavaScript library for building user interfaces using reusable components. Each page (Login, Upload, Dashboard) is a React component. | All files in `Frontend/src/` |
| **Vite** | A blazing-fast build tool and dev server for React projects. Replaces older tools like Create React App. | `Frontend/vite.config.js` |
| **TailwindCSS** | A CSS framework where you style elements by adding class names directly in HTML/JSX (e.g., `className="text-red-500 p-4"`). No separate CSS file needed. | Every `.jsx` file |
| **Framer Motion** | Animation library for React. Used to add smooth fade-in, slide, and scale animations on page transitions and modals. | Upload page animations |
| **Lucide React** | A library of 1000+ clean SVG icons as React components (e.g., `<Upload />`, `<AlertTriangle />`). | Sidebar, buttons, cards |
| **Recharts** | A charting library built on React. Used for Bar charts, Line charts, and Pie charts in dashboards. | `ChartComponents.jsx`, Dashboards |
| **clsx** | A tiny utility to conditionally join CSS class names together cleanly. Example: `clsx("base-class", isAnomaly && "text-red-500")` | `Results.jsx`, many UI components |
| **tailwind-merge** | Merges conflicting TailwindCSS classes intelligently so you don't get duplicate/conflicting styles. | Combined with clsx |

### Key Files You Manage

| File | What It Does |
|:---|:---|
| `Frontend/src/pages/user/Upload.jsx` | The main detection page — category selector, drag-and-drop image upload, progress indicator |
| `Frontend/src/pages/user/Results.jsx` | The 4-panel IEEE visualization: Input Image, Anomaly Map, Overlay, Defect Localization |
| `Frontend/src/pages/user/Dashboard.jsx` | User stats page with activity charts |
| `Frontend/src/pages/user/History.jsx` | Table of past detections with search and re-view |
| `Frontend/src/pages/shared/Login.jsx` | Login form with email/password |
| `Frontend/src/pages/shared/Register.jsx` | Signup form with validation |
| `Frontend/src/components/Sidebar.jsx` | Navigation sidebar — shows different links for admin vs user |
| `Frontend/src/index.css` | Global CSS resets and base styles |

### Key Code to Know for Defense

**How the 4-panel grid works (Results.jsx ~Line 302):**
```jsx
<div className="grid grid-cols-2 gap-3">
  {/* Panel (a) — Input Image */}
  <div><img src={displayImage} alt="Original" /></div>

  {/* Panel (b) — Anomaly Map */}
  <div><img src={getFullUrl(result.hotMapPath)} alt="Anomaly Map" /></div>

  {/* Panel (c) — Overlay */}
  <div><img src={getFullUrl(result.heatmapPath)} alt="Overlay" /></div>

  {/* Panel (d) — Defect Localization */}
  <div><img src={getFullUrl(result.contourPath)} alt="Contours" /></div>
</div>
```
**Chairperson may ask:** *"How do you show the anomaly heatmap?"*
Answer: The backend generates 4 image files and returns their paths. The frontend loads them via `<img src={...} />`.

**How protected routes work (ProtectedRoute.jsx):**
```jsx
if (!user) return <Navigate to="/login" />;
if (requiredRole && user.role !== requiredRole) return <Navigate to="/dashboard" />;
return children;
```
**Chairperson may ask:** *"How do you prevent a normal user from accessing admin pages?"*
Answer: `ProtectedRoute` checks the user's `role` from `AuthContext`. If it doesn't match, they are redirected.

---

## Section B: Documentation Writing

### Tools Used

| Tool | Purpose |
|:---|:---|
| **Markdown (.md)** | Text formatting language — uses `#` for headings, `**bold**`, `` ` `` for code. All docs are written in Markdown. |
| **Marp** | A tool that converts Markdown files into professional presentation slides. Used for `FYP_Presentation_Slides.md`. |

### Documents You Own

| Document | Location |
|:---|:---|
| FYP Report | `docs/FYP_Documentation.md` |
| Presentation Slides | `docs/FYP_Presentation_Slides.md` |
| This Learning Guide | `docs/LEARN_THE_PROJECT.md` |

---

## Section C: QA Testing

### What QA Testing Means
Quality Assurance (QA) testing means verifying that every feature works as expected. You test the system as both a **normal user** and a **potential attacker** (boundary cases).

### Test Cases You Should Know

| Test Case | Steps | Expected Result |
|:---|:---|:---|
| Login with wrong password | Enter correct email, wrong password | Error: "Incorrect email or password" |
| Upload non-image file | Try to upload a .pdf or .txt | Error: file type rejected |
| Upload image > 20MB | Upload a very large image | Error: file size limit exceeded |
| Normal image detection | Upload a clean product image | Result: NORMAL, green badge |
| Anomaly image detection | Upload a defective product image | Result: ANOMALY DETECTED, red badge, heatmap shown |
| Access admin page as user | Navigate to `/admin/dashboard` | Redirected to user dashboard |
| OTP expiry test | Request OTP, wait 6+ minutes, then try to use it | Error: OTP has expired |

---

# 🗄️ SUBHAN AHMAD — Database Management, QA Testing

## What You Own
You are responsible for **how data is stored, structured, and retrieved**. Every image uploaded, every detection result, and every user account is stored in the database you manage.

---

## Section A: Database Management

### Tools & Libraries

| Tool / Library | Definition | Where Used |
|:---|:---|:---|
| **PostgreSQL** | A powerful, production-grade relational database. Data is stored in tables with rows and columns. The project uses PostgreSQL in production. | Configured via `DATABASE_URL` in `.env` |
| **SQLite** | A lightweight file-based database. Used in development when PostgreSQL is not set up. The entire database is one `.db` file. | Development environment |
| **SQLAlchemy 2.0** | A Python library (ORM = Object-Relational Mapper). Lets you define database tables as Python classes. Instead of writing raw SQL, you write Python objects. | `Backend/app/models/*.py`, `Backend/app/crud/*.py` |
| **Alembic** | A database migration tool. When you change a SQLAlchemy model (add a column, rename a table), Alembic generates and runs the SQL to update the real database. | `Backend/alembic/` |
| **Pydantic** | A Python library for data validation. Used to define the exact shape (schema) of data going in and out of the API. | `Backend/app/schemas/*.py` |
| **psycopg2-binary** | The PostgreSQL database driver for Python. SQLAlchemy uses this under the hood to communicate with PostgreSQL. | `requirements.txt` |

### The Database Tables

#### `users` table
```
id          → Primary Key (auto-increment integer)
email       → Unique, must be @gmail.com
hashed_password → Password stored as bcrypt hash (NEVER plain text)
full_name   → Display name
role        → "user" or "admin"
is_active   → True/False (soft delete — deactivating user, not deleting)
avatar_url  → Optional profile photo URL
reset_token → OTP token for password reset (6-digit code)
reset_token_expiry → When the OTP expires (5 minutes from creation)
created_at  → Timestamp when account was created
```

#### `images` table
```
id          → Primary Key
filename    → Original uploaded filename
file_path   → Path where image is saved on server (e.g., /static/uploads/abc.jpg)
upload_date → Timestamp
user_id     → Foreign Key → users.id (which user uploaded this)
```

#### `results` table
```
id          → Primary Key
image_id    → Foreign Key → images.id (which image was analyzed)
anomaly_score → Float (e.g., 1.45 means 145% above threshold)
threshold   → Float (the model's decision boundary)
is_anomaly  → True/False
heatmap_path → Path to the generated overlay heatmap
model_version → String like "PatchCore-WideResNet50-v1"
details     → JSON field for extra metadata
created_at  → Timestamp
```

#### `history` table
```
id              → Primary Key
user_id         → Foreign Key → users.id
filename        → Image filename
file_path       → Path to uploaded image
status          → "Normal" or "Anomaly"
score           → Anomaly score
heatmap_path    → Overlay heatmap path
hot_map_path    → HOT colormap image path
contour_path    → Defect localization image path
comparison_path → 4-panel comparison image path
threshold       → Detection threshold used
category        → Which product category (e.g., "bottle", "wood")
created_at      → Timestamp
```

#### `categories` table
```
id         → Primary Key
name       → Category name (e.g., "bottle", "wood", "cable")
model_path → Path to .pkl file (e.g., ml_models/bottle_latest_patchcore.pkl)
threshold  → Detection threshold for this category
i_auroc    → Image-level AUROC score (model accuracy metric)
p_auroc    → Pixel-level AUROC score
is_trained → True if model file exists
created_at → Timestamp
```

### Key Files You Manage

| File | What It Does |
|:---|:---|
| `Backend/app/models/user.py` | Defines the `users` database table as a Python class |
| `Backend/app/models/history.py` | Defines the `history` table |
| `Backend/app/models/category.py` | Defines the `categories` table |
| `Backend/app/crud/crud_user.py` | Functions to get/create/update/delete users |
| `Backend/app/crud/crud_history.py` | Functions to save and retrieve detection history |
| `Backend/app/db/session.py` | Creates the database connection |
| `Backend/alembic/versions/` | Contains all database migration scripts |

### Key Code to Know for Defense

**How a SQLAlchemy model looks (user.py):**
```python
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="user")
    is_active = Column(Boolean, default=True)
```
**Chairperson may ask:** *"How is the database structured?"*
Answer: We use SQLAlchemy ORM — each Python class maps to one database table. Relationships are defined using `ForeignKey` (e.g., `history.user_id` → `users.id`).

**How a CRUD function works (crud_user.py):**
```python
def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()
```
**Chairperson may ask:** *"How do you query the database?"*
Answer: We use SQLAlchemy's query builder. `db.query(User).filter(...).first()` is equivalent to `SELECT * FROM users WHERE email = ? LIMIT 1`.

---

## Section B: QA Testing (shared with Mehak)

### Additional Database-Level Tests

| Test | What to Check |
|:---|:---|
| History persists after re-login | Upload image, logout, log back in — history should still show |
| Admin cannot delete themselves | Try DELETE `/admin/users/{own_id}` → should return error |
| Duplicate email registration | Register twice with same email → second attempt should fail |
| Password is hashed | Check database — hashed_password should never equal plain password |

---

# 🤖 MUHAMMAD UMER — ML Model Development, Backend API

## What You Own
You are responsible for the **brain** of the system — the machine learning engine that detects anomalies, and the API that connects it to the frontend.

---

## Section A: ML Model Development

### Tools & Libraries

| Tool / Library | Definition | Where Used |
|:---|:---|:---|
| **PyTorch** | The most popular deep learning framework. Used to load the pre-trained WideResNet50 model and run feature extraction. | `Backend/app/ml/inference.py` |
| **torchvision** | PyTorch's computer vision library. Provides pre-trained models (`wide_resnet50_2`) and image transforms. | `Backend/app/ml/inference.py`, `preprocess.py` |
| **OpenCV (cv2)** | Computer Vision library for image processing. Used to resize images, apply colormaps (HOT, JET), draw bounding boxes and contours. | `Backend/app/ml/postprocess.py`, `preprocess.py` |
| **NumPy** | The fundamental library for numerical computing in Python. Used to manipulate arrays — the anomaly map is a NumPy 2D array. | Throughout ML pipeline |
| **SciPy** | Scientific computing library. Used for `gaussian_filter` to smooth the anomaly map before visualization. | `postprocess.py`, `inference.py` |
| **Pillow (PIL)** | Python image processing library. Used for reading images and format conversion. | `preprocess.py` |
| **rembg** | Background removal library. When "Isolate Object" mode is on, removes image background before inference to reduce false positives. | `preprocess.py` |
| **tqdm** | Progress bar library — shows training progress in the terminal. | `train.py` |

### The PatchCore Algorithm — Explained Simply

**Problem:** We need to detect defects without any labeled defect examples.

**Solution — PatchCore in 4 steps:**

1. **Training (done once per category):**
   - Feed hundreds of NORMAL product images through WideResNet50 (a pre-trained neural network)
   - Extract features from `layer2` and `layer3` — these create a "fingerprint" of what NORMAL looks like
   - Store all these fingerprints in a **memory bank**
   - Use **greedy coreset subsampling** to reduce memory bank to 10% of its size while keeping coverage
   - Save memory bank + detection threshold to a `.pkl` file

2. **Inference (for each new image):**
   - Feed new image through WideResNet50 → get patch features
   - For each patch, find its **nearest neighbor** in the memory bank
   - The distance to the nearest neighbor = how "unusual" that patch is
   - High distance = anomalous region

3. **Scoring:**
   - `raw_score = mean of top 1% highest patch distances`
   - `anomaly_score = raw_score / p99_normal` (normalize against training distribution)
   - If `anomaly_score > threshold` → **ANOMALY DETECTED**

4. **Visualization:**
   - Reshape patch distances into a 2D anomaly map
   - Apply HOT colormap → Panel (b)
   - Blend with JET on original → Panel (c)
   - Find contours → draw bounding boxes → Panel (d)

### Key Files You Manage

| File | What It Does |
|:---|:---|
| `Backend/app/ml/train.py` | Training script — extracts features, builds memory bank, saves .pkl |
| `Backend/app/ml/inference.py` | Inference engine — runs PatchCore on a new image, returns anomaly score + map |
| `Backend/app/ml/model_loader.py` | Loads .pkl files from disk, caches in memory for speed |
| `Backend/app/ml/preprocess.py` | Prepares image: resize to 224×224, normalize with ImageNet mean/std |
| `Backend/app/ml/postprocess.py` | Generates all 4 heatmap visualization images |
| `Backend/app/ml/threshold.py` | Reads/writes detection threshold from .pkl file |
| `Backend/ml_models/*.pkl` | Saved trained models (one per category) |

### Key Code to Know for Defense

**Feature extraction hook (inference.py ~Line 38):**
```python
def _make_hook(name):
    def hook(module, input, output):
        _features[name] = output.detach()
    return hook

backbone.layer2.register_forward_hook(_make_hook("layer2"))
backbone.layer3.register_forward_hook(_make_hook("layer3"))
```
**Chairperson may ask:** *"How do you extract features from the model?"*
Answer: We register forward hooks on `layer2` and `layer3` of WideResNet50. When an image passes through the network, these hooks automatically capture the intermediate feature maps.

**Anomaly scoring (inference.py ~Line 186):**
```python
distances = torch.cdist(patch_features, memory_bank, p=2.0)
nn_dists, _ = distances.min(dim=1)
top_k = max(1, int(len(nn_dists) * 0.01))
topk_vals, _ = torch.topk(nn_dists, k=top_k, largest=True)
raw_score = float(topk_vals.mean().item())
anomaly_score = raw_score / p99_normal
```
**Chairperson may ask:** *"How is the anomaly score computed?"*
Answer: We compute L2 distances between each image patch and its nearest neighbor in the memory bank. The score is the mean distance of the top 1% most anomalous patches, normalized by the 99th percentile of training scores.

**Defect localization (postprocess.py ~Line 140):**
```python
_, max_val, _, max_loc = cv2.minMaxLoc(norm_map)
cx_peak, cy_peak = max_loc
p97 = int(np.percentile(norm_map, 97))
_, binary_mask = cv2.threshold(norm_map, p97, 255, cv2.THRESH_BINARY)
```
**Chairperson may ask:** *"How do you localize the defect precisely?"*
Answer: We find the global maximum pixel in the anomaly map (the hottest point). Then we threshold at the 97th percentile to get only the top 3% hottest pixels. We find contours in that mask and filter to only keep contours near the peak hotspot.

---

## Section B: Backend API Integration

### Tools & Libraries

| Tool / Library | Definition | Where Used |
|:---|:---|:---|
| **FastAPI** | A modern, high-performance Python web framework. Automatically generates API docs. Much faster than Flask/Django for async operations. | `Backend/app/main.py`, all endpoint files |
| **Uvicorn** | The ASGI server that runs the FastAPI application. "ASGI" means it handles multiple requests concurrently without waiting. | Started with `uvicorn app.main:app` |
| **python-jose** | JWT (JSON Web Token) library. Used to create and verify authentication tokens. | `Backend/app/core/security.py` |
| **passlib[bcrypt]** | Password hashing library. `bcrypt` is a slow, secure hashing algorithm that protects against brute-force attacks. | `Backend/app/core/security.py` |
| **python-multipart** | Allows FastAPI to receive file uploads (`multipart/form-data`). Required for the `/ml/predict` endpoint. | `Backend/app/api/v1/endpoints/ml.py` |
| **Axios** | A JavaScript HTTP client library used in the frontend to make API calls to the backend. | `Frontend/src/services/api.js` |

### The Full API Request Flow — `/ml/predict`

When a user uploads an image, here is exactly what happens step by step:

```
1. User selects category "wood" and uploads image.jpg
         ↓
2. Frontend (Upload.jsx) calls mlApi.predict(formData)
         ↓
3. Axios sends POST request to http://localhost:8000/api/v1/ml/predict
   with headers: { Authorization: "Bearer JWT_TOKEN" }
         ↓
4. FastAPI receives request → deps.py decodes JWT → confirms user is authenticated
         ↓
5. ml.py endpoint saves image to static/uploads/abc123.jpg
         ↓
6. Calls run_inference(image_path="static/uploads/abc123.jpg", category="wood")
         ↓
7. inference.py:
   a. Loads WideResNet50 backbone
   b. Loads wood memory bank from ml_models/wood_latest_patchcore.pkl
   c. Preprocesses image (resize to 224×224, normalize)
   d. Runs forward pass → gets layer2 + layer3 features
   e. Computes nearest-neighbor distances against memory bank
   f. Calculates anomaly_score = raw_score / p99_normal
   g. Returns: { anomaly_score, anomaly_map, is_anomaly, threshold }
         ↓
8. postprocess.py generates 4 heatmap images:
   - heatmap_abc123.png (JET overlay)
   - heatmap_abc123_hot.png (HOT anomaly map)
   - heatmap_abc123_contour.png (defect localization)
   - comparison_heatmap_abc123.png (4-panel comparison)
         ↓
9. ml.py saves result to database (images + results + history tables)
         ↓
10. Returns JSON response with all paths and scores
         ↓
11. Frontend (Upload.jsx) receives response, navigates to Results.jsx
         ↓
12. Results.jsx displays the 4 images in the IEEE-style panel grid
```

**Chairperson may ask:** *"Walk me through what happens when a user uploads an image."*
Use the flow above as your answer.

### Key Code to Know for Defense

**JWT Authentication dependency (deps.py):**
```python
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
    user = crud_user.get_user_by_email(db, email=payload.get("sub"))
    if not user or not user.is_active:
        raise HTTPException(status_code=401)
    return user
```
**Chairperson may ask:** *"How does authentication work?"*
Answer: Every protected endpoint declares `Depends(get_current_user)`. FastAPI automatically extracts the Bearer token from the Authorization header, decodes it using our secret key, and fetches the user from the database.

---

# 📊 System Performance Metrics (For All Members)

| Metric | Value | Meaning |
|:---|:---|:---|
| Image-level AUROC | **98.1%** | The model correctly classifies 98.1% of images as normal/anomaly |
| Pixel-level AUROC | **97.4%** | The heatmap correctly highlights 97.4% of defective pixels |
| Inference Time | **~150ms** | Time from image upload to result returned |
| Supported Categories | **15** | All MVTec AD benchmark categories supported |
| Max Upload Size | **20MB** | Maximum image file size |
| Token Expiry | **30 minutes** | JWT tokens expire 30 minutes after login |

---

# ❓ Common Chairperson Questions & Answers

| Question | Best Answer |
|:---|:---|
| Why PatchCore and not CNN classification? | PatchCore is unsupervised — it needs ZERO defect examples for training. A CNN classifier would require thousands of labeled defective images which are rare in real factories. |
| What is AUROC? | Area Under the ROC Curve. It measures how well a model separates two classes. 1.0 = perfect, 0.5 = random guessing. Our 98.1% is near-perfect. |
| How do you handle unknown defects? | PatchCore detects ANY deviation from normal, so it automatically handles defect types it has never seen before. |
| Is the system real-time? | Yes — inference takes ~150ms, making it suitable for real-time quality control with ~6 inspections per second. |
| What happens if the model is not trained for a category? | The API returns HTTP 503 with message "Model not trained for category". The admin dashboard shows which categories are trained. |
| How is data secured? | Passwords are hashed with bcrypt, sessions use JWT with 30-minute expiry, all endpoints are protected by token authentication. |
| Can it work without internet? | Yes — after setup, the system runs entirely locally (no external API calls). The ML model is self-contained. |
