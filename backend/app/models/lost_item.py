import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, Enum, ForeignKey, Uuid
from sqlalchemy.orm import relationship
from app.core.database import Base


class LostItemStatus(str, enum.Enum):
    REPORTED = "reported"
    FOUND = "found"
    HANDED_OVER = "handed_over"


class LostItem(Base):
    __tablename__ = "lost_items"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    train_number = Column(String(10), nullable=False, index=True)
    coach_number = Column(String(10), nullable=True)
    seat_number = Column(String(10), nullable=True)
    item_name = Column(String(150), nullable=False, index=True)
    description = Column(Text, nullable=False)
    photo_url = Column(String(500), nullable=True)  # S3 Key or Presigned URL
    status = Column(Enum(LostItemStatus), default=LostItemStatus.REPORTED, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)

    # Relationships
    passenger = relationship("User", back_populates="lost_items")
