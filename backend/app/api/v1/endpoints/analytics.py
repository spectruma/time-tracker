# backend/app/api/v1/endpoints/analytics.py
from typing import Any, List, Optional, Dict
from datetime import datetime, timedelta
import json
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
import io
import csv
import pandas as pd
from sqlalchemy import func, select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import (
    get_db,
    get_current_active_user,
    get_current_user_with_permissions,
    get_redis,
    get_elasticsearch,
)
from app.domain.models.user import User
from app.domain.models.time_entry import TimeEntry
from app.domain.models.leave_request import LeaveRequest, LeaveType, RequestStatus
from app.adapters.persistence.time_entry_repository import TimeEntryRepository
from app.adapters.persistence.leave_request_repository import LeaveRequestRepository
from app.adapters.persistence.user_repository import UserRepository

router = APIRouter()


@router.get("/dashboard")
async def get_dashboard_data(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    redis_client = Depends(get_redis),
) -> Dict[str, Any]:
    """
    Get dashboard data for the current user.
    """
    # Set default date range to current month if not provided
    if not start_date:
        today = datetime.now()
        start_date = datetime(today.year, today.month, 1)
    
    if not end_date:
        today = datetime.now()
        if today.month == 12:
            end_date = datetime(today.year + 1, 1, 1) - timedelta(days=1)
        else:
            end_date = datetime(today.year, today.month + 1, 1) - timedelta(days=1)
        end_date = end_date.replace(hour=23, minute=59, second=59)
    
    # Define cache key for Redis
    cache_key = f"dashboard:{current_user.id}:{start_date.isoformat()}:{end_date.isoformat()}"
    
    # Try to get from cache first
    cached_data = await redis_client.get(cache_key)
    if cached_data:
        return json.loads(cached_data)
    
    # Get time entries for the period
    time_entry_repo = TimeEntryRepository(db)
    time_entries = await time_entry_repo.get_by_user_and_period(
        user_id=current_user.id,
        start_date=start_date,
        end_date=end_date,
    )
    
    # Calculate working hours
    total_seconds = 0
    daily_hours = {}
    
    for entry in time_entries:
        if entry.end_time:  # Only count completed entries
            duration = (entry.end_time - entry.start_time).total_seconds()
            total_seconds += duration
            
            # Track daily hours
            day_key = entry.start_time.date().isoformat()
            if day_key not in daily_hours:
                daily_hours[day_key] = 0
            daily_hours[day_key] += duration / 3600  # Convert to hours
    
    # Get leave requests for the period
    query = select(LeaveRequest).where(
        and_(
            LeaveRequest.user_id == current_user.id,
            LeaveRequest.status == RequestStatus.APPROVED,
            LeaveRequest.start_date <= end_date,
            LeaveRequest.end_date >= start_date,
        )
    )
    
    result = await db.execute(query)
    leave_requests = result.scalars().all()
    
    # Calculate leave days by type
    leave_days = {
        "vacation": 0,
        "sick_leave": 0,
        "special_permit": 0,
    }
    
    for request in leave_requests:
        # Calculate overlap with requested period
        overlap_start = max(request.start_date, start_date)
        overlap_end = min(request.end_date, end_date)
        
        if overlap_start <= overlap_end:
            # Count business days in the period
            current_date = overlap_start
            while current_date <= overlap_end:
                if current_date.weekday() < 5:  # Monday to Friday
                    if request.leave_type == LeaveType.VACATION:
                        leave_days["vacation"] += 1
                    elif request.leave_type == LeaveType.SICK_LEAVE:
                        leave_days["sick_leave"] += 1
                    elif request.leave_type == LeaveType.SPECIAL_PERMIT:
                        leave_days["special_permit"] += 1
                
                current_date += timedelta(days=1)
    
    # Calculate overtime (simplified, would need to be customized based on contract hours)
    standard_daily_hours = 8  # hours
    overtime_hours = 0
    
    for day, hours in daily_hours.items():
        if hours > standard_daily_hours:
            overtime_hours += hours - standard_daily_hours
    
    # Prepare dashboard data
    dashboard_data = {
        "time_balance": {
            "total_hours": total_seconds / 3600,
            "total_days": total_seconds / 3600 / standard_daily_hours,
            "daily_hours": daily_hours,
            "overtime_hours": overtime_hours,
        },
        "leave_balance": leave_days,
        "period": {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
        },
    }
    
    # Cache the result
    await redis_client.set(
        cache_key,
        json.dumps(dashboard_data),
        ex=300,  # Cache for 5 minutes
    )
    
    return dashboard_data


