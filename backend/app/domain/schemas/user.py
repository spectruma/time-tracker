# backend/app/domain/schemas/user.py
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


# Shared properties
class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = True
    role: Optional[str] = "normal"


# Properties to receive via API on creation
class UserCreate(UserBase):
    email: EmailStr
    password: str = Field(..., min_length=8)


# Properties to receive via API on update
class UserUpdate(UserBase):
    password: Optional[str] = Field(None, min_length=8)


# Properties to return via API
class User(UserBase):
    id: int
    created_at: str
    
    class Config:
        from_attributes = True


# Properties for admin user view
class UserAdmin(User):
    is_admin: bool = False
