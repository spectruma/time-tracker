# backend/app/domain/models/audit_log.py
from sqlalchemy import Column, Integer, DateTime, String, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.domain.models.base import Base


class AuditLog(Base):
    """Immutable audit log for compliance tracking."""
    
    user_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    action = Column(String(50), nullable=False)  # create, update, delete, approve, etc.
    resource_type = Column(String(50), nullable=False)  # TimeEntry, LeaveRequest, User, etc.
    resource_id = Column(Integer, nullable=False)
    timestamp = Column(DateTime(timezone=True), nullable=False)
    previous_state = Column(JSON, nullable=True)
    new_state = Column(JSON, nullable=True)
    notes = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(String(255), nullable=True)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id])