@router.get("/reports/time-entries")
async def generate_time_entries_report(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_with_permissions),
    user_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    format: str = Query("json", enum=["json", "csv", "excel"]),
) -> Any:
    """
    Generate a time entries report (admin only for other users).
    """
    # Check permissions if requesting data for another user
    if user_id and user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    
    # Set default to current user if not specified
    if not user_id:
        user_id = current_user.id
    
    # Set default date range to current month if not provided
    if not start_date:
        today = datetime.now()
        start_date = datetime(today.year, today.month, 1)
    
    if not end_date:
        today = datetime.now()
        if today.month == 12:
            end_date = datetime(today.year + 1, 1, 1) - timedelta(days=1)
        else:
            end_date = datetime(today.year, today.month + 1, 1) - timedelta(days=1)
        end_date = end_date.replace(hour=23, minute=59, second=59)
    
    # Get time entries
    time_entry_repo = TimeEntryRepository(db)
    time_entries = await time_entry_repo.get_by_user_and_period(
        user_id=user_id,
        start_date=start_date,
        end_date=end_date,
    )
    
    # Convert to dict for serialization
    entries_data = []
    for entry in time_entries:
        entries_data.append({
            "id": entry.id,
            "start_time": entry.start_time.isoformat(),
            "end_time": entry.end_time.isoformat() if entry.end_time else None,
            "description": entry.description,
            "duration_hours": (entry.end_time - entry.start_time).total_seconds() / 3600 if entry.end_time else None,
            "is_manual_entry": entry.is_manual_entry,
            "is_approved": entry.is_approved,
            "created_at": entry.created_at.isoformat(),
        })
    
    # Return based on requested format
    if format == "json":
        return {
            "user_id": user_id,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "entries": entries_data,
            "total_entries": len(entries_data),
        }
    
    elif format == "csv":
        # Create CSV
        output = io.StringIO()
        writer = csv.DictWriter(
            output,
            fieldnames=[
                "id", "start_time", "end_time", "description",
                "duration_hours", "is_manual_entry", "is_approved", "created_at"
            ]
        )
        writer.writeheader()
        for entry in entries_data:
            writer.writerow(entry)
        
        # Return as downloadable file
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=time_entries_{user_id}_{start_date.date()}_to_{end_date.date()}.csv"
            }
        )
    
    elif format == "excel":
        # Create Excel file
        df = pd.DataFrame(entries_data)
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine="openpyxl") as writer:
            df.to_excel(writer, index=False, sheet_name="Time Entries")
        
        # Return as downloadable file
        output.seek(0)
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f"attachment; filename=time_entries_{user_id}_{start_date.date()}_to_{end_date.date()}.xlsx"
            }
        )


