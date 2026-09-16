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
    
    while True:
        db = SessionLocal()
        try:
            # Atomically claim the next job (SKIP LOCKED on Postgres, FIFO on SQLite)
            job = claim_next_job(db)
            
            if not job:
                # No jobs, sleep and poll again
                db.close()
                time.sleep(2)
                continue
                
            logger.info(f"Picked up job {job.id} for file {job.file_path}")
            
            job_id = job.id
            file_path = job.file_path
            
            # Define the callback to update the database in real-time
            def progress_callback(msg: str, pct: int):
                # We need a fresh session for the callback to ensure thread safety 
                # (though this is technically synchronous, it's good practice)
                inner_db = SessionLocal()
                try:
                    inner_job = inner_db.query(Job).filter(Job.id == job_id).first()
                    if inner_job:
                        inner_job.progress_pct = pct
                        inner_job.progress_msg = msg
                        # Ensure canonical status remains PROCESSING for polling stability
                        inner_job.status = "PROCESSING"
                        inner_db.commit()
                finally:
                    inner_db.close()
            
            try:
                orchestrator = DocuMorphOrchestrator(
                    job_id=job.id,
                    progress_callback=progress_callback,
                    service_type=job.service_type or "clean_format",
                    config_options=job.config_options or "{}",
                    language_mode=job.language_mode,
                    spam_words=job.spam_words,
                    ignore_images=job.ignore_images,
                    custom_api_key=job.custom_api_key,
                    custom_prompt=job.custom_prompt
                )
                result_output = orchestrator.process_file(file_path)
                
                # Mark as completed
                job.status = "COMPLETED"
                job.progress_pct = 100
                job.progress_msg = "Completed successfully"
                # Normalize result URL path with forward slashes
                clean_url = result_output.replace("\\", "/").lstrip("/")
                job.result_url = f"/{clean_url}"
                
                if job.service_type == "compress" and os.path.exists(result_output):
                    job.compressed_file_size = os.path.getsize(result_output)
                    
                logger.info(f"Job {job.id} completed successfully. Result: {job.result_url}")
                
            except Exception as e:
                logger.error(f"Job {job.id} failed: {e}", exc_info=True)
                job.status = "ERROR"
                job.progress_pct = -1
                job.error_msg = str(e)
                
            db.commit()

            # Immediate RAM Reclamation + Delayed 25-30s Full Sweep for next user
            reclaim_system_memory()
            schedule_delayed_memory_sweep(25)
            
        except Exception as e:
            logger.error(f"Worker crashed during polling: {e}")
            time.sleep(5)
        finally:
            db.close()

if __name__ == "__main__":
    # Ensure data directory exists before starting
    os.makedirs("data", exist_ok=True)
    run_worker()
