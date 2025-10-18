# app/models/user.py
from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.database import Base

class User(Base):
    """User table linked with Firebase"""
    __tablename__ = "users"

    # Primary key: UUID for unique identification
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Firebase UID (required when auth is active)
    firebase_uid = Column(String(255), unique=True)

    # Basic information
    email = Column(String(255), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships ( ex: if i delete a user all his session and tasks will be delete)
    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="user", cascade="all, delete-orphan")