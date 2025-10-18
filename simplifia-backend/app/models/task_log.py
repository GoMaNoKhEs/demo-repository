# app/models/task_log.py
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.database import Base

class TaskLog(Base):
    """Detailed logs of each task step"""
    __tablename__ = "task_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_id = Column(UUID(as_uuid=True), ForeignKey("tasks.id", ondelete="CASCADE"))

    # Log details
    action = Column(String(100), nullable=False)
    status = Column(String(50))
    message = Column(Text)
    details = Column(JSONB)
    screenshot_url = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    task = relationship("Task", back_populates="logs")