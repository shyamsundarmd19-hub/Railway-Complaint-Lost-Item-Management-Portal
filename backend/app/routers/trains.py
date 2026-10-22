from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.train import Train
from app.schemas import TrainCreate, TrainResponse

router = APIRouter(prefix="/trains", tags=["Trains"])

# Initial Indian Railway Trains for auto-seeding
DEFAULT_TRAINS = [
    {"train_number": "12002", "train_name": "Bhopal Shatabdi Express", "source": "New Delhi (NDLS)", "destination": "Rani Kamlapati (RKMP)"},
    {"train_number": "12301", "train_name": "Howrah Rajdhani Express", "source": "Howrah (HWH)", "destination": "New Delhi (NDLS)"},
    {"train_number": "22436", "train_name": "Vande Bharat Express", "source": "New Delhi (NDLS)", "destination": "Varanasi Jn (BSB)"},
    {"train_number": "12951", "train_name": "Mumbai Tejas Rajdhani", "source": "Mumbai Central (MMCT)", "destination": "New Delhi (NDLS)"},
    {"train_number": "12626", "train_name": "Kerala Express", "source": "New Delhi (NDLS)", "destination": "Thiruvananthapuram (TVC)"},
    {"train_number": "12138", "train_name": "Punjab Mail", "source": "Firozpur Cantt (FZR)", "destination": "Mumbai CSMT (CSMT)"},
]


@router.get("/", response_model=List[TrainResponse])
def list_trains(
    search: Optional[str] = Query(None, description="Search by train number, name, source, or destination"),
    db: Session = Depends(get_db),
):
    """
    List all registered railway routes. Automatically populates sample express trains if empty.
    """
    count = db.query(Train).count()
    if count == 0:
        for t in DEFAULT_TRAINS:
            db.add(Train(**t))
        db.commit()

    query = db.query(Train)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Train.train_number.ilike(search_pattern))
            | (Train.train_name.ilike(search_pattern))
            | (Train.source.ilike(search_pattern))
            | (Train.destination.ilike(search_pattern))
        )
    return query.order_by(Train.train_number.asc()).all()


@router.post("/", response_model=TrainResponse, status_code=status.HTTP_201_CREATED)
def create_train(train_in: TrainCreate, db: Session = Depends(get_db)):
    """Add a new train route."""
    train = Train(**train_in.model_dump())
    db.add(train)
    db.commit()
    db.refresh(train)
    return train
