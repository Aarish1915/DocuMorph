"""
DocuMorph Internal Admin & Observability API Router.
Guarded by cryptographic bcrypt authentication and signed JWT tokens.
Provides system metrics, queue telemetry, memory reclamation, and audit logs.
"""

import time
import os
import psutil
import logging
from typing import Dict, Any, List, Optional
from collections import defaultdict
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from documorph.core.database import get_db, Job, AdminUser, engine, utc_now
from documorph.core.auth import (
    verify_password,
    create_access_token,
    get_current_admin,
    DEFAULT_ADMIN_USER,
    DEFAULT_HASH
)
from documorph.core.storage import get_storage
from documorph.worker.queue_worker import reclaim_system_memory

logger = logging.getLogger("documorph.api.admin")
admin_router = APIRouter(prefix="/api/internal", tags=["Internal Admin"])

# Simple IP-based rate limiter for login attempts (max 5 failed attempts per 60s)
_failed_login_attempts: Dict[str, List[float]] = defaultdict(list)
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_WINDOW_SECONDS = 60


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    username: str


@admin_router.post("/admin-auth/login", response_model=LoginResponse)
def admin_login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    """
    Authenticates the system owner/admin with rate limiting and constant-time bcrypt verification.
    """
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    
    # 1. Check rate limit
    recent_failures = [t for t in _failed_login_attempts[client_ip] if now - t < LOCKOUT_WINDOW_SECONDS]
    _failed_login_attempts[client_ip] = recent_failures
    if len(recent_failures) >= MAX_FAILED_ATTEMPTS:
        logger.warning(f"Admin login brute force lockout triggered for IP {client_ip}")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many failed login attempts. Please wait 60 seconds."
        )

    # 2. Check credentials in DB or fallback to environment config
    admin_user = db.query(AdminUser).filter(AdminUser.username == payload.username).first()
    is_valid = False
    role = "owner"

    if admin_user:
        is_valid = verify_password(payload.password, admin_user.hashed_password)
        role = admin_user.role
    elif payload.username == DEFAULT_ADMIN_USER:
        is_valid = verify_password(payload.password, DEFAULT_HASH)

    if not is_valid:
        _failed_login_attempts[client_ip].append(now)
        logger.warning(f"Failed admin login attempt for user '{payload.username}' from IP {client_ip}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid administrative username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Reset failure counter on success
    _failed_login_attempts[client_ip] = []
    
    if admin_user:
        admin_user.last_login_at = utc_now()
        db.commit()

    token = create_access_token(data={"sub": payload.username, "role": role})
    logger.info(f"Successful admin login for '{payload.username}' from IP {client_ip}")
    return LoginResponse(
        access_token=token,
        token_type="bearer",
        role=role,
        username=payload.username
    )


@admin_router.get("/admin/status")
def get_system_status(
    admin: Dict[str, Any] = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Returns live system metrics: RAM usage, CPU percent, active queue counts, and database dialect.
    """
    process = psutil.Process(os.getpid())
    memory_info = process.memory_info()
    ram_mb = round(memory_info.rss / (1024 * 1024), 1)
    cpu_pct = psutil.cpu_percent(interval=0.1)

    queued_count = db.query(Job).filter(Job.status.in_(["QUEUED", "QUEUED_REPROCESS"])).count()
    processing_count = db.query(Job).filter(Job.status == "PROCESSING").count()
    completed_today = db.query(Job).filter(Job.status == "COMPLETED").count()
    failed_count = db.query(Job).filter(Job.status == "FAILED").count()

    storage = get_storage()
    storage_type = storage.__class__.__name__

    return {
        "status": "healthy",
        "timestamp": utc_now().isoformat(),
        "admin_user": admin.get("sub"),
        "metrics": {
            "ram_rss_mb": ram_mb,
            "cpu_percent": cpu_pct,
            "system_total_ram_mb": round(psutil.virtual_memory().total / (1024 * 1024), 1),
            "system_free_ram_mb": round(psutil.virtual_memory().available / (1024 * 1024), 1)
        },
        "queue": {
            "queued": queued_count,
            "processing": processing_count,
            "completed": completed_today,
            "failed": failed_count
        },
        "infrastructure": {
            "database_engine": engine.dialect.name,
            "storage_backend": storage_type
        }
    }


@admin_router.get("/admin/jobs")
def list_admin_jobs(
    limit: int = 50,
    admin: Dict[str, Any] = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Returns recent jobs with metadata, execution progress, and file stats.
    """
    jobs = db.query(Job).order_by(Job.created_at.desc()).limit(limit).all()
    return [
        {
            "id": j.id,
            "file_path": os.path.basename(j.file_path),
            "status": j.status,
            "progress_pct": j.progress_pct,
            "progress_msg": j.progress_msg,
            "service_type": j.service_type,
            "language_mode": j.language_mode,
            "original_size": j.original_file_size,
            "compressed_size": j.compressed_file_size,
            "created_at": j.created_at.isoformat() if j.created_at else None,
            "updated_at": j.updated_at.isoformat() if j.updated_at else None,
            "result_url": j.result_url
        }
        for j in jobs
    ]


@admin_router.post("/admin/reclaim-ram")
def trigger_ram_sweep(admin: Dict[str, Any] = Depends(get_current_admin)):
    """
    Manually triggers immediate garbage collection and Linux glibc malloc_trim.
    """
    before_mb = round(psutil.Process(os.getpid()).memory_info().rss / (1024 * 1024), 1)
    reclaim_system_memory()
    after_mb = round(psutil.Process(os.getpid()).memory_info().rss / (1024 * 1024), 1)

    logger.info(f"Admin {admin.get('sub')} triggered RAM sweep. Before: {before_mb}MB, After: {after_mb}MB")
    return {
        "status": "success",
        "before_mb": before_mb,
        "after_mb": after_mb,
        "freed_mb": round(before_mb - after_mb, 1)
    }
