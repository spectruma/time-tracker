# backend/app/main.py
from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
from elasticsearch import AsyncElasticsearch
import redis.asyncio as redis
import time
from starlette.middleware.base import BaseHTTPMiddleware
from contextlib import asynccontextmanager

from app.api.v1.router import api_router
from app.core.config import settings
from app.api.deps import es_client, redis_pool


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


# Rate limiting middleware
class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Get client IP
        client_ip = request.client.host
        
        # Connect to Redis
        async with redis.Redis(connection_pool=redis_pool) as redis_conn:
            # Create a rate limit key with the client IP and current minute
            minute = int(time.time() / 60)
            rate_limit_key = f"rate_limit:{client_ip}:{minute}"
            
            # Increment the request count for this IP and minute
            request_count = await redis_conn.incr(rate_limit_key)
            
            # Set the key to expire after 1 minute if it's new
            if request_count == 1:
                await redis_conn.expire(rate_limit_key, 60)
            
            # Check if the request count exceeds the limit (100 requests per minute)
            if request_count > 100:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Too many requests. Please try again later."},
                )
        
        # Process the request
        response = await call_next(request)
        return response


# Startup and shutdown event handlers
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup event
    logger.info("Starting up application")
    
    # Set up OpenTelemetry for distributed tracing
    # This would be the place to initialize OpenTelemetry
    
    # Yield control back to FastAPI
    yield
    
    # Shutdown event
    logger.info("Shutting down application")
    
    # Close Elasticsearch connection
    await es_client.close()
    
    # Close Redis connection pool
    await redis_pool.disconnect()


# Create FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# Set up CORS middleware
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Add rate limiting middleware
app.add_middleware(RateLimitMiddleware)

# Add response headers middleware for security
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# Request ID middleware for tracing
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    import uuid
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    
    # Store the request ID in the logging context
    logger_context = {"request_id": request_id}
    logger.info(f"Processing request {request.method} {request.url}", extra=logger_context)
    
    # Process the request
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    # Add the request ID to the response headers
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time"] = str(process_time)
    
    logger.info(
        f"Request {request.method} {request.url} completed in {process_time:.3f}s",
        extra=logger_context,
    )
    
    return response

# Include API routes
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", include_in_schema=False)
async def root():
    """
    Root endpoint for health checks.
    """
    return {"message": "Time Tracker API is running", "version": "1.0.0"}


@app.get("/health", include_in_schema=False)
async def health_check():
    """
    Health check endpoint.
    """
    health = {
        "status": "healthy",
        "api": True,
        "database": False,
        "cache": False,
        "search": False,
    }
    
    # Check database connection
    try:
        from sqlalchemy import text
        from app.adapters.persistence.database import AsyncSessionLocal
        
        async with AsyncSessionLocal() as session:
            result = await session.execute(text("SELECT 1"))
            if result.scalar() == 1:
                health["database"] = True
    except Exception as e:
        logger.error(f"Database health check failed: {str(e)}")
        health["status"] = "unhealthy"
    
    # Check Redis connection
    try:
        async with redis.Redis(connection_pool=redis_pool) as redis_conn:
            pong = await redis_conn.ping()
            if pong:
                health["cache"] = True
    except Exception as e:
        logger.error(f"Redis health check failed: {str(e)}")
        health["status"] = "unhealthy"
    
    # Check Elasticsearch connection
    try:
        es_health = await es_client.cluster.health()
        if es_health["status"] in ["green", "yellow"]:
            health["search"] = True
    except Exception as e:
        logger.error(f"Elasticsearch health check failed: {str(e)}")
        health["status"] = "unhealthy"
    
    # Set status code based on health
    status_code = 200 if health["status"] == "healthy" else 503
    
    return JSONResponse(content=health, status_code=status_code)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Global exception handler to catch unhandled exceptions.
    """
    import traceback
    
    logger.error(
        f"Unhandled exception: {str(exc)}",
        extra={
            "request_id": getattr(request.state, "request_id", "unknown"),
            "path": request.url.path,
            "method": request.method,
            "traceback": traceback.format_exc(),
        },
    )
    
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An unexpected error occurred. Please try again later.",
            "request_id": getattr(request.state, "request_id", "unknown"),
        },
    )


if __name__ == "__main__":
    import uvicorn
    
    # Start the application with Uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )