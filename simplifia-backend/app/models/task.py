# app/models/task.py
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.database import Base

class Task(Base):
    """Administrative task (CAF, CEAM, etc.)"""
    __tablename__ = "tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id", ondelete="CASCADE"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))

    # Task information
    task_type = Column(String(100), nullable=False)
    organism = Column(String(100)) #ameli, caf, impôt...
    title = Column(String(500), nullable=False)
    description = Column(Text)

    # Status and priority
    status = Column(String(50), default="pending")
    priority = Column(Integer, default=5)

    # JSON data
    input_data = Column(JSONB)
    output_data = Column(JSONB)

    # Timing info
    estimated_duration_minutes = Column(Integer)
    actual_duration_seconds = Column(Integer)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="tasks")
    session = relationship("Session", back_populates="tasks")
    logs = relationship("TaskLog", back_populates="task", cascade="all, delete-orphan")