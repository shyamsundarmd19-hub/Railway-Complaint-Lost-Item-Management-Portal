from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import Base, engine
import app.models  # Ensures all models are registered with Base.metadata
from app.routers import (
    auth_router,
    trains_router,
    complaints_router,
    lost_items_router,
    documents_router,
    admin_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-create tables in development / bootstrap
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="RailAlert - Cloud-Based Railway Grievance & Lost Item Portal API",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routers (under /api/v1)
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(trains_router, prefix=settings.API_V1_STR)
app.include_router(complaints_router, prefix=settings.API_V1_STR)
app.include_router(lost_items_router, prefix=settings.API_V1_STR)
app.include_router(documents_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["Monitoring"])
def health_check():
    """EC2 & ALB Health check endpoint."""
    return {
        "status": "healthy",
        "service": "RailAlert Backend",
        "environment": settings.ENVIRONMENT,
        "version": settings.VERSION,
    }


@app.get("/", tags=["Monitoring"])
def root():
    return {
        "message": "Welcome to RailAlert Railway Complaint & Lost Property Portal API",
        "documentation": "/docs",
        "health": "/health",
    }
