
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class Result(Base):
    __tablename__ = "results"

    id = Column(Integer, primary_key=True, index=True)
    image_id = Column(Integer, ForeignKey("images.id"))
    detection_score = Column(Float)
    is_anomaly = Column(Integer) # 0 or 1
    details = Column(JSON, nullable=True) # Store bounding boxes, etc.
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    image = relationship("Image", backref="results")
