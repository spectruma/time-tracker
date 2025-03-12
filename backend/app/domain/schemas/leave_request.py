# backend/app/domain/schemas/leave_request.py
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, model_validator


# Shared properties
class LeaveRequestBase(BaseModel):
    leave_type: str  # vacation, sick_leave, special_permit
    start_date: datetime
    end_date: datetime
    reason: Optional[str] = None


# Properties to receive via API on creation
class LeaveRequestCreate(LeaveRequestBase):
    @model_validator(mode='after')
    def check_date_order(self):
        if self.start_date >= self.end_date:
            raise ValueError("End date must be after start date")
        return self


# Properties to receive via API on update
class LeaveRequestUpdate(BaseModel):
    reason: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    
    @model_validator(mode='after')
    def check_date_order(self):
        if self.start_date and self.end_date and self.start_date >= self.end_date:
            raise ValueError("End date must be after start date")
        return self


# Properties for request approval/rejection
class LeaveRequestAction(BaseModel):
    status: str  # approved, rejected
    rejection_reason: Optional[str] = None


# Properties to return via API
class LeaveRequest(LeaveRequestBase):
    id: int
    user_id: int
    status: str
    created_at: datetime
    updated_at: datetime
    reviewed_by_id: Optional[int] = None
    reviewed_at: Optional[datetime] = None
    approved_by_id: Optional[int] = None
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    
    class Config:
        from_attributes = True
