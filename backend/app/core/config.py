import os
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "RailAlert API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Environment & Debug
    ENVIRONMENT: str = "development"
    DEBUG: bool = False

    # Security & JWT
    SECRET_KEY: str = "railalert-super-secret-production-key-change-this-in-env"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 Hours

    # Database (PostgreSQL RDS / Local)
    DATABASE_URL: str = "postgresql://railalert_user:railalert_password@localhost:5432/railalert_db"

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]

    # AWS S3 (Complaint & Lost Item Image Vault)
    AWS_REGION: str = "ap-south-1"  # Default Mumbai / AWS Free Tier friendly
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_S3_BUCKET_NAME: str = "railalert-vault-storage"
    S3_SSE_ALGORITHM: str = "AES256"  # SSE-S3 encryption

    # AWS SES (Email Notifications)
    AWS_SES_SENDER_EMAIL: str = "no-reply@railalert.internal"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
