# backend/app/api/v1/router.py
from fastapi import APIRouter

from app.api.v1.endpoints import auth, users, time_entries, leave_requests, admin, analytics

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(time_entries.router, prefix="/time-entries", tags=["time tracking"])
api_router.include_router(leave_requests.router, prefix="/leave-requests", tags=["leave management"])
api_router.include_router(admin.router, prefix="/admin", tags=["administration"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