@router.get("/reports/leave-requests")
async def generate_leave_requests_report(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_with_permissions),
    user_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    status: Optional[str] = None,
    format: str = Query("json", enum=["json", "csv", "excel"]),
) -> Any:
    """
    Generate a leave requests report (admin only for other users).
    """
    # Check permissions if requesting data for another user
    if user_id and user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    
    # Set default to current user if not specified
    if not user_id:
        user_id = current_user.id
    
    # Set default date range to current year if not provided
    if not start_date:
        today = datetime.now()
        start_date = datetime(today.year, 1, 1)
    
    if not end_date:
        today = datetime.now()
        end_date = datetime(today.year, 12, 31)
    
    # Build query based on parameters
    query = select(LeaveRequest).where(LeaveRequest.user_id == user_id)
    
    if status:
        query = query.where(LeaveRequest.status == status)
    
    query = query.where(
        and_(
            LeaveRequest.start_date <= end_date,
            LeaveRequest.end_date >= start_date,
        )
    )
    
    result = await db.execute(query)
    leave_requests = result.scalars().all()
    
    # Convert to dict for serialization
    requests_data = []
    for request in leave_requests:
        # Calculate business days
        business_days = 0
        current_date = request.start_date
        while current_date <= request.end_date:
            if current_date.weekday() < 5:  # Monday to Friday
                business_days += 1
            current_date += timedelta(days=1)
        
        requests_data.append({
            "id": request.id,
            "leave_type": request.leave_type.value if hasattr(request.leave_type, 'value') else request.leave_type,
            "start_date": request.start_date.isoformat(),
            "end_date": request.end_date.isoformat(),
            "status": request.status.value if hasattr(request.status, 'value') else request.status,
            "business_days": business_days,
            "reason": request.reason,
            "created_at": request.created_at.isoformat(),
            "reviewed_at": request.reviewed_at.isoformat() if request.reviewed_at else None,
            "approved_at": request.approved_at.isoformat() if request.approved_at else None,
        })
    
    # Return based on requested format
    if format == "json":
        return {
            "user_id": user_id,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "requests": requests_data,
            "total_requests": len(requests_data),
        }
    
    elif format == "csv":
        # Create CSV
        output = io.StringIO()
        writer = csv.DictWriter(
            output,
            fieldnames=[
                "id", "leave_type", "start_date", "end_date", "status",
                "business_days", "reason", "created_at", "reviewed_at", "approved_at"
            ]
        )
        writer.writeheader()
        for request in requests_data:
            writer.writerow(request)
        
        # Return as downloadable file
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=leave_requests_{user_id}_{start_date.date()}_to_{end_date.date()}.csv"
            }
        )
    
    elif format == "excel":
        # Create Excel file
        df = pd.DataFrame(requests_data)
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine="openpyxl") as writer:
            df.to_excel(writer, index=False, sheet_name="Leave Requests")
        
        # Return as downloadable file
        output.seek(0)
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f"attachment; filename=leave_requests_{user_id}_{start_date.date()}_to_{end_date.date()}.xlsx"
            }
        )


