# 2D Image Anomaly Detection - Project Structure

The project follows a highly modular, Domain-Driven Design (DDD) for the backend and a Component-Based Architecture for the frontend. This ensures clear separation of concerns, scalability, and maintainability.

```text
2d-image-anomaly-detection/
├── Backend/                         # FastAPI Python Backend
│   ├── alembic/                     # Database migration scripts (version control for SQL)
│   ├── app/                         # Core Application Logic
│   │   ├── api/                     # REST API Controllers
│   │   │   └── v1/                  # API Version 1 endpoints (auth, detect, users, etc.)
│   │   ├── core/                    # System-wide configs and security (JWT, hashing)
│   │   ├── crud/                    # Data Access Layer (Create, Read, Update, Delete)
│   │   ├── db/                      # Database connection and session management
│   │   ├── models/                  # SQLAlchemy ORM Models (SQL table definitions)
│   │   ├── schemas/                 # Pydantic validation schemas (Input/Output data types)
│   │   └── services/                # Business Logic & ML Inference (PatchCore processing)
│   │       ├── patchcore_service.py # Core algorithm execution
│   │       └── ml_inference.py      # Feature extraction handling
│   ├── models/                      # Stored PyTorch/PatchCore (.pkl) weight files
│   ├── scripts/                     # Utility and initialization scripts (e.g., DB seeders)
│   ├── requirements.txt             # Python dependencies
│   └── main.py                      # FastAPI Application entry point
│
├── Frontend/                        # React + Vite Web Application
│   ├── public/                      # Static assets
│   │   ├── samples/                 # Test images for 15 MVTec AD categories
│   │   └── logos/                   # Brand and UI graphics
│   ├── src/                         # React Source Code
│   │   ├── components/              # Reusable UI components (Sidebar, Charts, Modals)
│   │   │   └── layout/              # View wrappers (AdminLayout, UserLayout)
│   │   ├── context/                 # Global state management (AuthContext)
│   │   ├── pages/                   # Application Views
│   │   │   ├── admin/               # Administrator views (Dashboards, User Management)
│   │   │   ├── user/                # QA Operator views (Detection, History, Upload)
│   │   │   └── shared/              # Public views (Login, Registration, Password Reset)
│   │   ├── routes/                  # React Router DOM configurations
│   │   └── services/                # Axios API communication layer (api.js, mlApi.js)
│   ├── package.json                 # Node.js dependencies
│   └── vite.config.js               # Frontend build configuration
│
└── docs/                            # Project Documentation
    ├── FYP_Documentation.md         # Complete Final Year Project Report
    ├── FYP_Presentation_Slides.md   # Defense Presentation Slides
    └── kaggle_visualization.py      # Scripts for generating metric charts
```

## Architectural Highlights

1. **Separation of Concerns:** The machine learning algorithms (`Backend/app/services`) are completely decoupled from the web routing logic (`Backend/app/api`). This allows the ML models to be upgraded without affecting the REST API.
2. **Role-Based Routing:** The frontend cleanly separates the operator interfaces (`src/pages/user`) from the administrative interfaces (`src/pages/admin`), enhancing security and simplifying UI state management.
3. **Type Safety & Validation:** The backend uses Pydantic schemas to strictly validate all incoming image payloads and authentication tokens before they ever reach the database or ML engine.
