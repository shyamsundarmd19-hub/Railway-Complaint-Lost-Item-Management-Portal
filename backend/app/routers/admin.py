from typing import Dict, List
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import require_role
from app.models.user import User, UserRole
from app.models.complaint import Complaint, ComplaintCategory, ComplaintStatus
from app.models.lost_item import LostItem, LostItemStatus
from app.models.audit_log import AuditLog
from app.schemas import AnalyticsResponse, AuditLogResponse

router = APIRouter(prefix="/admin", tags=["Admin & Analytics"])


@router.get("/analytics", response_model=AnalyticsResponse)
def get_analytics_metrics(
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.RAILWAY_STAFF])),
    db: Session = Depends(get_db),
):
    """
    Dashboard analytics metrics:
    - Total complaints & status distribution
    - Resolution percentage
    - Grievance breakdown by category
    - Lost & found recovery metrics
    """
    total_complaints = db.query(Complaint).count()
    resolved_complaints = db.query(Complaint).filter(Complaint.status == ComplaintStatus.RESOLVED).count()
    in_progress_complaints = db.query(Complaint).filter(Complaint.status == ComplaintStatus.IN_PROGRESS).count()
    registered_complaints = db.query(Complaint).filter(Complaint.status == ComplaintStatus.REGISTERED).count()

    resolution_pct = 0.0
    if total_complaints > 0:
        resolution_pct = round((resolved_complaints / total_complaints) * 100.0, 1)

    # Category Breakdown
    cat_counts = (
        db.query(Complaint.category, func.count(Complaint.id))
        .group_by(Complaint.category)
        .all()
    )
    category_breakdown: Dict[str, int] = {cat.value: 0 for cat in ComplaintCategory}
    for cat, count in cat_counts:
        cat_key = cat.value if hasattr(cat, "value") else str(cat)
        category_breakdown[cat_key] = count

    # Lost & Found Stats
    total_lost = db.query(LostItem).count()
    handed_over = db.query(LostItem).filter(LostItem.status == LostItemStatus.HANDED_OVER).count()

    # Total Users
    total_users = db.query(User).count()

    return AnalyticsResponse(
        total_complaints=total_complaints,
        resolved_complaints=resolved_complaints,
        in_progress_complaints=in_progress_complaints,
        registered_complaints=registered_complaints,
        resolution_percentage=resolution_pct,
        category_breakdown=category_breakdown,
        total_lost_items=total_lost,
        lost_items_handed_over=handed_over,
        total_users=total_users,
    )


@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_trail(
    limit: int = 50,
    current_user: User = Depends(require_role([UserRole.ADMIN])),
    db: Session = Depends(get_db),
):
    """
    Administrator view: Retrieve recent system audit actions and security logs.
    """
    return db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()