@router.get("/team-overview")
async def get_team_overview(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_with_permissions),
    date: Optional[datetime] = None,
) -> Dict[str, Any]:
    """
    Get team overview data (admin only).
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    
    # Set default date to today if not provided
    if not date:
        date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Start and end of the selected date
    start_of_day = date.replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_day = date.replace(hour=23, minute=59, second=59, microsecond=999999)
    
    # Get all active users
    user_repo = UserRepository(db)
    users = await user_repo.get_multi(filters={"is_active": True})
    
    # Get time entries for all users on that day
    time_entry_repo = TimeEntryRepository(db)
    
    # Get leave requests for all users on that day
    leave_request_query = select(LeaveRequest).where(
        and_(
            LeaveRequest.status == RequestStatus.APPROVED,
            LeaveRequest.start_date <= end_of_day,
            LeaveRequest.end_date >= start_of_day,
        )
    )
    leave_result = await db.execute(leave_request_query)
    leave_requests = leave_result.scalars().all()
    
    # Map of user IDs to leave types for the day
    user_leave_map = {}
    for request in leave_requests:
        user_leave_map[request.user_id] = request.leave_type.value if hasattr(request.leave_type, 'value') else request.leave_type
    
    # Build team overview
    team_data = []
    for user in users:
        # Get user's time entries for the day
        time_entries = await time_entry_repo.get_by_user_and_period(
            user_id=user.id,
            start_date=start_of_day,
            end_date=end_of_day,
        )
        
        # Calculate total working time
        total_seconds = 0
        entries_info = []
        
        for entry in time_entries:
            if entry.end_time:  # Only count completed entries
                duration = (entry.end_time - entry.start_time).total_seconds()
                total_seconds += duration
                entries_info.append({
                    "id": entry.id,
                    "start_time": entry.start_time.isoformat(),
                    "end_time": entry.end_time.isoformat(),
                    "duration_hours": duration / 3600,
                    "description": entry.description,
                })
            else:
                # For ongoing entries, calculate duration until now
                current_time = datetime.now()
                if current_time > entry.start_time:
                    duration = (current_time - entry.start_time).total_seconds()
                    entries_info.append({
                        "id": entry.id,
                        "start_time": entry.start_time.isoformat(),
                        "end_time": None,
                        "duration_hours_so_far": duration / 3600,
                        "description": entry.description,
                        "ongoing": True,
                    })
        
        # Check if user is on leave
        is_on_leave = user.id in user_leave_map
        leave_type = user_leave_map.get(user.id, None)
        
        # Add user data to team overview
        team_data.append({
            "user_id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "is_on_leave": is_on_leave,
            "leave_type": leave_type,
            "worked_hours": total_seconds / 3600,
            "has_active_session": any(not entry.get("end_time") for entry in entries_info),
            "entries": entries_info,
        })
    
    return {
        "date": date.isoformat(),
        "team_members": team_data,
        "present_count": sum(1 for user in team_data if not user["is_on_leave"] and user["worked_hours"] > 0),
        "absent_count": sum(1 for user in team_data if user["is_on_leave"]),
        "no_activity_count": sum(1 for user in team_data if not user["is_on_leave"] and user["worked_hours"] == 0),
    }


@router.get("/working-time-statistics")
async def get_working_time_statistics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_with_permissions),
    user_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
) -> Dict[str, Any]:
    """
    Get working time statistics.
    """
    # Check permissions if requesting data for another user
    if user_id and user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    
    # Set default to current user if not specified
    if not user_id:
        user_id = current_user.id
    
    # Set default date range to current month if not provided
    if not start_date:
        today = datetime.now()
        # Start of current month
        start_date = datetime(today.year, today.month, 1)
    
    if not end_date:
        today = datetime.now()
        # End of current month
        if today.month == 12:
            end_date = datetime(today.year + 1, 1, 1) - timedelta(days=1)
        else:
            end_date = datetime(today.year, today.month + 1, 1) - timedelta(days=1)
        end_date = end_date.replace(hour=23, minute=59, second=59)
    
    # Get time entries
    time_entry_repo = TimeEntryRepository(db)
    time_entries = await time_entry_repo.get_by_user_and_period(
        user_id=user_id,
        start_date=start_date,
        end_date=end_date,
    )
    
    # Calculate statistics
    total_days = (end_date.date() - start_date.date()).days + 1
    business_days = sum(1 for i in range(total_days) if (start_date + timedelta(days=i)).weekday() < 5)
    
    # Daily statistics
    daily_stats = {}
    for i in range(total_days):
        day = start_date.date() + timedelta(days=i)
        daily_stats[day.isoformat()] = {"total_hours": 0, "entry_count": 0}
    
    # Process time entries
    total_hours = 0
    entry_count = 0
    longest_session = 0
    earliest_start = None
    latest_end = None
    
    for entry in time_entries:
        if entry.end_time:  # Only count completed entries
            duration_hours = (entry.end_time - entry.start_time).total_seconds() / 3600
            total_hours += duration_hours
            entry_count += 1
            
            # Check for longest session
            if duration_hours > longest_session:
                longest_session = duration_hours
            
            # Track earliest start and latest end
            entry_date = entry.start_time.date().isoformat()
            if entry_date in daily_stats:
                daily_stats[entry_date]["total_hours"] += duration_hours
                daily_stats[entry_date]["entry_count"] += 1
            
            # Track earliest start time
            if earliest_start is None or entry.start_time.time() < earliest_start:
                earliest_start = entry.start_time.time()
            
            # Track latest end time
            if latest_end is None or entry.end_time.time() > latest_end:
                latest_end = entry.end_time.time()
    
    # Calculate standard working hours based on business days
    standard_hours = business_days * 8  # 8 hours per business day
    
    # Get working time compliance data
    compliance_data = await time_entry_repo.get_working_hours_summary(
        user_id=user_id,
        start_date=start_date,
        end_date=end_date,
    )
    
    return {
        "user_id": user_id,
        "period": {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "total_days": total_days,
            "business_days": business_days,
        },
        "summary": {
            "total_hours": total_hours,
            "entry_count": entry_count,
            "average_hours_per_business_day": total_hours / business_days if business_days > 0 else 0,
            "longest_session_hours": longest_session,
            "earliest_start_time": earliest_start.isoformat() if earliest_start else None,
            "latest_end_time": latest_end.isoformat() if latest_end else None,
            "overtime_hours": total_hours - standard_hours if total_hours > standard_hours else 0,
        },
        "daily_stats": daily_stats,
        "compliance": {
            "rest_period_violations": compliance_data["rest_period_violations"],
            "weekly_hour_violations": compliance_data["weekly_hour_violations"],
            "is_compliant": (
                compliance_data["rest_period_violations"] == 0 and
                compliance_data["weekly_hour_violations"] == 0
            ),
        },
    }