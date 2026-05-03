
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

limiter = Limiter(key_func=get_remote_address)

_REQUIRED_DIRS = ["static", "uploads", "heatmaps", "static/uploads", "static/heatmaps"]


def _create_directories():
    for d in _REQUIRED_DIRS:
        os.makedirs(d, exist_ok=True)


def _seed_db():
    try:
        from app.db.session import SessionLocal
        from app.crud.crud_category import seed_default_categories
        from app.crud import crud_user
        from app.schemas.user import UserCreate

        db = SessionLocal()
        try:
            inserted = seed_default_categories(db)
            if inserted:
                logger.info(f"[startup] Seeded {inserted} new category records.")
            else:
                logger.info("[startup] Categories already up to date.")

            admin_email = settings.ADMIN_EMAIL
            admin_password = settings.ADMIN_PASSWORD
            admin_name = settings.ADMIN_FULL_NAME or "System Administrator"

            if admin_email and admin_password:
                existing = crud_user.get_user_by_email(db, email=admin_email)
                if not existing:
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
        logger.error(f"[startup] DB seed failed (non-fatal): {exc}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("[startup] Initializing 2D Anomaly Detection API...")
    _create_directories()
    _seed_db()
    logger.info("[startup] Ready.")
    yield
    logger.info("[shutdown] Shutting down.")


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

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

_cors_origins = settings.BACKEND_CORS_ORIGINS
if _cors_origins == ["*"]:
    logger.warning("[startup] CORS is set to '*' — restrict BACKEND_CORS_ORIGINS in production!")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=len(_cors_origins) > 0 and _cors_origins != ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.mount("/heatmaps", StaticFiles(directory="heatmaps"), name="heatmaps")


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
