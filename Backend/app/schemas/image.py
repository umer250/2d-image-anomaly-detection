from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class ImageBase(BaseModel):
    filename: str
    file_path: str
    user_id: int

class ImageCreate(ImageBase):
    pass

class ImageUpdate(ImageBase):
    pass

class Image(ImageBase):
    id: int
    upload_date: datetime

    class Config:
        from_attributes = True
