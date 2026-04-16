from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from typing import Any, List
import shutil
import os
import uuid
import numpy as np
import torch
import torch.nn.functional as F
from sqlalchemy.orm import Session
from app.api import deps
from app.models.image import Image
from app.models.result import Result
from app.models.history import History as HistoryModel
from app.ml.preprocess import VALID_CATEGORIES
from app.ml.inference import run_inference, _get_backbone, _get_memory_bank, _features
from app.ml.postprocess import generate_heatmap
from app.ml.model_loader import model_loader

router = APIRouter()

# Constants
MODEL_VERSION = "PatchCore-WideResNet50-v1"
UPLOAD_DIR = "static/uploads"
HEATMAP_DIR = "static/heatmaps"

# Ensure directories exist
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(HEATMAP_DIR, exist_ok=True)


@router.get("/health")
def health_check() -> Any:
    """Check if the ML service is healthy."""
    return {"status": "healthy", "service": "anomaly-detection-ml"}


@router.get("/model-info")
def model_info() -> Any:
    """Get information about the current active model."""
    return {
        "model_name": "PatchCore",
        "model_version": MODEL_VERSION,
        "framework": "PyTorch",
        "description": "2D Image Anomaly Detection using K-NN PatchCore features",
        "valid_categories": VALID_CATEGORIES,
    }


@router.get("/model-status")
def model_status() -> Any:
    """
    Returns which categories have trained models.
    No authentication required.
    """
    available = model_loader.get_available_categories()
    all_categories = VALID_CATEGORIES

    return {
        "available_models": available,
        "total_trained": len(available),
        "total_categories": len(all_categories),
        "all_categories": all_categories,
    }


@router.post("/predict")
async def predict(
    file: UploadFile = File(...),
    category: str = Form(default="bottle"),
    remove_bg: bool = Form(default=False),
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user),
) -> Any:
    """
    Run PatchCore anomaly detection on an uploaded image.

    Returns:
        image_id, anomaly_score (0-1), is_anomaly, heatmap_path,
        original_path, threshold, category, model_version
    """
    if category not in VALID_CATEGORIES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid category '{category}'. Valid options: {VALID_CATEGORIES}",
        )

    try:
        # 1. Save uploaded file
        file_ext = (
            file.filename.rsplit(".", 1)[-1].lower()
            if file.filename and "." in file.filename
            else "jpg"
        )
        filename = f"{uuid.uuid4()}.{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 2 + 3. Inference (preprocessing is done inside run_inference to avoid double pass)
        try:
            result = run_inference(file_path, category=category, remove_bg=remove_bg)
        except FileNotFoundError as exc:
            available = model_loader.get_available_categories()
            raise HTTPException(
                status_code=503,
                detail=(
                    f"Model not yet trained for category: '{category}'. "
                    f"Available trained categories: {available}"
                ),
            ) from exc

        score        = result["anomaly_score"]
        anomaly_map  = result["anomaly_map"]
        is_anomaly   = result["is_anomaly"]
        threshold    = result["threshold"]
        image_quality = result.get("image_quality", {})

        # Return early with a clear message if image is too blurry
        if image_quality.get("is_blurry", False):
            # Only warn — never block inference for blur
            # The model will still run; frontend can show the warning alongside results
            print(f"[predict] Image quality warning: {image_quality.get('message')}")

        # 4. Generate heatmap
        heatmap_filename = f"heatmap_{filename.rsplit('.', 1)[0]}.png"
        heatmap_path_rel = os.path.join(HEATMAP_DIR, heatmap_filename)

        generated_paths = generate_heatmap(
            original_image_path=file_path,
            output_path=heatmap_path_rel,
            anomaly_map=anomaly_map,
            anomaly_score=score,
            threshold=threshold,
            category=category,
        )

        # 5. Persist Image record
        db_image = Image(
            filename=filename,
            file_path=file_path,
            user_id=current_user.id,
        )
        db.add(db_image)
        db.commit()
        db.refresh(db_image)

        # 6. Persist Result record
        web_heatmap_path = f"/{generated_paths['overlay'].replace(os.sep, '/')}"
        web_hot_map_path = f"/{generated_paths['hot'].replace(os.sep, '/')}"
        web_contour_path = f"/{generated_paths['contour'].replace(os.sep, '/')}"
        web_comparison_path = f"/{generated_paths.get('comparison', generated_paths['overlay']).replace(os.sep, '/')}"

        db_result = Result(
            image_id=db_image.id,
            anomaly_score=score,
            threshold=threshold,
            is_anomaly=is_anomaly,
            heatmap_path=web_heatmap_path,
            model_version=MODEL_VERSION,
            details={
                "original_filename": file.filename,
                "category": category,
                "inference_time_ms": result.get("inference_time_ms"),
            },
        )
        db.add(db_result)
        db.commit()

        # 7. Persist History record (includes category column)
        db_history = HistoryModel(
            user_id=current_user.id,
            filename=file.filename,
            file_path=file_path,
            status="Anomaly" if is_anomaly else "Normal",
            score=float(score),
            heatmap_path=web_heatmap_path,
            hot_map_path=web_hot_map_path,
            contour_path=web_contour_path,
            comparison_path=web_comparison_path,
            threshold=threshold,
            model_version=MODEL_VERSION,
            category=category,
        )
        db.add(db_history)
        db.commit()

        return {
            "image_id":        db_image.id,
            "anomaly_score":   round(float(score), 4),
            "is_anomaly":      bool(is_anomaly),
            "heatmap_path":    web_heatmap_path,
            "hot_map_path":    web_hot_map_path,
            "contour_path":    web_contour_path,
            "comparison_path": web_comparison_path,
            "original_path":   f"/static/uploads/{filename}",
            "threshold":       threshold,
            "category":        category,
            "model_version":   MODEL_VERSION,
            "image_quality":   image_quality,
        }

    except HTTPException:
        raise
    except Exception as exc:
        import traceback
        print(f"[predict] Unhandled error: {exc}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}") from exc


