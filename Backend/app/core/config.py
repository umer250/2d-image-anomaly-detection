
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "2D Anomaly Detection API"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "secret"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173", 
        "http://localhost:3000", 
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000"
    ]

    # Database
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "password"
    POSTGRES_DB: str = "anomaly_detection_db"
    DATABASE_URL: str | None = None

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore" # Ignore extra env vars to prevent validation errors
    )

settings = Settings()
