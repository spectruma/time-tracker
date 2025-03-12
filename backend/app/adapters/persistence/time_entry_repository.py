# backend/app/adapters/persistence/time_entry_repository.py
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy import select, and_, or_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.time_entry import TimeEntry
from app.domain.schemas.time_entry import TimeEntryCreate, TimeEntryUpdate
from app.adapters.persistence.base_repository import BaseRepository


class TimeEntryRepository(BaseRepository[TimeEntry, TimeEntryCreate, TimeEntryUpdate]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, TimeEntry)
    
    async def get_by_user_and_period(
        self, user_id: int, start_date: datetime, end_date: datetime
    ) -> List[TimeEntry]:
        """Get time entries for a user within a specific time period."""
        query = select(TimeEntry).where(
            and_(
                TimeEntry.user_id == user_id,
                or_(
                    and_(
                        TimeEntry.start_time >= start_date,
                        TimeEntry.start_time <= end_date,
                    ),
                    and_(
                        TimeEntry.end_time >= start_date,
                        TimeEntry.end_time <= end_date,
                    ),
                ),
            )
        ).order_by(TimeEntry.start_time)
        
        result = await self.db.execute(query)
        return result.scalars().all()
    
    async def get_pending_approval(self, skip: int = 0, limit: int = 100) -> List[TimeEntry]:
        """Get time entries pending approval."""
        query = select(TimeEntry).where(
            and_(
                TimeEntry.is_manual_entry == True,
                TimeEntry.is_approved == False,
            )
        ).order_by(TimeEntry.created_at.desc()).offset(skip).limit(limit)
        
        result = await self.db.execute(query)
        return result.scalars().all()
    
    async def approve_entry(
        self, entry_id: int, approved_by_id: int, audit_note: Optional[str] = None
    ) -> Optional[TimeEntry]:
        """Approve a time entry."""
        entry = await self.get_by_id(entry_id)
        if not entry:
            return None
        
        entry.is_approved = True
        entry.approved_by_id = approved_by_id
        entry.approved_at = datetime.now()
        entry.audit_note = audit_note
        entry.audit_change_type = "approval"
        
        self.db.add(entry)
        await self.db.commit()
        await self.db.refresh(entry)
        return entry
    
    async def get_working_hours_summary(
        self, user_id: int, start_date: datetime, end_date: datetime
    ) -> Dict[str, Any]:
        """
        Calculate working hours summary for EU Working Time Directive compliance.
        """
        time_entries = await self.get_by_user_and_period(user_id, start_date, end_date)
        
        total_seconds = 0
        daily_hours = {}
        
        for entry in time_entries:
            if entry.end_time:  # Only count completed entries
                duration = (entry.end_time - entry.start_time).total_seconds()
                total_seconds += duration
                
                # Track daily hours for rest period compliance
                day_key = entry.start_time.date().isoformat()
                if day_key not in daily_hours:
                    daily_hours[day_key] = 0
                daily_hours[day_key] += duration / 3600  # Convert to hours
        
        # Check for rest period violations (less than 11 hours between days)
        rest_violations = 0
        sorted_entries = sorted(time_entries, key=lambda x: x.start_time)
        
        for i in range(len(sorted_entries) - 1):
            current_entry = sorted_entries[i]
            next_entry = sorted_entries[i + 1]
            
            if current_entry.end_time and next_entry.start_time:
                rest_period = (next_entry.start_time - current_entry.end_time).total_seconds() / 3600
                if rest_period < 11 and current_entry.end_time.date() != next_entry.start_time.date():
                    rest_violations += 1
        
        # Calculate weekly hours
        weeks = {}
        for entry in time_entries:
            if entry.end_time:  # Only count completed entries
                # Get ISO week number
                week_key = f"{entry.start_time.isocalendar()[0]}-{entry.start_time.isocalendar()[1]}"
                if week_key not in weeks:
                    weeks[week_key] = 0
                
                duration = (entry.end_time - entry.start_time).total_seconds() / 3600
                weeks[week_key] += duration
        
        # Check for weekly hour violations (>48 hours per week)
        weekly_violations = sum(1 for hours in weeks.values() if hours > 48)
        
        return {
            "total_hours": total_seconds / 3600,
            "daily_hours": daily_hours,
            "rest_period_violations": rest_violations,
            "weekly_hours": weeks,
            "weekly_hour_violations": weekly_violations,
        }