@router.post("/calibrate")
async def calibrate_threshold(
    category: str = Form(default="bottle"),
    percentile: float = Form(default=95.0),
    files: List[UploadFile] = File(default=[]),
    current_user=Depends(deps.get_current_user),
) -> Any:
    """
    Recalculate the anomaly threshold from a set of NORMAL reference images.

    Upload a batch of known-normal images; the endpoint scores each one and
    sets the threshold to the `percentile`-th score (default 95th percentile).
    This means 95% of normal images will score below the threshold.

    If no files are uploaded, the threshold is recalculated from the memory
    bank's own internal score distribution (nearest-neighbour self-distances),
    which is a reasonable proxy when you don't have labelled normal images.

    Args:
        category:   MVTec category name (must have a trained model).
        percentile: Percentile of normal scores to use as threshold (0-100).
        files:      Optional list of known-normal images.

    Returns:
        new_threshold, category, method, num_samples
    """
    if category not in VALID_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Invalid category: {category}")

    if not model_loader.is_model_available(category):
        raise HTTPException(status_code=503, detail=f"No trained model for category: {category}")

    if not (0 < percentile <= 100):
        raise HTTPException(status_code=400, detail="percentile must be between 0 and 100")

    tmp_dir = os.path.join(UPLOAD_DIR, "calibrate_tmp")
    os.makedirs(tmp_dir, exist_ok=True)

    try:
        scores: List[float] = []

        if files:
            # Score each uploaded normal image
            for upload in files:
                ext = (upload.filename.rsplit(".", 1)[-1].lower()
                       if upload.filename and "." in upload.filename else "jpg")
                tmp_path = os.path.join(tmp_dir, f"{uuid.uuid4()}.{ext}")
                with open(tmp_path, "wb") as buf:
                    shutil.copyfileobj(upload.file, buf)
                try:
                    result = run_inference(tmp_path, category=category)
                    scores.append(result["anomaly_score"])
                finally:
                    try:
                        os.remove(tmp_path)
                    except OSError:
                        pass

            method = "uploaded_normal_images"
        else:
            # Fallback: use memory bank self-distances as a proxy for normal scores
            bb = _get_backbone()
            device = bb.device
            model_data = model_loader.get_model(category)
            memory_bank = torch.tensor(
                model_data["memory_bank"], dtype=torch.float32, device=device
            )
            # Sample up to 2000 patches to keep it fast
            n = memory_bank.shape[0]
            idx = torch.randperm(n, device=device)[:min(n, 2000)]
            sample = memory_bank[idx]
            # Each patch's nearest neighbour distance (excluding itself)
            dists = torch.cdist(sample, memory_bank, p=2.0)
            # Zero out self-distance by setting diagonal to large value
            dists[torch.arange(len(idx)), idx[:len(idx)]] = 1e9
            min_dists, _ = dists.min(dim=1)
            raw_scores = min_dists.cpu().numpy()
            scores = [float(r / (r + 1)) for r in raw_scores]
            method = "memory_bank_self_distances"

        if not scores:
            raise HTTPException(status_code=400, detail="No scores could be computed.")

        new_threshold = float(np.percentile(scores, percentile))
        new_threshold = round(new_threshold, 6)

        # Persist the new threshold
        model_loader.update_threshold(category, new_threshold)

        return {
            "category": category,
            "new_threshold": new_threshold,
            "percentile_used": percentile,
            "num_samples": len(scores),
            "score_min": round(float(min(scores)), 6),
            "score_max": round(float(max(scores)), 6),
            "score_mean": round(float(np.mean(scores)), 6),
            "method": method,
        }

    except HTTPException:
        raise
    except Exception as exc:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Calibration failed: {exc}") from exc
