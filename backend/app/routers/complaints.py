import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.complaint import Complaint, ComplaintCategory, ComplaintStatus
from app.models.audit_log import AuditLog
from app.schemas import ComplaintCreate, ComplaintResponse, ComplaintStatusUpdate
from app.services.notifications import notifications

router = APIRouter(prefix="/complaints", tags=["Complaints"])


@router.post("/", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
def file_complaint(
    complaint_in: ComplaintCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    File a new railway grievance.
    Accepts passenger train details, category, description, and AWS S3 photo key.
    """
    complaint = Complaint(
        user_id=current_user.id,
        train_number=complaint_in.train_number,
        coach_number=complaint_in.coach_number,
        seat_number=complaint_in.seat_number,
        category=complaint_in.category,
        description=complaint_in.description,
        photo_url=complaint_in.photo_url,
        priority=complaint_in.priority or "Medium",
        status=ComplaintStatus.REGISTERED,
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)

    # Record Audit Log
    audit = AuditLog(
        user_id=current_user.id,
        action="COMPLAINT_FILED",
        details=f"Complaint {complaint.id} filed for Train {complaint.train_number} ({complaint.category.value})",
    )
    db.add(audit)
    db.commit()

    return complaint


@router.get("/", response_model=List[ComplaintResponse])
def get_passenger_complaints(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve complaint history for the currently logged-in passenger.
    """
    complaints = (
        db.query(Complaint)
        .options(joinedload(Complaint.passenger), joinedload(Complaint.assigned_staff))
        .filter(Complaint.user_id == current_user.id)
        .order_by(Complaint.created_at.desc())
        .all()
    )
    return complaints


@router.get("/all", response_model=List[ComplaintResponse])
def list_all_complaints_staff(
    status_filter: Optional[ComplaintStatus] = Query(None, alias="status"),
    category: Optional[ComplaintCategory] = Query(None),
    priority: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = 0,
    current_user: User = Depends(require_role([UserRole.RAILWAY_STAFF, UserRole.ADMIN])),
    db: Session = Depends(get_db),
):
    """
    Staff / Admin view: List all railway grievances with multi-criteria filtering.
    """
    query = db.query(Complaint).options(
        joinedload(Complaint.passenger),
        joinedload(Complaint.assigned_staff),
    )

    if status_filter:
        query = query.filter(Complaint.status == status_filter)
    if category:
        query = query.filter(Complaint.category == category)
    if priority:
        query = query.filter(Complaint.priority.ilike(f"%{priority}%"))

    return query.order_by(Complaint.created_at.desc()).offset(offset).limit(limit).all()


@router.get("/{complaint_id}", response_model=ComplaintResponse)
def get_complaint_details(
    complaint_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve single complaint details by ID (Accessible by owner or staff).
    """
    complaint = (
        db.query(Complaint)
        .options(joinedload(Complaint.passenger), joinedload(Complaint.assigned_staff))
        .filter(Complaint.id == complaint_id)
        .first()
    )
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if current_user.role == UserRole.PASSENGER and complaint.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this complaint")

    return complaint


@router.put("/{complaint_id}/status", response_model=ComplaintResponse)
def update_complaint_status(
    complaint_id: uuid.UUID,
    update_in: ComplaintStatusUpdate,
    current_user: User = Depends(require_role([UserRole.RAILWAY_STAFF, UserRole.ADMIN])),
    db: Session = Depends(get_db),
):
    """
    Railway staff update status & assign staff.
    Triggers AWS SES notification if status is updated to 'resolved'.
    """
    complaint = (
        db.query(Complaint)
        .options(joinedload(Complaint.passenger), joinedload(Complaint.assigned_staff))
        .filter(Complaint.id == complaint_id)
        .first()
    )
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    previous_status = complaint.status
    complaint.status = update_in.status

    if update_in.assigned_staff_id is not None:
        staff_user = db.query(User).filter(User.id == update_in.assigned_staff_id).first()
        if not staff_user or staff_user.role not in [UserRole.RAILWAY_STAFF, UserRole.ADMIN]:
            raise HTTPException(status_code=400, detail="Assigned staff user not found or invalid role")
        complaint.assigned_staff_id = update_in.assigned_staff_id
    elif not complaint.assigned_staff_id:
        # Auto-assign the updating staff member if none currently assigned
        complaint.assigned_staff_id = current_user.id

    db.commit()
    db.refresh(complaint)

    # Record Audit Log
    audit = AuditLog(
        user_id=current_user.id,
        action="COMPLAINT_STATUS_UPDATED",
        details=f"Complaint {complaint.id} changed from {previous_status.value} to {complaint.status.value}",
    )
    db.add(audit)
    db.commit()

    # Trigger AWS SES Notification on RESOLVED
    if update_in.status == ComplaintStatus.RESOLVED and complaint.passenger:
        notifications.send_complaint_resolved_alert(
            passenger_email=complaint.passenger.email,
            passenger_name=complaint.passenger.name,
            complaint_id=str(complaint.id),
            description=complaint.description,
            train_number=complaint.train_number,
            coach=complaint.coach_number,
            seat=complaint.seat_number,
        )

    return complaint
