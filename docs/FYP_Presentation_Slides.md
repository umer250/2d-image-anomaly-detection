---
marp: true
theme: default
class: lead
backgroundColor: #f8f9fa
---

# 2D Image Anomaly Detection System
## Final Year Project Defense

**Department of Computer Science**
University of Gujrat

---

## 👥 Meet the Team

- **Muhammad Umer** (22081519-013)
- **Subhan Ahmed** (22081519-005)
- **Mehak Mehmood** (22081519-003)

---

## 🚨 Problem Statement

Manual visual inspection in manufacturing is:
- **Slow:** Cannot scale with high-speed assembly lines.
- **Inconsistent:** Prone to human error due to fatigue.
- **Costly:** Requires massive manpower for Quality Assurance (QA).
- **Data-Scarce:** Existing AI models require thousands of "defective" images to train, which are rare in real life.

---

## 💡 Our Solution

An automated, end-to-end **2D Image Anomaly Detection System**:
- Uses **Unsupervised Learning** (PatchCore).
- Trains **only** on "Normal" images (Zero-shot/Few-shot learning for defects).
- Automatically identifies structural and logical defects.
- Generates **Heatmaps** to pinpoint the exact location of the defect.
- Supports all **15 MVTec AD** industrial categories.

---

## 🏗️ Technology Stack

- **Machine Learning Engine:** PyTorch, WideResNet50, PatchCore Algorithm
- **Backend API:** FastAPI (Python), SQLAlchemy
- **Frontend Interface:** React.js, TailwindCSS
- **Database:** PostgreSQL / SQLite

---

## ⚙️ System Architecture

1. **User Input:** Operator selects a product category (e.g., Bottle) and uploads an image.
2. **FastAPI Backend:** Receives the image and loads the corresponding `.pkl` PatchCore model.
3. **PyTorch Inference:** 
   - Extracts deep features via WideResNet50.
   - Compares features to the nominal "Memory Bank".
   - Calculates anomaly scores.
4. **Output:** Frontend displays "Normal" or "Anomaly" along with an overlaid heatmap.

---

## 📊 Methodology (PatchCore)

1. **Feature Extraction:** Passes normal images through WideResNet50 to extract mid-level features.
2. **Coreset Subsampling:** Compresses the massive feature map into a highly efficient "Memory Bank".
3. **Nearest Neighbor Search:** During inference, the system checks if the new image's features exist in the normal Memory Bank.
4. **Heatmap Generation:** Pixels that deviate furthest from the normal baseline are highlighted in red.

---

## 💻 System Features & UI

- **Role-Based Access:** Secure login for Admins and QA Operators.
- **Intuitive Detection Interface:** Drag-and-drop zone for rapid image scanning.
- **Instant Visual Feedback:** Side-by-side comparison of the original image and the generated heatmap.
- **Global Dashboard:** Admins can view total scans, anomaly rates, and system throughput in real-time.
- **Historical Logs:** Persistent tracking of all past scans for audit compliance.

---

## 📈 Results & Evaluation

- **Dataset:** Evaluated against the industry-standard **MVTec AD** dataset (5000+ high-res images).
- **Categories Supported:** 15 distinct industrial items (Textures & Objects).
- **Image-Level Accuracy (AUROC):** Achieved **>98%** average accuracy in classifying defective vs. normal items.
- **Pixel-Level Accuracy:** Achieved **>97%** accuracy in drawing the heatmap directly over the defect.
- **Inference Speed:** ~150ms per image, suitable for real-time applications.

---

## 🚀 Conclusion & Future Work

**Conclusion:** 
We successfully built an enterprise-ready, full-stack anomaly detection platform that abstracts complex AI logic behind a simple, accessible UI.

**Future Work:**
1. Direct integration with physical conveyor belt cameras via RTSP feeds.
2. Expansion into 3D point-cloud anomaly detection.
3. Implementation of Active Learning (human-in-the-loop) for continuous model improvement.

---

# Thank You!
## Questions & Answers

*Muhammad Umer | Subhan Ahmed | Mehak Mehmood*
