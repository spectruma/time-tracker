# backend/app/api/v1/endpoints/leave_requests.py
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
from app.domain.models.leave_request import LeaveRequest as LeaveRequestModel, RequestStatus
from app.domain.schemas.leave_request import (
    LeaveRequest,
    LeaveRequestCreate,
    LeaveRequestUpdate,
    LeaveRequestAction,
)
from app.adapters.persistence.leave_request_repository import LeaveRequestRepository

router = APIRouter()


@router.post("", response_model=LeaveRequest)
async def create_leave_request(
    request_in: LeaveRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    audit_logger: AuditLogger = Depends(get_audit_logger),
) -> Any:
    """
    Create a new leave request.
    """
    leave_request_repo = LeaveRequestRepository(db)
    
    # Check for overlapping requests
    overlaps = await leave_request_repo.check_overlapping_requests(
        user_id=current_user.id,
        start_date=request_in.start_date,
        end_date=request_in.end_date,
    )
    
    if overlaps:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have a leave request for this period",
        )
    
    # Create the leave request
    leave_request = await leave_request_repo.create(
        obj_in=LeaveRequestModel(
            user_id=current_user.id,
            leave_type=request_in.leave_type,
            start_date=request_in.start_date,
            end_date=request_in.end_date,
            reason=request_in.reason,
            status=RequestStatus.PENDING,
        )
    )
    
    # Log the creation
    await audit_logger.log_action(
        user_id=current_user.id,
        action="create",
        resource_type="LeaveRequest",
        resource_id=leave_request.id,
        new_state={
            "leave_type": leave_request.leave_type,
            "start_date": leave_request.start_date.isoformat(),
            "end_date": leave_request.end_date.isoformat(),
            "reason": leave_request.reason,
            "status": leave_request.status,
        },
        notes="Leave request created",
    )
    
    return leave_request


@router.get("", response_model=List[LeaveRequest])
async def read_leave_requests(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
) -> Any:
    """
    Retrieve leave requests.
    """
    leave_request_repo = LeaveRequestRepository(db)
    leave_requests = await leave_request_repo.get_by_user(
        user_id=current_user.id,
        skip=skip,
        limit=limit,
        status=status,
    )
    
    return leave_requests


