# backend/app/api/deps.py
from typing import AsyncGenerator, Optional
import redis.asyncio as redis
from elasticsearch import AsyncElasticsearch
from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.adapters.persistence.database import AsyncSessionLocal
from app.core.config import settings
from app.domain.models.user import User
from app.core.security import get_current_active_user


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency for getting async DB session.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


# Redis connection pool
redis_pool = redis.ConnectionPool(
    host=settings.REDIS_HOST,
    port=settings.REDIS_PORT,
    password=settings.REDIS_PASSWORD,
    decode_responses=True,
)


async def get_redis() -> AsyncGenerator[redis.Redis, None]:
    """
    Dependency for getting Redis connection.
    """
    async with redis.Redis(connection_pool=redis_pool) as redis_conn:
        yield redis_conn


# Elasticsearch client
es_client = AsyncElasticsearch(
    [f"{settings.ELASTICSEARCH_HOST}:{settings.ELASTICSEARCH_PORT}"]
)


async def get_elasticsearch() -> AsyncGenerator[AsyncElasticsearch, None]:
    """
    Dependency for getting Elasticsearch client.
    """
    try:
        yield es_client
    finally:
        await es_client.close()


class AuditLogger:
    """
    Audit logger for GDPR compliance.
    """
    def __init__(self, db: AsyncSession, retention_days: int = 180):
        self.db = db
        self.retention_days = retention_days
    
    async def log_action(
        self,
        user_id: int,
        action: str,
        resource_type: str,
        resource_id: int,
        previous_state: Optional[dict] = None,
        new_state: Optional[dict] = None,
        notes: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> None:
        """
        Log an action to the audit log.
        """
        from app.domain.models.audit_log import AuditLog
        from datetime import datetime
        
        audit_log = AuditLog(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            timestamp=datetime.utcnow(),
            previous_state=previous_state,
            new_state=new_state,
            notes=notes,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        
        self.db.add(audit_log)
        await self.db.commit()


async def get_audit_logger(db: AsyncSession = Depends(get_db)) -> AuditLogger:
    """
    Dependency for getting audit logger.
    """
    return AuditLogger(
        db=db,
        retention_days=settings.AUDIT_RETENTION
    )


# Repositories dependencies
async def get_current_user_with_permissions(
    current_user: User = Depends(get_current_active_user),
    required_role: str = "normal"
) -> User:
    """
    Dependency for checking user permissions.
    """
    if required_role == "admin" and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    return current_user