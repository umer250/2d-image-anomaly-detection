"""
FastAPI application entry point.

Startup sequence:
    1. Create required directories (static, uploads, heatmaps)
    2. Run DB migrations check (Alembic)
    3. Auto-seed all 15 MVTec categories (idempotent)
    4. Auto-create admin account if ADMIN_EMAIL + ADMIN_PASSWORD are set (idempotent)
"""

import os
import re
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.api.v1.api import api_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app.startup")

# ── Rate limiter ───────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)

# ── Required directories ───────────────────────────────────────────────────────
_REQUIRED_DIRS = ["static", "uploads", "heatmaps", "static/uploads", "static/heatmaps"]


def _create_directories():
    for d in _REQUIRED_DIRS:
        os.makedirs(d, exist_ok=True)


def _seed_db():
    """Idempotently seed categories and optionally the admin account."""
    try:
        from app.db.session import SessionLocal
        from app.crud.crud_category import seed_default_categories
        from app.crud import crud_user
        from app.schemas.user import UserCreate

        db = SessionLocal()
        try:
            # ── Seed all 15 MVTec categories ──────────────────────────────────
            inserted = seed_default_categories(db)
            if inserted:
                logger.info(f"[startup] Seeded {inserted} new category records.")
            else:
                logger.info("[startup] Categories already up to date.")

            # ── Auto-create admin account if env vars are set ─────────────────
            admin_email = os.getenv("ADMIN_EMAIL")
            admin_password = os.getenv("ADMIN_PASSWORD")
            admin_name = os.getenv("ADMIN_FULL_NAME", "System Administrator")

            if admin_email and admin_password:
                existing = crud_user.get_user_by_email(db, email=admin_email)
                if not existing:
                    # Validate password complexity
                    pwd_ok = re.match(
                        r"^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$",
                        admin_password,
                    )
                    if pwd_ok:
                        crud_user.create_user(
                            db,
                            UserCreate(
                                email=admin_email,
                                password=admin_password,
                                full_name=admin_name,
                                role="admin",
                                is_active=True,
                                is_superuser=True,
                            ),
                        )
                        logger.info(f"[startup] Admin account created: {admin_email}")
                    else:
                        logger.warning(
                            "[startup] ADMIN_PASSWORD is too weak — admin not created. "
                            "Needs 8+ chars, 1 uppercase, 1 digit, 1 special char."
                        )
                else:
                    logger.info(f"[startup] Admin account already exists: {admin_email}")
            else:
                logger.info(
                    "[startup] ADMIN_EMAIL / ADMIN_PASSWORD not set — "
                    "skipping auto-admin creation. "
                    "Run scripts/seed_admin.py manually for first deployment."
                )
        finally:
            db.close()
    except Exception as exc:
        # Non-fatal — app still starts even if seeding fails (e.g., DB not ready yet)
        logger.error(f"[startup] DB seed failed (non-fatal): {exc}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup → yield → shutdown."""
    logger.info("[startup] Initializing 2D Anomaly Detection API...")
    _create_directories()
    _seed_db()
    logger.info("[startup] Ready.")
    yield
    logger.info("[shutdown] Shutting down.")


# ── FastAPI app ────────────────────────────────────────────────────────────────
app = FastAPI(
    title=settings.PROJECT_NAME,
    description=(
        "2D Image Anomaly Detection REST API — "
        "PatchCore WideResNet50 | 15 MVTec AD Categories"
    ),
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── Rate limiter ───────────────────────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ───────────────────────────────────────────────────────────────────────
_cors_origins = settings.BACKEND_CORS_ORIGINS
# If still wildcard (dev fallback), warn loudly
if _cors_origins == ["*"]:
    logger.warning("[startup] CORS is set to '*' — restrict BACKEND_CORS_ORIGINS in production!")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=len(_cors_origins) > 0 and _cors_origins != ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────────────────────────
app.include_router(api_router, prefix=settings.API_V1_STR)

# ── Static file mounts ─────────────────────────────────────────────────────────
app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.mount("/heatmaps", StaticFiles(directory="heatmaps"), name="heatmaps")


# ── Health & Root ──────────────────────────────────────────────────────────────
@app.get("/", tags=["health"])
def root():
    return {
        "message": "Welcome to 2D Anomaly Detection API",
        "docs": "/docs",
        "version": "1.0.0",
    }


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok", "version": "1.0.0", "service": "anomaly-detection-api"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
