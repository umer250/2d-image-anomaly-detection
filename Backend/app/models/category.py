from sqlalchemy import Boolean, Column, Float, Integer, String, DateTime
from sqlalchemy.sql import func
from app.db.base import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    name = Column(String(50), unique=True, nullable=False, index=True)   # e.g. "bottle"
    model_path = Column(String(255), nullable=True)                      # path to .pkl file
    threshold = Column(Float, nullable=True)                             # per-category anomaly threshold
    i_auroc = Column(Float, nullable=True)                               # Image-AUROC score
    p_auroc = Column(Float, nullable=True)                               # Pixel-AUROC score
    is_trained = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
