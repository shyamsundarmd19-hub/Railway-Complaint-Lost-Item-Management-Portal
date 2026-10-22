import uuid
from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel, EmailStr, Field
from app.models import (
    ComplaintCategory,
    ComplaintStatus,
    LostItemStatus,
    UserRole,
)


# ==========================================
# 1. User & Authentication Schemas
# ==========================================
class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=20)


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="Plaintext password (min 6 characters)")
    role: Optional[UserRole] = Field(default=UserRole.PASSENGER)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(UserBase):
    id: uuid.UUID
    role: UserRole
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ==========================================
# 2. Train Schemas
# ==========================================
class TrainBase(BaseModel):
    train_number: str = Field(..., min_length=4, max_length=10)
    train_name: str = Field(..., min_length=2, max_length=150)
    source: str = Field(..., min_length=2, max_length=100)
    destination: str = Field(..., min_length=2, max_length=100)


class TrainCreate(TrainBase):
    pass


class TrainResponse(TrainBase):
    id: int

    model_config = {"from_attributes": True}


# ==========================================
# 3. Complaint Schemas
# ==========================================
class ComplaintCreate(BaseModel):
    train_number: str = Field(..., min_length=4, max_length=10)
    coach_number: str = Field(..., min_length=1, max_length=10)
    seat_number: str = Field(..., min_length=1, max_length=10)
    category: ComplaintCategory
    description: str = Field(..., min_length=5)
    photo_url: Optional[str] = Field(None, description="S3 Key or Presigned S3 file URL")
    priority: Optional[str] = Field(default="Medium")


class ComplaintStatusUpdate(BaseModel):
    status: ComplaintStatus
    assigned_staff_id: Optional[uuid.UUID] = None


class ComplaintResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    train_number: str
    coach_number: str
    seat_number: str
    category: ComplaintCategory
    description: str
    photo_url: Optional[str] = None
    priority: str
    status: ComplaintStatus
    assigned_staff_id: Optional[uuid.UUID] = None
    created_at: datetime
    passenger: Optional[UserResponse] = None
    assigned_staff: Optional[UserResponse] = None

    model_config = {"from_attributes": True}


# ==========================================
# 4. Lost Item Schemas
# ==========================================
class LostItemCreate(BaseModel):
    train_number: str = Field(..., min_length=4, max_length=10)
    coach_number: Optional[str] = Field(None, max_length=10)
    seat_number: Optional[str] = Field(None, max_length=10)
    item_name: str = Field(..., min_length=2, max_length=150)
    description: str = Field(..., min_length=5)
    photo_url: Optional[str] = Field(None, description="S3 Key or Presigned S3 file URL")


class LostItemStatusUpdate(BaseModel):
    status: LostItemStatus


class LostItemResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    train_number: str
    coach_number: Optional[str] = None
    seat_number: Optional[str] = None
    item_name: str
    description: str
    photo_url: Optional[str] = None
    status: LostItemStatus
    created_at: datetime
    passenger: Optional[UserResponse] = None

    model_config = {"from_attributes": True}


# ==========================================
# 5. Presigned URL Schemas (S3 Image Vault)
# ==========================================
class PresignedUrlRequest(BaseModel):
    filename: str = Field(..., min_length=3)
    file_type: str = Field(default="image/jpeg", description="MIME type e.g. image/jpeg, image/png")
    folder: str = Field(default="complaints", description="'complaints' or 'lost-items'")


class PresignedUrlResponse(BaseModel):
    upload_url: str
    file_key: str
    final_url: str


# ==========================================
# 6. Admin Analytics Schemas
# ==========================================
class AnalyticsResponse(BaseModel):
    total_complaints: int
    resolved_complaints: int
    in_progress_complaints: int
    registered_complaints: int
    resolution_percentage: float
    category_breakdown: Dict[str, int]
    total_lost_items: int
    lost_items_handed_over: int
    total_users: int


# ==========================================
# 7. Audit Log Schemas
# ==========================================
class AuditLogResponse(BaseModel):
    id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    action: str
    details: Optional[str] = None
    timestamp: datetime

    model_config = {"from_attributes": True}