@router.get("/{leave_request_id}", response_model=LeaveRequest)
async def read_leave_request(
    leave_request_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get a specific leave request.
    """
    leave_request_repo = LeaveRequestRepository(db)
    leave_request = await leave_request_repo.get_by_id(id=leave_request_id)
    
    if not leave_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Leave request not found",
        )
    
    # Check if the leave request belongs to the current user
    if leave_request.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    
    return leave_request


@router.patch("/{leave_request_id}", response_model=LeaveRequest)
async def update_leave_request(
    leave_request_id: int,
    request_in: LeaveRequestUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    audit_logger: AuditLogger = Depends(get_audit_logger),
) -> Any:
    """
    Update a leave request.
    """
    leave_request_repo = LeaveRequestRepository(db)
    leave_request = await leave_request_repo.get_by_id(id=leave_request_id)
    
    if not leave_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Leave request not found",
        )
    
    # Check if the leave request belongs to the current user
    if leave_request.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    
    # Check if the leave request is pending
    if leave_request.status != RequestStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot update a leave request with status {leave_request.status}",
        )
    
    # Check for date changes and overlapping requests
    if request_in.start_date or request_in.end_date:
        start_date = request_in.start_date or leave_request.start_date
        end_date = request_in.end_date or leave_request.end_date
        
        overlaps = await leave_request_repo.check_overlapping_requests(
            user_id=current_user.id,
            start_date=start_date,
            end_date=end_date,
            exclude_id=leave_request_id,
        )
        
        if overlaps:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You already have a leave request for this period",
            )
    
    # Store previous state for audit
    previous_state = {
        "reason": leave_request.reason,
        "start_date": leave_request.start_date.isoformat(),
        "end_date": leave_request.end_date.isoformat(),
    }
    
    # Update the leave request
    updated_request = await leave_request_repo.update(
        db_obj=leave_request, obj_in=request_in
    )
    
    # Log the update
    await audit_logger.log_action(
        user_id=current_user.id,
        action="update",
        resource_type="LeaveRequest",
        resource_id=leave_request_id,
        previous_state=previous_state,
        new_state={
            "reason": updated_request.reason,
            "start_date": updated_request.start_date.isoformat(),
            "end_date": updated_request.end_date.isoformat(),
        },
        notes="Leave request updated",
    )
    
    return updated_request


@router.delete("/{leave_request_id}", response_model=LeaveRequest)
async def delete_leave_request(
    leave_request_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    audit_logger: AuditLogger = Depends(get_audit_logger),
) -> Any:
    """
    Cancel a leave request.
    """
    leave_request_repo = LeaveRequestRepository(db)
    leave_request = await leave_request_repo.get_by_id(id=leave_request_id)
    
    if not leave_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Leave request not found",
        )
    
    # Check if the leave request belongs to the current user
    if leave_request.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    
    # Check if the leave request is pending
    if leave_request.status != RequestStatus.PENDING:
        # Update status to CANCELED instead of deleting
        leave_request.status = RequestStatus.CANCELED
        db.add(leave_request)
        await db.commit()
        await db.refresh(leave_request)
        
        # Log the cancellation
        await audit_logger.log_action(
            user_id=current_user.id,
            action="cancel",
            resource_type="LeaveRequest",
            resource_id=leave_request_id,
            previous_state={"status": RequestStatus.PENDING},
            new_state={"status": RequestStatus.CANCELED},
            notes="Leave request canceled",
        )
        
        return leave_request
    
    # Delete the pending leave request
    deleted_request = await leave_request_repo.delete(id=leave_request_id)
    
    # Log the deletion
    await audit_logger.log_action(
        user_id=current_user.id,
        action="delete",
        resource_type="LeaveRequest",
        resource_id=leave_request_id,
        previous_state={
            "leave_type": deleted_request.leave_type,
            "start_date": deleted_request.start_date.isoformat(),
            "end_date": deleted_request.end_date.isoformat(),
            "reason": deleted_request.reason,
            "status": deleted_request.status,
        },
        notes="Leave request deleted",
    )
    
    return deleted_request


@router.post("/{leave_request_id}/action", response_model=LeaveRequest)
async def process_leave_request(
    leave_request_id: int,
    action: LeaveRequestAction,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_with_permissions),
    audit_logger: AuditLogger = Depends(get_audit_logger),
) -> Any:
    """
    Process (approve/reject) a leave request (admin only).
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can process leave requests",
        )
    
    leave_request_repo = LeaveRequestRepository(db)
    leave_request = await leave_request_repo.get_by_id(id=leave_request_id)
    
    if not leave_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Leave request not found",
        )
    
    # Check if the leave request is pending
    if leave_request.status != RequestStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot process a leave request with status {leave_request.status}",
        )
    
    # Update the status based on the action
    if action.status == "approved":
        status_value = RequestStatus.APPROVED
        action_type = "approve"
    elif action.status == "rejected":
        status_value = RequestStatus.REJECTED
        if not action.rejection_reason:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Rejection reason is required",
            )
        action_type = "reject"
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid action",
        )
    
    # Process the leave request
    processed_request = await leave_request_repo.update_status(
        request_id=leave_request_id,
        status=status_value,
        user_id=current_user.id,
        rejection_reason=action.rejection_reason,
    )
    
    # Log the action
    await audit_logger.log_action(
        user_id=current_user.id,
        action=action_type,
        resource_type="LeaveRequest",
        resource_id=leave_request_id,
        previous_state={"status": RequestStatus.PENDING},
        new_state={
            "status": status_value,
            "rejection_reason": action.rejection_reason,
        },
        notes=f"Leave request {action_type}d",
    )
    
    return processed_request
