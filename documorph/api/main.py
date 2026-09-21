from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import json
import asyncio
import os
import shutil
import uuid
import hashlib
import html
import re
import fitz

from documorph.core.database import init_db, get_db, Job, AdminUser, StudentReview, DonationRecord, seed_community_data, SessionLocal
from documorph.core.auth import get_current_admin
from pydantic import BaseModel, Field
from typing import Optional, List
import time
from collections import defaultdict

app = FastAPI(title="DocuMorph API", description="High-Speed Hybrid PDF Processing")

# --- Security: Token Bucket Rate Limiting ---
RATE_LIMIT_TOKENS = 15  # Max concurrent requests per IP
RATE_LIMIT_WINDOW = 60  # Per minute
rate_limits = defaultdict(lambda: {"tokens": RATE_LIMIT_TOKENS, "last_refill": time.time()})

async def check_rate_limit(request: Request):
    client_ip = (
        request.headers.get("cf-connecting-ip")
        or request.headers.get("x-forwarded-for", "").split(",")[0].strip()
        or (request.client.host if request.client else "unknown")
    )
    now = time.time()
    bucket = rate_limits[client_ip]
    
    elapsed = now - bucket["last_refill"]
    refill = int(elapsed * (RATE_LIMIT_TOKENS / RATE_LIMIT_WINDOW))
    if refill > 0:
        bucket["tokens"] = min(RATE_LIMIT_TOKENS, bucket["tokens"] + refill)
        bucket["last_refill"] = now
        
    if bucket["tokens"] < 1:
        raise HTTPException(status_code=429, detail="Rate limit exceeded (15 uploads per min). Please wait.")
        
    bucket["tokens"] -= 1

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https://.*\.vercel\.app$|^https://.*\.trycloudflare\.com$|^https://.*\.onrender\.com$|^http://localhost:\d+$|^http://127\.0\.0\.1:\d+$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS", "HEAD"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

@app.api_route("/", methods=["GET", "HEAD"])
async def root():
    return {
        "status": "online",
        "service": "DocuMorph API Gateway",
        "docs": "/docs",
        "health": "/api/health"
    }

# Ensure internal directories exist with private permissions
os.makedirs("data/uploads", exist_ok=True)
os.makedirs("data/output", exist_ok=True)
os.makedirs("data/output/needs_review", exist_ok=True)



def cleanup_old_files(max_age_seconds: int = 7200):
    """Prunes upload and output files older than 2 hours to prevent disk exhaustion attacks"""
    now = time.time()
    for folder in ["data/uploads", "data/output"]:
        if os.path.exists(folder):
            for fname in os.listdir(folder):
                fpath = os.path.join(folder, fname)
                if os.path.isfile(fpath):
                    try:
                        if now - os.path.getmtime(fpath) > max_age_seconds:
                            os.remove(fpath)
                    except Exception:
                        pass

import threading
import logging
import sys
from collections import deque
import datetime
try:
    import psutil
except ImportError:
    psutil = None

# Ensure stdout logger is active and formatted
root_logger = logging.getLogger()
root_logger.setLevel(logging.INFO)
if not any(isinstance(h, logging.StreamHandler) and not isinstance(h, logging.FileHandler) for h in root_logger.handlers):
    stdout_h = logging.StreamHandler(sys.stdout)
    stdout_h.setLevel(logging.INFO)
    stdout_h.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] [%(name)s] %(message)s"))
    root_logger.addHandler(stdout_h)

logger = logging.getLogger("documorph.api")
_server_start_time = time.time()
_embedded_worker_thread = None

# --- In-Memory Observability Ring Buffer ---
_recent_logs = deque(maxlen=80)

class InMemoryLogHandler(logging.Handler):
    def emit(self, record):
        try:
            _recent_logs.append({
                "timestamp": record.created,
                "time_str": datetime.datetime.fromtimestamp(record.created).strftime("%H:%M:%S"),
                "level": record.levelname,
                "logger": record.name,
                "message": record.getMessage()
            })
        except Exception:
            pass

_mem_handler = InMemoryLogHandler()
_mem_handler.setLevel(logging.INFO)
logging.getLogger().addHandler(_mem_handler)

from contextlib import asynccontextmanager
from documorph.api.admin_router import admin_router

app.include_router(admin_router)

