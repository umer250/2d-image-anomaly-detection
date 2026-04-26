"""
Production-level seed script to bootstrap the first admin account.

This script is IDEMPOTENT — running it multiple times is safe.
Admin credentials are read from environment variables, NOT hardcoded.

Usage:
    cd Backend
    python scripts/seed_admin.py

Environment Variables (set in .env or system env):
    ADMIN_EMAIL     — default: admin@anomalydetect.io
    ADMIN_PASSWORD  — REQUIRED in production (no default)
    ADMIN_FULL_NAME — default: System Administrator
"""

import os
import sys
import logging

# Add the Backend root to sys.path so app imports work
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger("seed_admin")


def create_admin_user():
    """Idempotent: creates the first admin user if it doesn't already exist."""
    from app.db.session import SessionLocal
    from app.crud import crud_user
    from app.schemas.user import UserCreate

    # ── Read credentials from environment (production-safe) ──────────────────
    admin_email = os.getenv("ADMIN_EMAIL", "admin@anomalydetect.io")
    admin_password = os.getenv("ADMIN_PASSWORD")
    admin_full_name = os.getenv("ADMIN_FULL_NAME", "System Administrator")

    if not admin_password:
        logger.error(
            "ADMIN_PASSWORD environment variable is not set. "
            "Set it before running this script in production.\n"
            "  Example: set ADMIN_PASSWORD=YourStrongPassword123!\n"
            "  (Windows) or export ADMIN_PASSWORD=... (Linux/Mac)"
        )
        sys.exit(1)

    # ── Validate password strength ────────────────────────────────────────────
    import re
    pwd_pattern = r"^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$"
    if not re.match(pwd_pattern, admin_password):
        logger.error(
            "ADMIN_PASSWORD is too weak. Requirements:\n"
            "  - At least 8 characters\n"
            "  - At least 1 uppercase letter\n"
            "  - At least 1 digit\n"
            "  - At least 1 special character (!@#$%^&*)"
        )
        sys.exit(1)

    db = SessionLocal()
    try:
        # ── Idempotency check ─────────────────────────────────────────────────
        existing = crud_user.get_user_by_email(db, email=admin_email)
        if existing:
            if existing.role == "admin":
                logger.info(f"Admin account already exists: {admin_email} — skipping.")
            else:
                logger.warning(
                    f"User '{admin_email}' exists but is not an admin. "
                    "Update role manually in the database if needed."
                )
            return

        # ── Create admin user ─────────────────────────────────────────────────
        admin_data = UserCreate(
            email=admin_email,
            password=admin_password,
            full_name=admin_full_name,
            role="admin",
            is_active=True,
            is_superuser=True,
        )
        admin_user = crud_user.create_user(db, user=admin_data)

        logger.info("=" * 60)
        logger.info("  ✅  Admin account created successfully!")
        logger.info(f"  Email   : {admin_user.email}")
        logger.info(f"  Name    : {admin_user.full_name}")
        logger.info(f"  Role    : {admin_user.role}")
        logger.info("=" * 60)
        logger.info("  ⚠️  Store the password securely and rotate it after first login.")

    except Exception as exc:
        logger.exception(f"Failed to create admin user: {exc}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()


def seed_categories():
    """Seed all 15 MVTec AD categories into the DB (idempotent)."""
    from app.db.session import SessionLocal
    from app.crud.crud_category import seed_default_categories

    db = SessionLocal()
    try:
        inserted = seed_default_categories(db)
        if inserted:
            logger.info(f"✅  Seeded {inserted} new categories into the database.")
        else:
            logger.info("Categories already seeded — no changes needed.")
    except Exception as exc:
        logger.exception(f"Failed to seed categories: {exc}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    logger.info("Starting database seed process...")
    logger.info("Step 1/2: Seeding categories...")
    seed_categories()
    logger.info("Step 2/2: Creating admin user...")
    create_admin_user()
    logger.info("Database seed complete.")
