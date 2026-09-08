import time
import os
import logging
from documorph.worker.pipeline import process_pdf_job
from documorph.core.database import get_db_session, Job

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("GitHubPoller")

def run_warm_poller(timeout_minutes=5):
    """
    Runs inside the GitHub Action runner.
    Processes jobs and STAYS AWAKE for `timeout_minutes` to process new jobs instantly,
    eliminating the 15-second GitHub Action cold start for subsequent users.
    """
    logger.info("GitHub Action Runner Booted. Entering Warm Polling Mode.")
    
    timeout_seconds = timeout_minutes * 60
    idle_time = 0
    poll_interval = 5  # Check database every 5 seconds
    
    db = get_db_session()
    
    try:
        while idle_time < timeout_seconds:
            # Look for a QUEUED job in the cloud database
            job = db.query(Job).filter(Job.status == "QUEUED").first()
            
            if job:
                logger.info(f"Found Job {job.id}. Processing instantly (0s Cold Start).")
                idle_time = 0 # Reset idle timer
                
                try:
                    process_pdf_job(job.id, db)
                except Exception as e:
                    logger.error(f"Job {job.id} failed: {e}")
            else:
                # No jobs found. Wait and increment idle time.
                time.sleep(poll_interval)
                idle_time += poll_interval
                
                if idle_time % 60 == 0:
                    logger.info(f"Runner idle for {idle_time//60} minutes. Shutting down in {(timeout_seconds - idle_time)//60} minutes.")
                    
    finally:
        db.close()
        logger.info("Warm Poller timed out. Shutting down VM gracefully.")

if __name__ == "__main__":
    # Ensure this environment has cloud database access before running
    if not os.environ.get("DATABASE_URL"):
        logger.warning("No DATABASE_URL found. Ensure you are using Supabase/Neon for GitHub Actions.")
    run_warm_poller()
