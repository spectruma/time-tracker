# backend/app/domain/models/leave_request.py
from sqlalchemy import Column, Integer, DateTime, ForeignKey, String, Text, Enum, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum as PyEnum

from app.domain.models.base import Base


class LeaveType(PyEnum):
    VACATION = "vacation"
    SICK_LEAVE = "sick_leave"
    SPECIAL_PERMIT = "special_permit"


class RequestStatus(PyEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELED = "canceled"


class LeaveRequest(Base):
    """Leave request model."""
    
    user_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    leave_type = Column(Enum(LeaveType), nullable=False)
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)
    status = Column(Enum(RequestStatus), default=RequestStatus.PENDING, nullable=False)
    reason = Column(Text, nullable=True)
    
    # Multi-level approval fields
    reviewed_by_id = Column(Integer, ForeignKey("user.id"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    approved_by_id = Column(Integer, ForeignKey("user.id"), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    rejection_reason = Column(Text, nullable=True)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="leave_requests")
    reviewed_by = relationship("User", foreign_keys=[reviewed_by_id])
    approved_by = relationship("User", foreign_keys=[approved_by_id])
    
    # Audit trail
    has_documentation = Column(Boolean, default=False, nullable=False)
    documentation_path = Column(String(500), nullable=True)
