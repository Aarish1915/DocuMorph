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
import fitz

from documorph.core.database import init_db, get_db, Job
import time
from collections import defaultdict

app = FastAPI(title="DocuMorph API", description="High-Speed Hybrid PDF Processing")

# --- Security: Token Bucket Rate Limiting ---
RATE_LIMIT_TOKENS = 15  # Max concurrent requests per IP
RATE_LIMIT_WINDOW = 60  # Per minute
rate_limits = defaultdict(lambda: {"tokens": RATE_LIMIT_TOKENS, "last_refill": time.time()})

async def check_rate_limit(request: Request):
    client_ip = request.client.host
    now = time.time()
    bucket = rate_limits[client_ip]
    
    elapsed = now - bucket["last_refill"]
    refill = int(elapsed * (RATE_LIMIT_TOKENS / RATE_LIMIT_WINDOW))
    if refill > 0:
        bucket["tokens"] = min(RATE_LIMIT_TOKENS, bucket["tokens"] + refill)
        bucket["last_refill"] = now
        
    if bucket["tokens"] < 1:
        raise HTTPException(status_code=429, detail="Rate limit exceeded (15 per min). Please wait.")
        
    bucket["tokens"] -= 1

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https://.*\.vercel\.app$|^https://.*\.trycloudflare\.com$|^http://localhost:\d+$|^http://127\.0\.0\.1:\d+$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

@app.get("/")
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

@app.on_event("startup")
def on_startup():
    init_db()
    cleanup_old_files()

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "timestamp": time.time(), "worker": "active"}

@app.post("/api/settings")
async def update_settings(settings: dict):
    with open("config.json", "w", encoding="utf-8") as f:
        json.dump(settings, f, indent=4)
    return {"status": "Settings updated"}

@app.get("/api/settings")
async def get_settings():
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
    job_id = f"job_{uuid.uuid4().hex[:8]}"
    
    # Save uploaded file with strict path traversal sanitization
    os.makedirs("data/uploads", exist_ok=True)
    clean_filename = os.path.basename(file.filename or "document.pdf")
    clean_filename = "".join(c for c in clean_filename if c.isalnum() or c in "._- ")
    if not clean_filename.lower().endswith(".pdf"):
        clean_filename += ".pdf"
    file_path = os.path.join("data", "uploads", f"{job_id}_{clean_filename}")
    
    file_bytes = await file.read()
    
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
    
    # --- SECURITY: HARD SIZE LIMIT ---
    MAX_FILE_SIZE = 50 * 1024 * 1024 # 50 MB
    
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Please upload PDFs under 50MB to prevent server memory exhaustion."
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
        doc.close()
        if page_count > 55:
            raise HTTPException(
                status_code=400, 
                detail=f"Limit exceeded: Your document has {page_count} pages. To ensure fast processing, please upload PDFs under 55 pages or select a page range."
            )
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

    if (not language_mode or language_mode == "auto") and parsed_config.get("language_mode"):
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
    
    # Semantic Caching: Check if we've processed this exact file with these exact parameters
    existing_job = db.query(Job).filter(
        Job.file_hash == file_hash,
        Job.status == "COMPLETED",
        Job.service_type == service_type,
        Job.config_options == config_options,
        Job.language_mode == language_mode,
        Job.spam_words == spam_words,
        Job.ignore_images == ignore_images,
        Job.custom_prompt == custom_prompt
    ).first()
    
    if existing_job:
        # Zero API Cost, Zero RAM usage! Return the cached result instantly.
        return {"job_id": existing_job.id, "cached": True}
        
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
from typing import List

class ReprocessRequest(BaseModel):
    job_id: str
    pages: List[int]

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

@app.get("/api/progress/{job_id}")
async def stream_progress(job_id: str):
    async def event_generator():
        # Using a distinct session for the generator loop to avoid cross-thread issues
        from documorph.core.database import SessionLocal
        while True:
            db = SessionLocal()
            try:
                job = db.query(Job).filter(Job.id == job_id).first()
                if not job:
                    yield f"data: {json.dumps({'status': 'Error', 'progress': -1, 'message': 'Job not found'})}\n\n"
                    break
                
                if job.status == "QUEUED":
                    # Calculate live queue position
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
                
            await asyncio.sleep(1)
            
    return StreamingResponse(event_generator(), media_type="text/event-stream")

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
    return FileResponse(file_rel, media_type=media_type, filename=filename)

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
