import uuid
from typing import Dict
import boto3
from botocore.exceptions import ClientError
from fastapi import UploadFile, HTTPException
from app.core.config import settings


class S3VaultService:
    def __init__(self):
        # Initializing boto3 client
        client_kwargs = {
            "region_name": settings.AWS_REGION,
        }
        if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
            client_kwargs["aws_access_key_id"] = settings.AWS_ACCESS_KEY_ID
            client_kwargs["aws_secret_access_key"] = settings.AWS_SECRET_ACCESS_KEY

        self.s3_client = boto3.client("s3", **client_kwargs)
        self.bucket_name = settings.AWS_S3_BUCKET_NAME

    def generate_presigned_upload_url(
        self,
        filename: str,
        file_type: str = "image/jpeg",
        folder: str = "complaints",
        expires_in: int = 3600,
    ) -> Dict[str, str]:
        """
        Generates an AWS S3 Presigned URL for secure, direct-from-browser uploads.
        Bypasses server memory overhead (critical for AWS Free Tier EC2 t2.micro).
        """
        file_ext = filename.split(".")[-1] if "." in filename else "jpg"
        file_key = f"{folder}/{uuid.uuid4().hex}.{file_ext}"
        final_url = f"https://{self.bucket_name}.s3.{settings.AWS_REGION}.amazonaws.com/{file_key}"

        # Dev Fallback if AWS credentials not set
        if not settings.AWS_ACCESS_KEY_ID and settings.ENVIRONMENT == "development":
            return {
                "upload_url": f"https://mock-s3-upload-vault.internal/{file_key}",
                "file_key": file_key,
                "final_url": final_url,
            }

        try:
            params = {
                "Bucket": self.bucket_name,
                "Key": file_key,
                "ContentType": file_type,
                "ServerSideEncryption": settings.S3_SSE_ALGORITHM,
            }
            presigned_url = self.s3_client.generate_presigned_url(
                ClientMethod="put_object",
                Params=params,
                ExpiresIn=expires_in,
            )
            return {
                "upload_url": presigned_url,
                "file_key": file_key,
                "final_url": final_url,
            }
        except ClientError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to generate AWS S3 presigned upload URL: {str(e)}",
            )

    async def upload_file(self, file: UploadFile, folder: str = "complaints") -> str:
        """
        Direct stream upload to AWS S3 Image Vault with SSE-S3 encryption.
        """
        if not file:
            return ""

        file_extension = file.filename.split(".")[-1] if "." in file.filename else "jpg"
        unique_filename = f"{folder}/{uuid.uuid4().hex}.{file_extension}"

        if not settings.AWS_ACCESS_KEY_ID and settings.ENVIRONMENT == "development":
            return f"https://{self.bucket_name}.s3.{settings.AWS_REGION}.amazonaws.com/{unique_filename}"

        try:
            content = await file.read()
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=unique_filename,
                Body=content,
                ContentType=file.content_type or "application/octet-stream",
                ServerSideEncryption=settings.S3_SSE_ALGORITHM,
            )
            await file.seek(0)
            return f"https://{self.bucket_name}.s3.{settings.AWS_REGION}.amazonaws.com/{unique_filename}"
        except ClientError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to securely upload image to S3 Vault: {str(e)}",
            )


s3_vault = S3VaultService()