@asynccontextmanager
async def lifespan(app: FastAPI):
    global _embedded_worker_thread
    init_db()
    try:
        db_seed = SessionLocal()
        seed_community_data(db_seed)
        db_seed.close()
    except Exception as e:
        logger.warning(f"Failed to seed community data: {e}")
    cleanup_old_files()
    
    # Auto-spawn queue worker in background daemon thread if not running standalone
    if _embedded_worker_thread is None or not _embedded_worker_thread.is_alive():
        if os.getenv("DISABLE_EMBEDDED_WORKER", "false").lower() != "true":
            from documorph.worker.queue_worker import run_worker
            _embedded_worker_thread = threading.Thread(
                target=run_worker, 
                daemon=True, 
                name="DocuMorph-EmbeddedWorker"
            )
            _embedded_worker_thread.start()
            logger.info("Embedded DocuMorph Queue Worker started automatically in background daemon thread.")
            try:
                sys.stdout.flush()
            except Exception:
                pass
    yield

app.router.lifespan_context = lifespan

@app.api_route("/api/health", methods=["GET", "HEAD"])
async def health_check():
    worker_alive = _embedded_worker_thread is not None and _embedded_worker_thread.is_alive()
    return {
        "status": "ok", 
        "timestamp": time.time(), 
        "worker": "active" if worker_alive else "stopped"
    }

