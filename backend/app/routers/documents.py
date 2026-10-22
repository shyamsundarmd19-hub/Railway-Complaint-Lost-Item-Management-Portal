from fastapi import APIRouter, Depends, status
from app.core.security import get_current_user
from app.models.user import User
from app.schemas import PresignedUrlRequest, PresignedUrlResponse
from app.services.s3_service import s3_vault

router = APIRouter(prefix="/documents", tags=["Documents & S3 Vault"])


@router.post("/upload-url", response_model=PresignedUrlResponse, status_code=status.HTTP_200_OK)
def get_s3_presigned_upload_url(
    payload: PresignedUrlRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Generate an AWS S3 Presigned Upload URL with Server-Side Encryption (SSE-S3).
    Enables client-side direct upload from browser to S3 without passing 
    heavy binary data through the Free Tier EC2 instance.
    """
    result = s3_vault.generate_presigned_upload_url(
        filename=payload.filename,
        file_type=payload.file_type,
        folder=payload.folder,
    )
    return PresignedUrlResponse(**result)
