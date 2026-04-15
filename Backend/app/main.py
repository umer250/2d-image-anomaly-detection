
import re
import os
from fastapi import FastAPI
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.api import api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Matches any http/https localhost or 127.0.0.1 on any port
_LOCALHOST_RE = re.compile(r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$")

_explicit_origins = list(
    dict.fromkeys(
        [
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5175",
            "http://localhost:3000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174",
            "http://127.0.0.1:5175",
            "http://127.0.0.1:3000",
        ]
        + [str(o) for o in settings.BACKEND_CORS_ORIGINS]
    )
)

class DynamicCORSMiddleware(BaseHTTPMiddleware):
    """Allow any localhost/127.0.0.1 origin on any port (dev convenience)."""

    async def dispatch(self, request: Request, call_next):
        origin = request.headers.get("origin", "")
        allowed = origin in _explicit_origins or bool(_LOCALHOST_RE.match(origin))

        # Handle preflight
        if request.method == "OPTIONS" and allowed:
            response = Response(status_code=204)
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "*"
            response.headers["Access-Control-Allow-Headers"] = "*"
            response.headers["Vary"] = "Origin"
            return response

        response = await call_next(request)

        if allowed:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Vary"] = "Origin"

        return response

app.add_middleware(DynamicCORSMiddleware)

# Keep CORSMiddleware as fallback for the explicit list
app.add_middleware(
    CORSMiddleware,
    allow_origins=_explicit_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.staticfiles import StaticFiles

app.include_router(api_router, prefix=settings.API_V1_STR)

# Mount static files
if not os.path.exists("static"):
    os.makedirs("static")
if not os.path.exists("uploads"):
    os.makedirs("uploads")
if not os.path.exists("heatmaps"):
    os.makedirs("heatmaps")

app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.mount("/heatmaps", StaticFiles(directory="heatmaps"), name="heatmaps")


@app.get("/")
def root():
    return {"message": "Welcome to 2D Anomaly Detection API", "docs": "/docs"}


@app.get("/health")
def health_check():
    return {"status": "ok", "version": "1.0.0"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
