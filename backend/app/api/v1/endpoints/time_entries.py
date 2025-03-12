# backend/app/api/v1/endpoints/time_entries.py
from typing import Any, List, Optional
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import (
    get_db,
    get_current_active_user,
    get_current_user_with_permissions,
    get_audit_logger,
    AuditLogger,
)
from app.domain.models.user import User
from app.domain.schemas.time_entry import (
    TimeEntry,
    TimeEntryCreate,
    TimeEntryUpdate,
    TimeEntryApprove,
)
from app.adapters.persistence.time_entry_repository import TimeEntryRepository
from app.domain.models.time_entry import TimeEntry as TimeEntryModel

router = APIRouter()


@router.post("", response_model=TimeEntry)
async def create_time_entry(
    entry_in: TimeEntryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    audit_logger: AuditLogger = Depends(get_audit_logger),
) -> Any:
    """
    Create a new time entry.
    """
    time_entry_repo = TimeEntryRepository(db)
    
    # Create new time entry
    time_entry = await time_entry_repo.create(
        obj_in=TimeEntryModel(
            user_id=current_user.id,
            start_time=entry_in.start_time,
            end_time=entry_in.end_time,
            description=entry_in.description,
            is_manual_entry=entry_in.is_manual_entry,
            is_approved=not entry_in.is_manual_entry,  # Auto-approve non-manual entries
        )
    )
    
    # Log the creation
    await audit_logger.log_action(
        user_id=current_user.id,
        action="create",
        resource_type="TimeEntry",
        resource_id=time_entry.id,
        new_state={
            "start_time": time_entry.start_time.isoformat(),
            "end_time": time_entry.end_time.isoformat() if time_entry.end_time else None,
            "description": time_entry.description,
            "is_manual_entry": time_entry.is_manual_entry,
        },
        notes="Time entry created",
    )
    
    return time_entry


@router.get("", response_model=List[TimeEntry])
async def read_time_entries(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 100,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
) -> Any:
    """
    Retrieve time entries.
    """
    time_entry_repo = TimeEntryRepository(db)
    
    # Set default date range to current month if not provided
    if not start_date:
        today = datetime.now()
        start_date = datetime(today.year, today.month, 1)
    
    if not end_date:
        # End of current month
        today = datetime.now()
        if today.month == 12:
            end_date = datetime(today.year + 1, 1, 1) - timedelta(days=1)
        else:
            end_date = datetime(today.year, today.month + 1, 1) - timedelta(days=1)
        end_date = end_date.replace(hour=23, minute=59, second=59)
    
    time_entries = await time_entry_repo.get_by_user_and_period(
        user_id=current_user.id,
        start_date=start_date,
        end_date=end_date,
    )
    
    return time_entries


@router.get("/{time_entry_id}", response_model=TimeEntry)
async def read_time_entry(
    time_entry_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get a specific time entry.
    """
    time_entry_repo = TimeEntryRepository(db)
    time_entry = await time_entry_repo.get_by_id(id=time_entry_id)
    
    if not time_entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Time entry not found",
        )
    
    # Check if the time entry belongs to the current user
    if time_entry.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    
    return time_entry


@router.patch("/{time_entry_id}", response_model=TimeEntry)
async def update_time_entry(
    time_entry_id: int,
    entry_in: TimeEntryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    audit_logger: AuditLogger = Depends(get_audit_logger),
) -> Any:
    """
    Update a time entry.
    """
    time_entry_repo = TimeEntryRepository(db)
    time_entry = await time_entry_repo.get_by_id(id=time_entry_id)
    
    if not time_entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Time entry not found",
        )
    
    # Check if the time entry belongs to the current user
    if time_entry.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    
    # Store previous state for audit
    previous_state = {
        "start_time": time_entry.start_time.isoformat(),
        "end_time": time_entry.end_time.isoformat() if time_entry.end_time else None,
        "description": time_entry.description,
        "is_manual_entry": time_entry.is_manual_entry,
    }
    
    # Update the time entry
    updated_entry = await time_entry_repo.update(db_obj=time_entry, obj_in=entry_in)
    
    # Manual updates require approval
    if not time_entry.is_manual_entry and entry_in.is_manual_entry:
        updated_entry.is_approved = False
        updated_entry.approved_by_id = None
        updated_entry.approved_at = None
    
    # Log the update
    await audit_logger.log_action(
        user_id=current_user.id,
        action="update",
        resource_type="TimeEntry",
        resource_id=time_entry.id,
        previous_state=previous_state,
        new_state={
            "start_time": updated_entry.start_time.isoformat(),
            "end_time": updated_entry.end_time.isoformat() if updated_entry.end_time else None,
            "description": updated_entry.description,
            "is_manual_entry": updated_entry.is_manual_entry,
        },
        notes="Time entry updated",
    )
    
    await db.commit()
    await db.refresh(updated_entry)
    
    return updated_entry


@router.delete("/{time_entry_id}", response_model=TimeEntry)
async def delete_time_entry(
    time_entry_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    audit_logger: AuditLogger = Depends(get_audit_logger),
) -> Any:
    """
    Delete a time entry.
    """
    time_entry_repo = TimeEntryRepository(db)
    time_entry = await time_entry_repo.get_by_id(id=time_entry_id)
    
    if not time_entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Time entry not found",
        )
    
    # Check if the time entry belongs to the current user
    if time_entry.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    
    # Store the state for audit
    previous_state = {
        "start_time": time_entry.start_time.isoformat(),
        "end_time": time_entry.end_time.isoformat() if time_entry.end_time else None,
        "description": time_entry.description,
        "is_manual_entry": time_entry.is_manual_entry,
    }
    
    # Delete the time entry
    deleted_entry = await time_entry_repo.delete(id=time_entry_id)
    
    # Log the deletion
    await audit_logger.log_action(
        user_id=current_user.id,
        action="delete",
        resource_type="TimeEntry",
        resource_id=time_entry_id,
        previous_state=previous_state,
        notes="Time entry deleted",
    )
    
    return deleted_entry


@router.post("/{time_entry_id}/approve", response_model=TimeEntry)
async def approve_time_entry(
    time_entry_id: int,
    approval: TimeEntryApprove,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_with_permissions),
    audit_logger: AuditLogger = Depends(get_audit_logger),
) -> Any:
    """
    Approve a time entry (admin only).
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can approve time entries",
        )
    
    time_entry_repo = TimeEntryRepository(db)
    time_entry = await time_entry_repo.approve_entry(
        entry_id=time_entry_id,
        approved_by_id=current_user.id,
        audit_note=approval.audit_note,
    )
    
    if not time_entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Time entry not found",
        )
    
    # Log the approval
    await audit_logger.log_action(
        user_id=current_user.id,
        action="approve",
        resource_type="TimeEntry",
        resource_id=time_entry_id,
        new_state={"is_approved": time_entry.is_approved},
        notes=f"Time entry {'approved' if approval.is_approved else 'rejected'}: {approval.audit_note}",
    )
    
    return time_entry
