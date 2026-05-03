from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.image import Image
from app.schemas.image import ImageCreate

def create_image(db: Session, image: ImageCreate) -> Image:
    db_image = Image(
        filename=image.filename,
        file_path=image.file_path,
        user_id=image.user_id
    )
    db.add(db_image)
    db.commit()
    db.refresh(db_image)
    return db_image

def get_image(db: Session, image_id: int) -> Optional[Image]:
    return db.query(Image).filter(Image.id == image_id).first()

def get_images_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Image]:
    return db.query(Image).filter(Image.user_id == user_id).offset(skip).limit(limit).all()

def get_all_images(db: Session, skip: int = 0, limit: int = 100) -> List[Image]:
    return db.query(Image).offset(skip).limit(limit).all()
