# backend/app/api/v1/endpoints/users.py
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_active_user, get_audit_logger, AuditLogger
from app.domain.models.user import User
from app.domain.schemas.user import User as UserSchema, UserCreate, UserUpdate
from app.adapters.persistence.user_repository import UserRepository

router = APIRouter()


@router.get("/me", response_model=UserSchema)
async def read_user_me(
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get current user.
    """
    return current_user


@router.patch("/me", response_model=UserSchema)
async def update_user_me(
    user_in: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    audit_logger: AuditLogger = Depends(get_audit_logger),
) -> Any:
    """
    Update current user.
    """
    user_repo = UserRepository(db)
    
    # Store previous state for audit
    previous_state = {
        "email": current_user.email,
        "full_name": current_user.full_name,
    }
    
    updated_user = await user_repo.update(db_obj=current_user, obj_in=user_in)
    
    # Log the update
    await audit_logger.log_action(
        user_id=current_user.id,
        action="update",
        resource_type="User",
        resource_id=current_user.id,
        previous_state=previous_state,
        new_state={
            "email": updated_user.email,
            "full_name": updated_user.full_name,
        },
        notes="User updated their profile",
    )
    
    return updated_user