# backend/app/domain/models/user.py
from sqlalchemy import Boolean, Column, String, Enum, Text
from sqlalchemy.orm import relationship
from enum import Enum as PyEnum

from app.domain.models.base import Base


class UserRole(PyEnum):
    NORMAL = "normal"
    ADMIN = "admin"


class User(Base):
    """User model."""
    
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    role = Column(Enum(UserRole), default=UserRole.NORMAL, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # One-to-many relationships
    time_entries = relationship("TimeEntry", back_populates="user", uselist=True)
    leave_requests = relationship("LeaveRequest", back_populates="user", uselist=True)
    
    # Properties
    @property
    def is_admin(self) -> bool:
        return self.role == UserRole.ADMIN