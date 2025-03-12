# backend/app/domain/schemas/time_entry.py
from typing import Optional, List
from datetime import datetime
from typing_extensions import Annotated
from pydantic import BaseModel, Field, field_validator, model_validator, BeforeValidator

def validate_timezone(dt: datetime) -> datetime:
    """Validate that datetime has timezone info."""
    if dt.tzinfo is None:
        raise ValueError("Datetime must have timezone info")
    return dt


# Shared properties
class TimeEntryBase(BaseModel):
    start_time: Annotated[datetime, BeforeValidator(validate_timezone)]
    end_time: Optional[datetime] = None
    description: Optional[str] = None
    is_manual_entry: bool = False


# Properties to receive via API on creation
class TimeEntryCreate(TimeEntryBase):
    @model_validator(mode='after')
    def check_time_order(self):
        if self.end_time and self.start_time >= self.end_time:
            raise ValueError("End time must be after start time")
        return self


# Properties to receive via API on update
class TimeEntryUpdate(TimeEntryBase):
    start_time: Optional[Annotated[datetime, BeforeValidator(validate_timezone)]] = None
    
    @model_validator(mode='after')
    def check_time_order(self):
        if self.start_time and self.end_time and self.start_time >= self.end_time:
            raise ValueError("End time must be after start time")
        return self


# Properties for admin approval
class TimeEntryApprove(BaseModel):
    is_approved: bool = True
    audit_note: Optional[str] = None


# Properties to return via API
class TimeEntry(TimeEntryBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    is_approved: bool
    approved_by_id: Optional[int] = None
    approved_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