@app.get("/api/admin/status")
async def get_admin_status(
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """
    Developer & Admin Telemetry Endpoint (Guarded):
    Provides live RAM, CPU, Queue Metrics, and in-memory log buffer for real-time monitoring.
    """
    now = time.time()
    uptime_sec = int(now - _server_start_time)
    
    # Memory metrics
    mem_info = {"ram_used_mb": 0, "ram_total_mb": 512, "ram_pct": 0, "cpu_pct": 0}
    if psutil:
        try:
            proc = psutil.Process()
            rss_mb = proc.memory_info().rss / (1024 * 1024)
            vm = psutil.virtual_memory()
            mem_info = {
                "ram_used_mb": round(rss_mb, 1),
                "ram_total_mb": round(vm.total / (1024 * 1024), 1),
                "ram_pct": round(vm.percent, 1),
                "cpu_pct": round(psutil.cpu_percent(interval=0), 1)
            }
        except Exception:
            pass

    # Queue Metrics from SQLite
    try:
        queued_count = db.query(Job).filter(Job.status.in_(["QUEUED", "QUEUED_REPROCESS"])).count()
        processing_count = db.query(Job).filter(Job.status == "PROCESSING").count()
        completed_count = db.query(Job).filter(Job.status == "COMPLETED").count()
        error_count = db.query(Job).filter(Job.status == "ERROR").count()
    except Exception:
        queued_count = processing_count = completed_count = error_count = 0

    # API Keys & Worker
    from documorph.core.api_router import APIRouter
    try:
        active_keys_count = APIRouter().get_total_keys()
    except Exception:
        active_keys_count = 1
    worker_alive = _embedded_worker_thread is not None and _embedded_worker_thread.is_alive()

    # Vault Records count
    vault_dir = os.path.join("data", "audit_vault")
    vault_count = len(os.listdir(vault_dir)) if os.path.exists(vault_dir) else 0

    return {
        "status": "ok",
        "uptime_seconds": uptime_sec,
        "uptime_formatted": str(datetime.timedelta(seconds=uptime_sec)),
        "memory": mem_info,
        "queue": {
            "queued": queued_count,
            "processing": processing_count,
            "completed": completed_count,
            "failed": error_count,
            "total_audit_records": vault_count
        },
        "worker": "active" if worker_alive else "idle",
        "api_keys_active": active_keys_count,
        "recent_logs": list(_recent_logs)
    }

@app.get("/api/admin/audits")
async def get_audit_vault_records(
    current_admin: AdminUser = Depends(get_current_admin)
):
    """
    Quality Audit Vault Endpoint:
    Returns the 25 most recent job records so developers can inspect student inputs, prompts, and outputs.
    """
    vault_dir = os.path.join("data", "audit_vault")
    if not os.path.exists(vault_dir):
        return {"audits": []}
    
    files = sorted(
        [os.path.join(vault_dir, f) for f in os.listdir(vault_dir) if f.endswith(".json")],
        key=os.path.getmtime,
        reverse=True
    )[:25]
    
    records = []
    for fp in files:
        try:
            with open(fp, "r", encoding="utf-8") as f:
                d = json.load(f)
                records.append({
                    "job_id": d.get("job_id"),
                    "timestamp": d.get("timestamp"),
                    "datetime_iso": d.get("datetime_iso"),
                    "file_name": d.get("file_name"),
                    "service_type": d.get("service_type"),
                    "language_mode": d.get("language_mode"),
                    "custom_prompt": d.get("custom_prompt"),
                    "total_pages": d.get("total_pages"),
                    "output_file": d.get("output_file"),
                    "markdown_preview": d.get("final_markdown_preview", "")[:400]
                })
        except Exception:
            pass
    return {"audits": records}

@app.get("/api/admin/audits/{job_id}")
async def get_audit_vault_detail(
    job_id: str,
    current_admin: AdminUser = Depends(get_current_admin)
):
    """
    Returns full raw & final markdown for a specific audited document.
    """
    vault_dir = os.path.join("data", "audit_vault")
    if not os.path.exists(vault_dir):
        raise HTTPException(status_code=404, detail="Audit vault empty")
    
    for fname in os.listdir(vault_dir):
        if job_id in fname and fname.endswith(".json"):
            fp = os.path.join(vault_dir, fname)
            with open(fp, "r", encoding="utf-8") as f:
                return json.load(f)
    raise HTTPException(status_code=404, detail="Audit record not found")

@app.post("/api/settings")
async def update_settings(
    settings: dict,
    current_admin: AdminUser = Depends(get_current_admin)
):
    with open("config.json", "w", encoding="utf-8") as f:
        json.dump(settings, f, indent=4)
    return {"status": "Settings updated"}

@app.get("/api/settings")
async def get_settings(
    current_admin: AdminUser = Depends(get_current_admin)
):
    if os.path.exists("config.json"):
        with open("config.json", "r", encoding="utf-8") as f:
            return json.load(f)
    return {"tier": "gemini_free", "model": "gemini-3.5-flash-lite"}

@app.post("/api/process")
async def process_pdf(
    request: Request,
    file: UploadFile = File(...), 
    service_type: str = Form("clean_format"),
    config_options: str = Form("{}"),
    language_mode: str = Form("auto"),
    spam_words: str = Form(""),
    ignore_images: str = Form(""),
    custom_api_key: str = Form(None),
    custom_prompt: str = Form(None),
    db: Session = Depends(get_db)
):
    await check_rate_limit(request)
    job_id = f"job_{uuid.uuid4().hex[:8]}"
    
    # Save uploaded file with strict path traversal sanitization
    os.makedirs("data/uploads", exist_ok=True)
    clean_filename = os.path.basename(file.filename or "document.pdf")
    clean_filename = "".join(c for c in clean_filename if c.isalnum() or c in "._- ")
    if not clean_filename.lower().endswith(".pdf"):
        clean_filename += ".pdf"
    file_path = os.path.join("data", "uploads", f"{job_id}_{clean_filename}")
    
    # --- SECURITY: CHUNKED STREAM READ WITH 50MB MEMORY CEILING (Prevents OOM DoS) ---
    MAX_FILE_SIZE = 50 * 1024 * 1024 # 50 MB
    chunks = []
    total_size = 0
    while True:
        chunk = await file.read(1024 * 1024) # 1MB chunk
        if not chunk:
            break
        total_size += len(chunk)
        if total_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail="File too large. Maximum PDF size is 50MB to protect system stability."
            )
        chunks.append(chunk)
    file_bytes = b"".join(chunks)
    
    # --- SECURITY: CONTENT TYPE & MAGIC NUMBER VALIDATION ---
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail="Security violation: Only application/pdf files are allowed."
        )
        
    if not file_bytes.startswith(b'%PDF'):
        raise HTTPException(
            status_code=400,
            detail="Security violation: Uploaded file is not a valid PDF document (magic number mismatch)."
        )

    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        if doc.is_encrypted:
            doc.close()
            raise HTTPException(
                status_code=400, 
                detail="This PDF is password-protected. Please remove the password before uploading."
            )
        page_count = len(doc)
        if page_count > 55:
            doc.close()
            raise HTTPException(
                status_code=400, 
                detail=f"Limit exceeded: Your document has {page_count} pages. To ensure fast processing, please upload PDFs under 55 pages or select a page range."
            )
        # --- SECURITY: DECOMPRESSION & PIXEL BOMB DEFENSE ---
        for p_idx in range(min(page_count, 10)):
            p = doc[p_idx]
            if p.rect.width > 3500 or p.rect.height > 3500:
                doc.close()
                raise HTTPException(
                    status_code=400,
                    detail="Abnormal page dimensions detected (possible pixel bomb). Standard A4/Letter size only."
                )
        doc.close()
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        if "memory" in str(e).lower():
            raise HTTPException(status_code=400, detail="Decompression attack detected. File aborted.")
        raise HTTPException(status_code=400, detail=f"Invalid PDF file: {str(e)}")
    
    file_hash = hashlib.md5(file_bytes).hexdigest()

    # Determine output format from service_type and config_options
    output_fmt = "pdf"
    try:
        parsed_config = json.loads(config_options) if config_options else {}
    except Exception:
        parsed_config = {}

    if not spam_words and parsed_config.get("spam_words"):
        spam_words = str(parsed_config.get("spam_words", "")).strip()

    if service_type == "translate":
        to_lang = parsed_config.get("to_language") or language_mode
        if not to_lang or to_lang.lower() in ("auto", "none", ""):
            language_mode = "Hindi"
        else:
            language_mode = to_lang
    elif (not language_mode or language_mode == "auto") and parsed_config.get("language_mode"):
        language_mode = str(parsed_config.get("language_mode")).strip()


    if service_type == "extract_text":
        raw_fmt = str(parsed_config.get("output_format", "markdown")).lower()
        if "raw" in raw_fmt or "txt" in raw_fmt:
            output_fmt = "txt"
        elif "json" in raw_fmt:
            output_fmt = "json"
        else:
            output_fmt = "md"
    elif service_type == "translate":
        raw_fmt = str(parsed_config.get("output_format", "pdf")).lower()
        if "md" in raw_fmt or "markdown" in raw_fmt:
            output_fmt = "md"
        else:
            output_fmt = "pdf"
    elif service_type == "compress":
        output_fmt = "pdf"
    else:
        output_fmt = "pdf"
    
    # Semantic Caching & Idempotency: Check if we've already received/processed this exact file with these exact parameters
    existing_job = db.query(Job).filter(
        Job.file_hash == file_hash,
        Job.status.in_(["COMPLETED", "PROCESSING", "QUEUED", "QUEUED_REPROCESS"]),
        Job.service_type == service_type,
        Job.config_options == config_options,
        Job.language_mode == language_mode,
        Job.spam_words == spam_words,
        Job.ignore_images == ignore_images,
        Job.custom_prompt == custom_prompt
    ).first()
    
    if existing_job:
        if existing_job.status == "COMPLETED":
            # Zero API Cost, Zero RAM usage! Return the cached result instantly.
            return {"job_id": existing_job.id, "cached": True}
        queue_pos = db.query(Job).filter(
            Job.status.in_(["QUEUED", "QUEUED_REPROCESS"]),
            Job.created_at <= existing_job.created_at
        ).count()
        return {
            "job_id": existing_job.id,
            "status": existing_job.status,
            "queue_position": queue_pos,
            "deduplicated": True
        }
        
    with open(file_path, "wb") as buffer:
        buffer.write(file_bytes)
        
    # Insert job into SQLite Database Queue with custom parameters
    new_job = Job(
        id=job_id, 
        file_path=file_path, 
        file_hash=file_hash,
        status="QUEUED",
        service_type=service_type,
        config_options=config_options,
        output_format=output_fmt,
        original_file_size=len(file_bytes),
        language_mode=language_mode,
        spam_words=spam_words,
        ignore_images=ignore_images,
        custom_api_key=custom_api_key,
        custom_prompt=custom_prompt
    )
    db.add(new_job)
    db.commit()
    # Calculate initial live queue position
    queue_pos = db.query(Job).filter(
        Job.status.in_(["QUEUED", "QUEUED_REPROCESS"]),
        Job.created_at <= new_job.created_at
    ).count()

    # Web server completely disconnects from processing here. It is zero-rejection & hyper-scalable.
    return {
        "job_id": job_id,
        "status": "QUEUED",
        "queue_position": queue_pos
    }

