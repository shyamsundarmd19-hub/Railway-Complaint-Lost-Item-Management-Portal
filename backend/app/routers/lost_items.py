import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.lost_item import LostItem, LostItemStatus
from app.models.audit_log import AuditLog
from app.schemas import LostItemCreate, LostItemResponse, LostItemStatusUpdate

router = APIRouter(prefix="/lost-items", tags=["Lost & Found"])


@router.post("/", response_model=LostItemResponse, status_code=status.HTTP_201_CREATED)
def report_lost_item(
    item_in: LostItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Passenger or Staff reports a lost or misplaced personal property item.
    """
    lost_item = LostItem(
        user_id=current_user.id,
        train_number=item_in.train_number,
        coach_number=item_in.coach_number,
        seat_number=item_in.seat_number,
        item_name=item_in.item_name,
        description=item_in.description,
        photo_url=item_in.photo_url,
        status=LostItemStatus.REPORTED,
    )
    db.add(lost_item)
    db.commit()
    db.refresh(lost_item)

    # Record Audit Log
    audit = AuditLog(
        user_id=current_user.id,
        action="LOST_ITEM_REPORTED",
        details=f"Lost item '{lost_item.item_name}' reported on Train {lost_item.train_number}",
    )
    db.add(audit)
    db.commit()

    return lost_item


@router.get("/", response_model=List[LostItemResponse])
def get_passenger_lost_items(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Passenger view: List all lost items reported by the logged-in user.
    """
    return (
        db.query(LostItem)
        .options(joinedload(LostItem.passenger))
        .filter(LostItem.user_id == current_user.id)
        .order_by(LostItem.created_at.desc())
        .all()
    )


@router.get("/all", response_model=List[LostItemResponse])
def list_all_lost_items_staff(
    status_filter: Optional[LostItemStatus] = Query(None, alias="status"),
    train_number: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = 0,
    current_user: User = Depends(require_role([UserRole.RAILWAY_STAFF, UserRole.ADMIN])),
    db: Session = Depends(get_db),
):
    """
    Staff / Admin view: List all lost and found property across railway coaches & stations.
    """
    query = db.query(LostItem).options(joinedload(LostItem.passenger))

    if status_filter:
        query = query.filter(LostItem.status == status_filter)
    if train_number:
        query = query.filter(LostItem.train_number == train_number)
    if search:
        query = query.filter(
            (LostItem.item_name.ilike(f"%{search}%")) | (LostItem.description.ilike(f"%{search}%"))
        )

    return query.order_by(LostItem.created_at.desc()).offset(offset).limit(limit).all()


@router.put("/{item_id}/status", response_model=LostItemResponse)
def update_lost_item_status(
    item_id: uuid.UUID,
    update_in: LostItemStatusUpdate,
    current_user: User = Depends(require_role([UserRole.RAILWAY_STAFF, UserRole.ADMIN])),
    db: Session = Depends(get_db),
):
    """
    Railway staff update lost property custody status (reported -> found -> handed_over).
    """
    lost_item = (
        db.query(LostItem)
        .options(joinedload(LostItem.passenger))
        .filter(LostItem.id == item_id)
        .first()
    )
    if not lost_item:
        raise HTTPException(status_code=404, detail="Lost item record not found")

    prev_status = lost_item.status
    lost_item.status = update_in.status
    db.commit()
    db.refresh(lost_item)

    # Record Audit Log
    audit = AuditLog(
        user_id=current_user.id,
        action="LOST_ITEM_STATUS_UPDATED",
        details=f"Item {lost_item.id} status changed from {prev_status.value} to {lost_item.status.value}",
    )
    db.add(audit)
    db.commit()

    return lost_item
