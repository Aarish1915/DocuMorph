import time
import logging
import sys
import os
import threading
import gc

from documorph.core.database import SessionLocal, Job, claim_next_job
from documorph.worker.pipeline import DocuMorphOrchestrator

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("queue_worker")

def reclaim_system_memory():
    """Forces immediate Python garbage collection and trims glibc arenas back to the OS."""
    try:
        gc.collect()
        try:
            import ctypes
            libc = ctypes.CDLL("libc.so.6")
            libc.malloc_trim(0)
        except Exception:
            pass
        logger.info("RAM Reclamation: gc.collect() & malloc_trim(0) successfully executed.")
    except Exception as ex:
        logger.debug(f"Memory reclamation notice: {ex}")

def schedule_delayed_memory_sweep(delay_seconds: int = 25):
    """Secondary memory sweep after 25-30 seconds ensuring next user receives full container RAM."""
    def _sweep():
        time.sleep(delay_seconds)
        reclaim_system_memory()
        logger.info("Delayed 30s RAM Sweep completed. 100% free memory ready for next user.")
    
    threading.Thread(target=_sweep, daemon=True, name="DocuMorph-RAM-Sweeper").start()

def run_worker():
    logger.info("DocuMorph Worker started. Polling database queue for jobs...")
    
    # Startup Recovery: Reset any orphaned jobs left in PROCESSING from prior container restarts
    try:
        with SessionLocal() as boot_db:
            stuck_jobs = boot_db.query(Job).filter(Job.status == "PROCESSING").all()
            if stuck_jobs:
                logger.warning(f"Worker startup: Found {len(stuck_jobs)} zombie jobs in PROCESSING. Resetting to FAILED.")
                for sj in stuck_jobs:
                    sj.status = "FAILED"
                    sj.error_msg = "Server instance recycled or container restarted during processing. Please re-run."
                    sj.progress_pct = -1
                boot_db.commit()
    except Exception as boot_err:
        logger.warning(f"Could not reset zombie jobs on startup: {boot_err}")
    
    while True:
        try:
            # 1. Atomically claim next job in short-lived session
            job_id = None
            file_path = None
            service_type = "clean_format"
            config_options = "{}"
            language_mode = None
            spam_words = None
            ignore_images = False
            custom_api_key = None
            custom_prompt = None

            with SessionLocal() as db:
                job = claim_next_job(db)
                if not job:
                    time.sleep(2)
                    continue
                    
                job_id = job.id
                file_path = job.file_path
                service_type = job.service_type or "clean_format"
                config_options = job.config_options or "{}"
                language_mode = job.language_mode
                spam_words = job.spam_words
                ignore_images = job.ignore_images
                custom_api_key = job.custom_api_key
                custom_prompt = job.custom_prompt
                logger.info(f"Picked up job {job_id} for file {file_path}")
            
            # Throttled progress callback: avoids slamming remote Neon PostgreSQL with dozens of TCP commits
            last_progress_time = 0.0
            last_progress_pct = -1

            def progress_callback(msg: str, pct: int):
                nonlocal last_progress_time, last_progress_pct
                now = time.time()
                is_terminal = pct == 100 or pct == -1
                is_milestone = pct in (65, 70, 80, 86, 90, 95)
                is_significant = ((abs(pct - last_progress_pct) >= 3 and (now - last_progress_time >= 1.2)) or is_milestone)
                if is_terminal or is_significant or last_progress_pct == -1:
                    last_progress_time = now
                    # Enforce strict monotonicity: progress must never drop backwards
                    if pct > last_progress_pct or is_terminal:
                        last_progress_pct = pct
                        try:
                            with SessionLocal() as inner_db:
                                inner_job = inner_db.query(Job).filter(Job.id == job_id).first()
                                if inner_job:
                                    inner_job.progress_pct = pct
                                    inner_job.progress_msg = msg
                                    inner_job.status = "PROCESSING"
                                    inner_db.commit()
                        except Exception as cb_err:
                            logger.warning(f"Could not persist progress callback for job {job_id}: {cb_err}")
            
            # 2. Execute pipeline decoupled from any open DB connection
            success = False
            result_output = None
            error_message = None

            try:
                orchestrator = DocuMorphOrchestrator(
                    job_id=job_id,
                    progress_callback=progress_callback,
                    service_type=service_type,
                    config_options=config_options,
                    language_mode=language_mode,
                    spam_words=spam_words,
                    ignore_images=ignore_images,
                    custom_api_key=custom_api_key,
                    custom_prompt=custom_prompt
                )
                result_output = orchestrator.process_file(file_path)
                success = True
            except Exception as e:
                logger.error(f"Job {job_id} failed: {e}", exc_info=True)
                error_message = str(e)
            
            # 3. Record final state in fresh short-lived session
            with SessionLocal() as finish_db:
                fin_job = finish_db.query(Job).filter(Job.id == job_id).first()
                if fin_job:
                    if success and result_output:
                        fin_job.status = "COMPLETED"
                        fin_job.progress_pct = 100
                        fin_job.progress_msg = "Completed successfully"
                        clean_url = result_output.replace("\\", "/").lstrip("/")
                        fin_job.result_url = f"/{clean_url}"
                        if fin_job.service_type == "compress" and os.path.exists(result_output):
                            fin_job.compressed_file_size = os.path.getsize(result_output)
                        logger.info(f"Job {job_id} completed successfully. Result: {fin_job.result_url}")
                    else:
                        fin_job.status = "ERROR"
                        fin_job.progress_pct = -1
                        fin_job.error_msg = error_message or "Unknown processing error"
                    finish_db.commit()

            # Immediate RAM Reclamation + Delayed 25-30s Full Sweep for next user
            reclaim_system_memory()
            schedule_delayed_memory_sweep(25)
            
        except Exception as e:
            logger.error(f"Worker crashed during polling: {e}")
            time.sleep(5)

if __name__ == "__main__":
    # Ensure data directory exists before starting
    os.makedirs("data", exist_ok=True)
    run_worker()
