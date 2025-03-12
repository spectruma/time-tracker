# backend/app/domain/models/time_entry.py
from sqlalchemy import Column, Integer, DateTime, ForeignKey, Boolean, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.domain.models.base import Base


class TimeEntry(Base):
    """Time tracking entry model."""
    
    user_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True))
    description = Column(Text)
    is_manual_entry = Column(Boolean, default=False, nullable=False)
    is_approved = Column(Boolean, default=False, nullable=False)
    approved_by_id = Column(Integer, ForeignKey("user.id"), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="time_entries")
    approved_by = relationship("User", foreign_keys=[approved_by_id])
    
    # Audit log fields
    audit_note = Column(Text, nullable=True)
    audit_change_type = Column(String(50), 