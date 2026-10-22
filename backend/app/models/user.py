import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Enum, Uuid
from sqlalchemy.orm import relationship
from app.core.database import Base


class UserRole(str, enum.Enum):
    PASSENGER = "passenger"
    RAILWAY_STAFF = "railway_staff"
    ADMIN = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    name = Column(String(120), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    phone = Column(String(20), nullable=True)
    role = Column(Enum(UserRole), default=UserRole.PASSENGER, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    complaints = relationship("Complaint", foreign_keys="[Complaint.user_id]", back_populates="passenger")
    assigned_complaints = relationship("Complaint", foreign_keys="[Complaint.assigned_staff_id]", back_populates="assigned_staff")
    lost_items = relationship("LostItem", back_populates="passenger")
    audit_logs = relationship("AuditLog", back_populates="user")
