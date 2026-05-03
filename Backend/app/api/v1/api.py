from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, admin, images, results, ml, history

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(images.router, prefix="/images", tags=["images"])
api_router.include_router(results.router, prefix="/results", tags=["results"])
api_router.include_router(ml.router, prefix="/ml", tags=["ml"])
api_router.include_router(history.router, prefix="/history", tags=["history"])
