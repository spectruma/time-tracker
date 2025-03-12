# backend/app/api/v1/endpoints/admin.py
from typing import Any, List, Optional
from datetime import datetime, timedelta
import csv
import io
import json
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Body
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import (
    get_db,
    get_current_user_with_permissions,
    get_audit_logger,
    AuditLogger,
)
from app.domain.models.user import User
from app.domain.schemas.user import User as UserSchema, UserCreate, UserUpdate, UserAdmin
from app.domain.schemas.time_entry import TimeEntry
from app.domain.schemas.leave_request import LeaveRequest
from app.adapters.persistence.user_repository import UserRepository
from app.adapters.persistence.time_entry_repository import TimeEntryRepository
from app.adapters.persistence.leave_request_repository import LeaveRequestRepository

router = APIRouter()


@router.get("/users", response_model=List[UserAdmin])
async def read_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_with_permissions),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve users (admin only).
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    
    user_repo = UserRepository(db)
    users = await user_repo.get_multi(skip=skip, limit=limit)
    return users


@router.post("/users", response_model=UserAdmin)
async def create_user(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_with_permissions),
    audit_logger: AuditLogger = Depends(get_audit_logger),
) -> Any:
    """
    Create new user (admin only).
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    
    user_repo = UserRepository(db)
    
    # Check if user with this email already exists
    existing_user = await user_repo.get_by_email(email=user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    # Create the user
    user = await user_repo.create(obj_in=user_in)
    
    # Log the creation
    await audit_logger.log_action(
        user_id=current_user.id,
        action="create",
        resource_type="User",
        resource_id=user.id,
        new_state={
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "is_active": user.is_active,
        },
        notes="User created by admin",
    )
    
    return user


@router.get("/users/{user_id}", response_model=UserAdmin)
async def read_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_with_permissions),
) -> Any:
    """
    Get user by ID (admin only).
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    
    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(id=user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    return user


@router.patch("/users/{user_id}", response_model=UserAdmin)
async def update_user(
    user_id: int,
    user_in: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_with_permissions),
    audit_logger: AuditLogger = Depends(get_audit_logger),
) -> Any:
    """
    Update a user (admin only).
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    
    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(id=user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    # Store previous state for audit
    previous_state = {
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "is_active": user.is_active,
    }
    
    # Update the user
    updated_user = await user_repo.update(db_obj=user, obj_in=user_in)
    
    # Log the update
    await audit_logger.log_action(
        user_id=current_user.id,
        action="update",
        resource_type="User",
        resource_id=user_id,
        previous_state=previous_state,
        new_state={
            "email": updated_user.email,
            "full_name": updated_user.full_name,
            "role": updated_user.role,
            "is_active": updated_user.is_active,
        },
        notes="User updated by admin",
    )
    
    return updated_user


@router.post("/users/bulk-import", response_model=List[UserAdmin])
async def bulk_import_users(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_with_permissions),
    audit_logger: AuditLogger = Depends(get_audit_logger),
) -> Any:
    """
    Bulk import users from CSV/XLSX (admin only).
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    
    user_repo = UserRepository(db)
    
    # Check file type
    filename = file.filename.lower()
    if filename.endswith('.csv'):
        # Process CSV file
        contents = await file.read()
        csv_text = contents.decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(csv_text))
        
        users = []
        errors = []
        
        for row_idx, row in enumerate(csv_reader, start=2):  # Start at 2 to account for header row
            try:
                # Basic validation
                if not row.get('email') or not row.get('password'):
                    errors.append(f"Row {row_idx}: Missing required fields (email, password)")
                    continue
                
                # Check for existing user
                existing_user = await user_repo.get_by_email(email=row['email'])
                if existing_user:
                    errors.append(f"Row {row_idx}: Email already registered ({row['email']})")
                    continue
                
                # Create user
                user_data = UserCreate(
                    email=row['email'],
                    password=row['password'],
                    full_name=row.get('full_name', ''),
                    role=row.get('role', 'normal'),
                    is_active=row.get('is_active', 'true').lower() == 'true',
                )
                
                user = await user_repo.create(obj_in=user_data)
                users.append(user)
                
                # Log the creation
                await audit_logger.log_action(
                    user_id=current_user.id,
                    action="create",
                    resource_type="User",
                    resource_id=user.id,
                    new_state={
                        "email": user.email,
                        "full_name": user.full_name,
                        "role": user.role,
                        "is_active": user.is_active,
                    },
                    notes="User created by bulk import",
                )
                
            except Exception as e:
                errors.append(f"Row {row_idx}: Error - {str(e)}")
        
        # Return results with any errors
        if errors:
            return JSONResponse(
                status_code=status.HTTP_207_MULTI_STATUS,
                content={
                    "users": [{"id": user.id, "email": user.email} for user in users],
                    "errors": errors,
                    "success_count": len(users),
                    "error_count": len(errors),
                },
            )
        
        return users
    
    elif filename.endswith(('.xlsx', '.xls')):
        # Process Excel file
        # This would require a library like openpyxl
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Excel import not implemented yet",
        )
    
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Please upload CSV or XLSX file.",
        )


@router.get("/time-entries/pending", response_model=List[TimeEntry])
async def read_pending_time_entries(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_with_permissions),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve pending time entries for approval (admin only).
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    
    time_entry_repo = TimeEntryRepository(db)
    time_entries = await time_entry_repo.get_pending_approval(skip=skip, limit=limit)
    return time_entries


@router.get("/leave-requests/pending", response_model=List[LeaveRequest])
async def read_pending_leave_requests(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_with_permissions),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve pending leave requests (admin only).
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    
    leave_request_repo = LeaveRequestRepository(db)
    leave_requests = await leave_request_repo.get_pending_requests(skip=skip, limit=limit)
    return leave_requests


@router.get("/compliance/working-time", response_model=dict)
async def check_working_time_compliance(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_with_permissions),
    user_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
) -> Any:
    """
    Check EU Working Time Directive compliance (admin only).
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    
    time_entry_repo = TimeEntryRepository(db)
    user_repo = UserRepository(db)
    
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
    
    # Check compliance for a specific user or all users
    if user_id:
        user = await user_repo.get_by_id(id=user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        
        compliance_data = await time_entry_repo.get_working_hours_summary(
            user_id=user_id,
            start_date=start_date,
            end_date=end_date,
        )
        
        return {
            "user_id": user_id,
            "user_email": user.email,
            "compliance_data": compliance_data,
            "is_compliant": (
                compliance_data["rest_period_violations"] == 0 and
                compliance_data["weekly_hour_violations"] == 0
            ),
        }
    else:
        # Check compliance for all users
        users = await user_repo.get_multi()
        compliance_results = []
        
        for user in users:
            compliance_data = await time_entry_repo.get_working_hours_summary(
                user_id=user.id,
                start_date=start_date,
                end_date=end_date,
            )
            
            compliance_results.append({
                "user_id": user.id,
                "user_email": user.email,
                "is_compliant": (
                    compliance_data["rest_period_violations"] == 0 and
                    compliance_data["weekly_hour_violations"] == 0
                ),
                "rest_period_violations": compliance_data["rest_period_violations"],
                "weekly_hour_violations": compliance_data["weekly_hour_violations"],
                "total_hours": compliance_data["total_hours"],
            })
        
        return {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "results": compliance_results,
            "overall_compliance": all(r["is_compliant"] for r in compliance_results),
        }