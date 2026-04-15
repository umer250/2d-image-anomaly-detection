from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base


class History(Base):
    __tablename__ = "history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    filename = Column(String, index=True)
    file_path = Column(String)
    status = Column(String)               # 'Normal' or 'Anomaly'
    score = Column(Float)
    heatmap_path = Column(String, nullable=True)
    threshold = Column(Float, nullable=True)
    model_version = Column(String, nullable=True)
    category = Column(String(50), nullable=True, default="unknown")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", backref="history_records")
