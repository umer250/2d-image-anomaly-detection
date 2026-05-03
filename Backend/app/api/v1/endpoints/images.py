from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.schemas.user import User
from app.schemas.image import ImageCreate
from app.schemas.result import ResultCreate
from app.crud import crud_image, crud_result
from app.ml import preprocess, inference, postprocess
import shutil
import os
from uuid import uuid4

router = APIRouter()

@router.post("/upload")
def upload_image(
    file: UploadFile = File(...),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    UPLOAD_DIR = "uploads"
    HEATMAP_DIR = "heatmaps"
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    os.makedirs(HEATMAP_DIR, exist_ok=True)
    
    file_ext = os.path.splitext(file.filename)[1]
    unique_id = str(uuid4())
    unique_filename = f"{unique_id}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save file: {str(e)}")
    
    image_in = ImageCreate(
        filename=unique_filename,
        file_path=file_path,
        user_id=current_user.id
    )
    db_image = crud_image.create_image(db, image=image_in)
    
    try:
        processed_img = preprocess.preprocess_image(file_path)
        
        anomaly_score = inference.run_inference(processed_img)
        
        heatmap_filename = f"heatmap_{unique_id}.png"
        heatmap_path = os.path.join(HEATMAP_DIR, heatmap_filename)
        threshold = 0.6
        postprocess.generate_heatmap(file_path, heatmap_path, anomaly_score, threshold)
        
        result_in = ResultCreate(
            image_id=db_image.id,
            anomaly_score=anomaly_score,
            threshold=threshold,
            is_anomaly=anomaly_score > threshold,
            heatmap_path=heatmap_path,
            model_version="v1.0-mock",
            details={"original_filename": file.filename}
        )
        db_result = crud_result.create_result(db, result=result_in)
        
        return {
            "id": db_image.id,
            "filename": unique_filename,
            "anomaly_score": anomaly_score,
            "is_anomaly": db_result.is_anomaly,
            "heatmap_path": heatmap_path,
            "result_id": db_result.id
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ML Processing failed: {str(e)}")
