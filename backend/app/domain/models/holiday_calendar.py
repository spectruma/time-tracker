# backend/app/domain/models/holiday_calendar.py
from sqlalchemy import Column, Integer, DateTime, String, Boolean, UniqueConstraint
from app.domain.models.base import Base


class HolidayCalendar(Base):
    """Country-specific holiday calendar."""
    
    country_code = Column(String(2), nullable=False, index=True)
    date = Column(DateTime(timezone=True), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(String(500), nullable=True)
    is_full_day = Column(Boolean, default=True, nullable=False)
    
    __table_args__ = (
        UniqueConstraint('country_code', 'date', name='uix_holiday_country_date'),
    )