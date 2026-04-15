from sqlalchemy.orm import Session
from typing import List, Optional

from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate

# All MVTec AD categories
DEFAULT_CATEGORIES = [
    "bottle", "bottle_latest", "bottle_v2", "cable", "capsule", "carpet", "grid",
    "hazelnut", "leather", "metal_nut", "pill", "screw",
    "tile", "toothbrush", "transistor", "wood", "zipper",
]


def get_all_categories(db: Session) -> List[Category]:
    return db.query(Category).order_by(Category.name).all()


def get_category_by_name(db: Session, name: str) -> Optional[Category]:
    return db.query(Category).filter(Category.name == name).first()


def get_category_by_id(db: Session, category_id: int) -> Optional[Category]:
    return db.query(Category).filter(Category.id == category_id).first()


def create_category(db: Session, category_in: CategoryCreate) -> Category:
    db_category = Category(**category_in.model_dump())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


def update_category(
    db: Session, category_id: int, category_in: CategoryUpdate
) -> Optional[Category]:
    db_category = get_category_by_id(db, category_id)
    if not db_category:
        return None
    update_data = category_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_category, field, value)
    db.commit()
    db.refresh(db_category)
    return db_category


def seed_default_categories(db: Session) -> int:
    """Insert all default MVTec categories if they don't already exist. Returns count inserted."""
    inserted = 0
    for name in DEFAULT_CATEGORIES:
        if not get_category_by_name(db, name):
            db.add(Category(name=name))
            inserted += 1
    if inserted:
        db.commit()
    return inserted
