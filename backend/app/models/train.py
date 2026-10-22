from sqlalchemy import Column, Integer, String
from app.core.database import Base


class Train(Base):
    __tablename__ = "trains"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    train_number = Column(String(10), unique=True, index=True, nullable=False)
    train_name = Column(String(150), nullable=False)
    source = Column(String(100), nullable=False)
    destination = Column(String(100), nullable=False)
