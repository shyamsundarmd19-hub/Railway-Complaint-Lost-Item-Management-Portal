import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, Enum, ForeignKey, Uuid
from sqlalchemy.orm import relationship
from app.core.database import Base


class ComplaintCategory(str, enum.Enum):
    CLEANLINESS = "cleanliness"
    PANTRY = "pantry"
    ELECTRICAL = "electrical"
    SECURITY = "security"
    OTHER = "other"


class ComplaintStatus(str, enum.Enum):
    REGISTERED = "registered"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    train_number = Column(String(10), nullable=False, index=True)
    coach_number = Column(String(10), nullable=False)
    seat_number = Column(String(10), nullable=False)
    category = Column(Enum(ComplaintCategory), nullable=False, index=True)
    description = Column(Text, nullable=False)
    photo_url = Column(String(500), nullable=True)  # S3 Key or Presigned URL
    priority = Column(String(20), default="Medium", nullable=False)
    status = Column(Enum(ComplaintStatus), default=ComplaintStatus.REGISTERED, nullable=False, index=True)
    assigned_staff_id = Column(Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)

    # Relationships
    passenger = relationship("User", foreign_keys=[user_id], back_populates="complaints")
    assigned_staff = relationship("User", foreign_keys=[assigned_staff_id], back_populates="assigned_complaints")