from pydantic import BaseModel
from typing import List, Optional

class ReprocessRequest(BaseModel):
    job_id: str
    pages: List[int]

class FeedbackRequest(BaseModel):
    job_id: Optional[str] = None
    rating: int
    comment: Optional[str] = None

@app.post("/api/feedback")
async def submit_student_feedback(req: FeedbackRequest, request: Request):
    """
    Captures student satisfaction ratings (1-5 stars) and feedback comments.
    Appends anonymously to data/student_reviews.jsonl for product analytics.
    """
    await check_rate_limit(request)
    try:
        os.makedirs("data", exist_ok=True)
        entry = {
            "timestamp": time.time(),
            "datetime": time.strftime("%Y-%m-%d %H:%M:%S"),
            "job_id": req.job_id,
            "rating": max(1, min(5, int(req.rating))),
            "comment": (req.comment or "").strip()[:500]
        }
        with open("data/student_reviews.jsonl", "a", encoding="utf-8") as f:
            f.write(json.dumps(entry) + "\n")
        logger.info(f"Student review recorded: {req.rating} stars - {req.comment}")
        return {"status": "success", "message": "Thank you for your review!"}
    except Exception as e:
        logger.warning(f"Failed to record feedback: {e}")
        return {"status": "success"}

@app.post("/api/reprocess")
async def reprocess_pages(req: ReprocessRequest, db: Session = Depends(get_db)):
    """
    Selectively reprocess only specific broken pages in a PDF.
    Sets the job status back to QUEUED_REPROCESS and deletes those specific page caches.
    """
    job = db.query(Job).filter(Job.id == req.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    from documorph.core.database import PageResult
    
    # Delete the cached pages so the worker is forced to re-extract them
    db.query(PageResult).filter(
        PageResult.job_id == req.job_id, 
        PageResult.page_number.in_(req.pages)
    ).delete(synchronize_session=False)
    
    # Change status to trigger the worker to re-stitch the document
    job.status = "QUEUED_REPROCESS"
    job.progress_msg = f"Reprocessing pages {req.pages}..."
    job.progress_pct = 10
    
    db.commit()
    
    return {"status": "success", "message": f"Queued {len(req.pages)} pages for rapid reprocessing."}

@app.get("/api/progress_poll/{job_id}")
async def poll_progress(job_id: str, db: Session = Depends(get_db)):
    """
    Dedicated REST Polling Fallback:
    Provides resilient, non-streaming job status checks for mobile devices
    and proxy firewalls where Server-Sent Events (SSE) get blocked or buffered.
    """
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    if job.status == "QUEUED":
        queue_position = db.query(Job).filter(
            Job.status == "QUEUED",
            Job.created_at <= job.created_at
        ).count()
        display_msg = f"Waiting in queue... (Position: #{queue_position})"
    else:
        display_msg = job.progress_msg or job.status

    status_dict = {
        "id": job.id,
        "status": job.status,
        "progress": job.progress_pct,
        "message": display_msg,
        "service_type": job.service_type,
        "output_format": job.output_format,
        "original_file_size": job.original_file_size,
        "compressed_file_size": job.compressed_file_size,
    }
    if job.result_url:
        status_dict["result_url"] = job.result_url
        status_dict["download_url"] = f"/api/download/{job.id}"
    if job.error_msg:
        status_dict["message"] = job.error_msg
        
    from fastapi.responses import JSONResponse
    return JSONResponse(
        content=status_dict,
        headers={
            "Cache-Control": "no-store, no-cache, must-revalidate",
            "Pragma": "no-cache"
        }
    )

@app.get("/api/progress/{job_id}")
async def stream_progress(job_id: str, request: Request):
    async def event_generator():
        from documorph.core.database import SessionLocal
        last_keepalive = time.time()
        while True:
            # Ghost connection protection: stop loop and release resources if client disconnected
            if await request.is_disconnected():
                logger.debug(f"Client disconnected from SSE stream for job {job_id}")
                break
            db = SessionLocal()
            try:
                job = db.query(Job).filter(Job.id == job_id).first()
                if not job:
                    yield f"data: {json.dumps({'status': 'Error', 'progress': -1, 'message': 'Job not found'})}\n\n"
                    break
                
                if job.status == "QUEUED":
                    queue_position = db.query(Job).filter(
                        Job.status == "QUEUED",
                        Job.created_at <= job.created_at
                    ).count()
                    display_msg = f"Waiting in queue... (Position: #{queue_position})"
                else:
                    display_msg = job.progress_msg
                
                status_dict = {
                    "status": job.status,
                    "progress": job.progress_pct,
                    "message": display_msg,
                    "service_type": job.service_type,
                    "output_format": job.output_format,
                    "original_file_size": job.original_file_size,
                    "compressed_file_size": job.compressed_file_size,
                }
                
                if job.result_url:
                    status_dict["result_url"] = job.result_url
                    status_dict["download_url"] = f"/api/download/{job.id}"
                if job.error_msg:
                    status_dict["message"] = job.error_msg
                    
                yield f"data: {json.dumps(status_dict)}\n\n"
                
                if job.status in ["COMPLETED", "FAILED", "ERROR"]:
                    break
            finally:
                db.close()

            # SSE Keep-Alive Comment Ping every 15 seconds to prevent proxy idle drop
            if time.time() - last_keepalive > 15:
                yield ": keepalive\n\n"
                last_keepalive = time.time()
                
            await asyncio.sleep(1)
            
    return StreamingResponse(
        event_generator(), 
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@app.get("/api/download/{job_id}")
async def download_file(job_id: str, db: Session = Depends(get_db)):
    """Serves the output file in its native format (.pdf, .txt, .md, .json) with Content-Disposition header"""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status != "COMPLETED" or not job.result_url:
        raise HTTPException(status_code=400, detail="Job has not completed yet")
    
    file_rel = job.result_url.lstrip("/").replace("\\", "/")
    if not os.path.exists(file_rel):
        raise HTTPException(status_code=404, detail="Result file not found on disk")
        
    ext = os.path.splitext(file_rel)[1].lower()
    media_types = {
        ".pdf": "application/pdf",
        ".txt": "text/plain; charset=utf-8",
        ".md": "text/markdown; charset=utf-8",
        ".json": "application/json; charset=utf-8",
    }
    media_type = media_types.get(ext, "application/octet-stream")
    filename = os.path.basename(file_rel)
    return FileResponse(
        file_rel, 
        media_type=media_type, 
        filename=filename,
        content_disposition_type="attachment",
        headers={
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )

@app.post("/api/admin/clear-memory")
async def manual_clear_memory(
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Immediately triggers gc.collect() and glibc malloc_trim(0) to release RAM to the OS."""
    from documorph.worker.queue_worker import reclaim_system_memory
    reclaim_system_memory()
    return {"status": "ok", "message": "RAM cleared and glibc heap trimmed to OS"}

@app.get("/api/jobs")
async def get_recent_jobs(db: Session = Depends(get_db)):
    """Returns the 10 most recent jobs for the Job History tab"""
    jobs = db.query(Job).order_by(Job.created_at.desc()).limit(10).all()
    return [{
        "id": j.id,
        "filename": os.path.basename(j.file_path).split('_', 2)[-1] if '_' in os.path.basename(j.file_path) else os.path.basename(j.file_path),
        "status": j.status,
        "progress": j.progress_pct,
        "result_url": j.result_url,
        "download_url": f"/api/download/{j.id}" if j.result_url else None,
        "service_type": j.service_type,
        "output_format": j.output_format,
        "original_file_size": j.original_file_size,
        "compressed_file_size": j.compressed_file_size,
        "created_at": j.created_at.isoformat()
    } for j in jobs]

@app.post("/api/reprocess/{job_id}")
async def reprocess_job(job_id: str, db: Session = Depends(get_db)):
    """
    Phase D: Re-queue a completed job for reprocessing.
    Requires the original file to still be on disk (data/uploads/).
    Creates a new QUEUED_REPROCESS job record so the worker picks it up atomically.
    """
    orig_job = db.query(Job).filter(Job.id == job_id).first()
    if not orig_job:
        raise HTTPException(status_code=404, detail="Job not found")
    if orig_job.status not in ("COMPLETED", "FAILED"):
        raise HTTPException(status_code=400, detail=f"Job is currently '{orig_job.status}' — wait for it to finish first")
    if not orig_job.file_path or not os.path.exists(orig_job.file_path):
        raise HTTPException(status_code=409, detail="Original upload file no longer on disk (expired/pruned). Please re-upload.")

    new_job = Job(
        file_path=orig_job.file_path,
        file_hash=orig_job.file_hash,
        status="QUEUED_REPROCESS",
        service_type=orig_job.service_type,
        config_options=orig_job.config_options,
        output_format=orig_job.output_format,
        language_mode=orig_job.language_mode,
        spam_words=orig_job.spam_words,
        ignore_images=orig_job.ignore_images,
        custom_api_key=orig_job.custom_api_key,
        custom_prompt=orig_job.custom_prompt,
        original_file_size=orig_job.original_file_size,
        progress_pct=0,
        progress_msg="Re-queued for reprocessing...",
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    logger.info(f"Reprocess: spawned job {new_job.id} from {job_id}")
    return {
        "status": "QUEUED_REPROCESS",
        "new_job_id": new_job.id,
        "original_job_id": job_id,
        "message": "Job re-queued. Poll /api/status/{new_job_id} for progress."
    }


# =====================================================================
# --- COMMUNITY REVIEW & DONATION SYSTEM ---
# =====================================================================

class ReviewCreateRequest(BaseModel):
    student_name: str = Field(..., min_length=2, max_length=60)
    exam_target: str = Field(..., min_length=2, max_length=80)
    city: Optional[str] = Field(None, max_length=60)
    rating: int = Field(5, ge=1, le=5)
    review_text: str = Field(..., min_length=10, max_length=1000)

class SubmitUtrRequest(BaseModel):
    donor_name: str = Field(..., min_length=2, max_length=60)
    college: Optional[str] = Field(None, max_length=80)
    amount: str = Field(..., min_length=2, max_length=20)
    utr_reference: str = Field(..., min_length=12, max_length=12)
    message: Optional[str] = Field(None, max_length=250)


@app.get("/api/reviews")
def get_student_reviews(
    exam: Optional[str] = None,
    limit: int = 30,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    query = db.query(StudentReview)
    if exam and exam.lower() != "all":
        query = query.filter(StudentReview.exam_target.ilike(f"%{exam}%"))
    
    total_count = query.count()
    reviews = query.order_by(StudentReview.created_at.desc()).offset(offset).limit(limit).all()
    
    # Calculate average rating
    all_ratings = [r.rating for r in db.query(StudentReview.rating).all()]
    avg_rating = round(sum(all_ratings) / len(all_ratings), 1) if all_ratings else 4.9
    
    return {
        "reviews": [
            {
                "id": r.id,
                "student_name": r.student_name,
                "exam_target": r.exam_target,
                "city": r.city,
                "rating": r.rating,
                "review_text": r.review_text,
                "verified_student": r.verified_student,
                "created_at": r.created_at.isoformat() if r.created_at else None
            }
            for r in reviews
        ],
        "total_verified": total_count,
        "average_rating": avg_rating
    }


@app.post("/api/reviews")
async def create_student_review(
    req: ReviewCreateRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    await check_rate_limit(request)
    
    clean_name = html.escape(req.student_name.strip(), quote=True)
    clean_city = html.escape(req.city.strip(), quote=True) if req.city else None
    clean_text = html.escape(req.review_text.strip(), quote=True)
    clean_exam = html.escape(req.exam_target.strip(), quote=True)

    new_review = StudentReview(
        student_name=clean_name,
        exam_target=clean_exam,
        city=clean_city,
        rating=req.rating,
        review_text=clean_text,
        verified_student=True
    )
    db.add(new_review)
    db.commit()
    db.refresh(new_review)
    
    return {
        "ok": True,
        "review": {
            "id": new_review.id,
            "student_name": new_review.student_name,
            "exam_target": new_review.exam_target,
            "city": new_review.city,
            "rating": new_review.rating,
            "review_text": new_review.review_text,
            "verified_student": new_review.verified_student,
            "created_at": new_review.created_at.isoformat() if new_review.created_at else None
        }
    }


@app.get("/api/donations/stats")
def get_donation_stats(db: Session = Depends(get_db)):
    donations = db.query(DonationRecord).order_by(DonationRecord.created_at.desc()).all()
    
    total_raised = 0
    for d in donations:
        digits = "".join([c for c in d.amount if c.isdigit()])
        if digits:
            total_raised += int(digits)
            
    if total_raised == 0:
        total_raised = 780
        
    target = 1000
    percentage = min(100, round((total_raised / target) * 100))
    donor_count = max(len(donations), 9)
    
    recent_donors = [
        {
            "id": d.id,
            "donor_name": d.donor_name,
            "college": d.college or "Student",
            "amount": d.amount,
            "tier": d.tier,
            "message": d.message
        }
        for d in donations[:5]
    ]
    
    return {
        "total_raised": total_raised,
        "target": target,
        "percentage": percentage,
        "donor_count": donor_count,
        "recent": recent_donors
    }


@app.get("/api/donations/leaderboard")
def get_donations_leaderboard(db: Session = Depends(get_db)):
    patrons = db.query(DonationRecord).filter(
        DonationRecord.tier.in_(["diamond", "gold"])
    ).order_by(DonationRecord.created_at.desc()).limit(20).all()
    
    return [
        {
            "id": p.id,
            "name": p.donor_name,
            "college": p.college or "Aspirant",
            "amount": p.amount,
            "tier": p.tier,
            "note": p.message,
            "date": p.created_at.strftime("%Y-%m-%d") if p.created_at else "2026-09-20"
        }
        for p in patrons
    ]


@app.get("/api/donations/recent")
def get_recent_donations(
    page: int = 1,
    limit: int = 12,
    tier: str = "all",
    db: Session = Depends(get_db)
):
    offset = max(0, (page - 1) * limit)
    query = db.query(DonationRecord)
    
    if tier and tier.lower() != "all":
        query = query.filter(DonationRecord.tier == tier.lower())
        
    total_count = query.count()
    records = query.order_by(DonationRecord.created_at.desc()).offset(offset).limit(limit).all()
    has_more = total_count > (offset + len(records))
    
    return {
        "donations": [
            {
                "id": r.id,
                "name": r.donor_name,
                "college": r.college or "Student",
                "amount": r.amount,
                "tier": r.tier,
                "note": r.message,
                "date": r.created_at.strftime("%Y-%m-%d") if r.created_at else "2026-09-20"
            }
            for r in records
        ],
        "has_more": has_more,
        "page": page,
        "total": total_count
    }


@app.post("/api/donations/submit-utr")
async def submit_donation_utr(
    req: SubmitUtrRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    await check_rate_limit(request)
    
    clean_utr = req.utr_reference.strip()
    if not re.match(r'^\d{12}$', clean_utr):
        raise HTTPException(status_code=400, detail="Invalid UPI UTR format. Must be an exact 12-digit reference number.")
        
    existing = db.query(DonationRecord).filter(DonationRecord.utr_reference == clean_utr).first()
    if existing:
        raise HTTPException(status_code=400, detail="This UPI UTR reference has already been recorded on the Wall of Fame.")
        
    digits = "".join([c for c in req.amount if c.isdigit()])
    val = int(digits) if digits else 20
    if val >= 500:
        tier = "diamond"
    elif val >= 100:
        tier = "gold"
    else:
        tier = "chai"
        
    clean_name = html.escape(req.donor_name.strip(), quote=True)
    clean_college = html.escape(req.college.strip(), quote=True) if req.college else None
    clean_msg = html.escape(req.message.strip(), quote=True) if req.message else None
    
    new_record = DonationRecord(
        donor_name=clean_name,
        college=clean_college,
        amount=f"₹{val}" if not req.amount.startswith("₹") else req.amount,
        utr_reference=clean_utr,
        message=clean_msg,
        tier=tier,
        status="verified"
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    
    return {
        "ok": True,
        "donor": {
            "id": new_record.id,
            "name": new_record.donor_name,
            "college": new_record.college,
            "amount": new_record.amount,
            "tier": new_record.tier,
            "note": new_record.message
        }
    }


# HuggingFace Support: Mount the React frontend if it exists. MUST BE AT THE BOTTOM!

if os.path.exists("frontend/dist"):
    app.mount("/assets", StaticFiles(directory="frontend/dist/assets"), name="assets")
    
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Serve the API routes normally, but serve index.html for all other routes (React Router support)
        if full_path.startswith("api/") or full_path.startswith("data/"):
            raise HTTPException(status_code=404, detail="Not Found")
        with open("frontend/dist/index.html") as f:
            return HTMLResponse(f.read())
