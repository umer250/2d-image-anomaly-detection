from typing import Optional, Any
from pydantic import BaseModel
from datetime import datetime

class ResultBase(BaseModel):
    image_id: int
    anomaly_score: float
    threshold: float = 0.6
    is_anomaly: bool
    heatmap_path: Optional[str] = None
    model_version: str = "v1.0"
    details: Optional[Any] = None

class ResultCreate(ResultBase):
    pass

class ResultUpdate(ResultBase):
    pass

class Result(ResultBase):
    id: int
    created_at: datetime
    
    # Extra fields for UI convenience (populated manually or via property)
    filename: Optional[str] = None
    upload_date: Optional[datetime] = None

    class Config:
        from_attributes = True
