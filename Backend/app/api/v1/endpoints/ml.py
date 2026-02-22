
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from typing import Any
import shutil
import os
import uuid
from sqlalchemy.orm import Session
from app.api import deps
from app.models.image import Image
from app.models.result import Result
from app.ml.preprocess import preprocess_image
from app.ml.inference import run_inference
from app.ml.postprocess import generate_heatmap

router = APIRouter()

# Constants
MODEL_VERSION = "v1.0"
THRESHOLD = 0.6
UPLOAD_DIR = "static/uploads"
HEATMAP_DIR = "static/heatmaps"

# Ensure directories exist
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(HEATMAP_DIR, exist_ok=True)

@router.get("/health")
def health_check() -> Any:
    """
    Check if the ML service is healthy.
    """
    return {"status": "healthy", "service": "anomaly-detection-ml"}

@router.get("/model-info")
def model_info() -> Any:
    """
    Get information about the current active model.
    """
    return {
        "model_name": "AnomalyDetector",
        "model_version": MODEL_VERSION,
        "framework": "TensorFlow/Keras",
        "description": "2D Image Anomaly Detection using Autoencoder/CNN"
    }

@router.post("/predict")
async def predict(
    file: UploadFile = File(...),
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user)
) -> Any:
    """
    Run anomaly detection on an uploaded image.
    Saves image and result to database.
    
    Returns:
        JSON object with anomaly score, threshold, status, and heatmap path.
    """
    try:
        # 1. Save uploaded file temporarily
        file_ext = file.filename.split(".")[-1]
        filename = f"{uuid.uuid4()}.{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # 2. Preprocess
        processed_img = preprocess_image(file_path)
        
        # 3. Inference
        score = run_inference(processed_img)
        
        # 4. Postprocess (Heatmap)
        heatmap_filename = f"heatmap_{filename}"
        heatmap_path_rel = os.path.join(HEATMAP_DIR, heatmap_filename)
        
        generate_heatmap(
            original_image_path=file_path,
            output_path=heatmap_path_rel,
            anomaly_score=score,
            threshold=THRESHOLD
        )
        
        # 5. Save to Database
        # Save Image
        db_image = Image(
            filename=filename,
            file_path=file_path,
            user_id=current_user.id
        )
        db.add(db_image)
        db.commit()
        db.refresh(db_image)
        
        # Save Result
        is_anomaly = score > THRESHOLD
        web_heatmap_path = f"/{heatmap_path_rel.replace(os.sep, '/')}"
        
        db_result = Result(
            image_id=db_image.id,
            anomaly_score=score,
            threshold=THRESHOLD,
            is_anomaly=is_anomaly,
            heatmap_path=web_heatmap_path,
            model_version=MODEL_VERSION,
            details={"original_filename": file.filename}
        )
        db.add(db_result)
        db.commit()
        
        # 6. Save to History
        from app.models.history import History as HistoryModel
        db_history = HistoryModel(
            user_id=current_user.id,
            filename=file.filename,
            file_path=file_path,
            status="Anomaly" if is_anomaly else "Normal",
            score=float(score),
            heatmap_path=web_heatmap_path,
            threshold=THRESHOLD,
            model_version=MODEL_VERSION
        )
        db.add(db_history)
        db.commit()
        
        return {
            "image_id": db_image.id,
            "anomaly_score": round(float(score), 4),
            "is_anomaly": bool(is_anomaly),
            "heatmap_path": web_heatmap_path,
            "original_path": f"/static/uploads/{filename}",
            "threshold": THRESHOLD,
            "model_version": MODEL_VERSION
        }
        
    except Exception as e:
        print(f"Prediction Error: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
