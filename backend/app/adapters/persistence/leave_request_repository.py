# backend/app/adapters/persistence/leave_request_repository.py
from typing import List, Optional
from datetime import datetime
from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.leave_request import LeaveRequest, RequestStatus
from app.domain.schemas.leave_request import LeaveRequestCreate, LeaveRequestUpdate
from app.adapters.persistence.base_repository import BaseRepository


class LeaveRequestRepository(BaseRepository[LeaveRequest, LeaveRequestCreate, LeaveRequestUpdate]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, LeaveRequest)
    
    async def get_by_user(
        self, user_id: int, skip: int = 0, limit: int = 100, status: Optional[str] = None
    ) -> List[LeaveRequest]:
        """Get leave requests for a specific user."""
        query = select(LeaveRequest).where(LeaveRequest.user_id == user_id)
        
        if status:
            query = query.where(LeaveRequest.status == status)
        
        query = query.order_by(LeaveRequest.created_at.desc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        return result.scalars().all()
    
    async def get_pending_requests(self, skip: int = 0, limit: int = 100) -> List[LeaveRequest]:
        """Get pending leave requests for approval."""
        query = select(LeaveRequest).where(
            LeaveRequest.status == RequestStatus.PENDING
        ).order_by(LeaveRequest.created_at).offset(skip).limit(limit)
        
        result = await self.db.execute(query)
        return result.scalars().all()
    
    async def check_overlapping_requests(
        self, user_id: int, start_date: datetime, end_date: datetime, exclude_id: Optional[int] = None
    ) -> bool:
        """Check if there are overlapping leave requests for a user."""
        query = select(LeaveRequest).where(
            and_(
                LeaveRequest.user_id == user_id,
                LeaveRequest.status.in_([RequestStatus.PENDING, RequestStatus.APPROVED]),
                or_(
                    and_(
                        LeaveRequest.start_date <= end_date,
                        LeaveRequest.end_date >= start_date,
                    ),
                ),
            )
        )
        
        if exclude_id:
            query = query.where(LeaveRequest.id != exclude_id)
        
        result = await self.db.execute(query)
        return bool(result.scalars().first())
    
    async def update_status(
        self,
        request_id: int,
        status: RequestStatus,
        user_id: int,
        rejection_reason: Optional[str] = None,
    ) -> Optional[LeaveRequest]:
        """Update the status of a leave request."""
        request = await self.get_by_id(request_id)
        if not request:
            return None
        
        request.status = status
        
        if status == RequestStatus.APPROVED:
            request.approved_by_id = user_id
            request.approved_at = datetime.now()
        elif status == RequestStatus.REJECTED:
            request.rejection_reason = rejection_reason
        
        self.db.add(request)
        await self.db.commit()
        await self.db.refresh(request)
        return request
    