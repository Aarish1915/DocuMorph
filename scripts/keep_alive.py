import time
import sys
import logging
import requests

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger("DocuMorphKeepAlive")

DEFAULT_URL = "https://documorph-backend.onrender.com/api/health"
PING_INTERVAL_SECONDS = 600  # Ping every 10 minutes (Render sleeps at 15 minutes)

def keep_alive(target_url: str):
    logger.info(f"Starting DocuMorph 24/7 Keep-Alive Pinger...")
    logger.info(f"Target URL: {target_url}")
    logger.info(f"Ping interval: {PING_INTERVAL_SECONDS}s (10 minutes)\n")
    
    consecutive_failures = 0
    
    while True:
        try:
            start_t = time.time()
            res = requests.get(target_url, timeout=30)
            elapsed_ms = int((time.time() - start_t) * 1000)
            
            if res.status_code == 200:
                consecutive_failures = 0
                logger.info(f"✓ Health Check OK | Status: 200 | Latency: {elapsed_ms}ms | Server Warm")
            else:
                consecutive_failures += 1
                logger.warning(f"⚠ Server responded with status {res.status_code} in {elapsed_ms}ms (Failures: {consecutive_failures})")
        except requests.exceptions.Timeout:
            consecutive_failures += 1
            logger.error(f"✗ Timeout (30s): Render instance may be cold booting... (Failures: {consecutive_failures})")
        except requests.exceptions.RequestException as e:
            consecutive_failures += 1
            logger.error(f"✗ Network error connecting to {target_url}: {e}")
            
        time.sleep(PING_INTERVAL_SECONDS)

if __name__ == "__main__":
    url = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_URL
    keep_alive(url)
