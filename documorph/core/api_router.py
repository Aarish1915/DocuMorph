import os
import socket
import logging
from typing import List

# Force IPv4 resolution to prevent Windows IPv6 routing drops/timeouts
_orig_getaddrinfo = socket.getaddrinfo
def _ipv4_getaddrinfo(*args, **kwargs):
    res = _orig_getaddrinfo(*args, **kwargs)
    return [r for r in res if r[0] == socket.AF_INET] or res
socket.getaddrinfo = _ipv4_getaddrinfo

logger = logging.getLogger(__name__)

class APIRouter:
    """
    Manages API Keys in a Round-Robin fashion to bypass Free Tier rate limits.
    """
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(APIRouter, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        import threading
        self.lock = threading.Lock()
        self.keys: List[str] = []
        self.current_index = 0
        
        try:
            from dotenv import load_dotenv
            load_dotenv(override=True)
        except Exception:
            pass

        def is_valid_key(k: str) -> bool:
            if not k or len(k.strip()) < 20:
                return False
            k_lower = k.strip().lower()
            if "your" in k_lower or "placeholder" in k_lower or "example" in k_lower:
                return False
            return True
        
        # Load primary key
        primary_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if primary_key and is_valid_key(primary_key):
            self.keys.append(primary_key.strip())
            
        # Scan for GEMINI_API_KEY2, GEMINI_API_KEY3, etc.
        for key, value in os.environ.items():
            if key.startswith("GEMINI_API_KEY") and key != "GEMINI_API_KEY" and key != "GEMINI_API_KEYS":
                if value and is_valid_key(value) and value.strip() not in self.keys:
                    self.keys.append(value.strip())
            
        # Load multiple keys if provided (comma-separated) in GEMINI_API_KEYS
        multiple_keys = os.getenv("GEMINI_API_KEYS")
        if multiple_keys:
            additional_keys = [k.strip() for k in multiple_keys.split(",") if is_valid_key(k)]
            for k in additional_keys:
                if k not in self.keys:
                    self.keys.append(k)
                    
        self.key_history: dict = {}
        if not self.keys:
            logger.warning("No API Keys found in environment variables!")
        else:
            logger.info(f"APIRouter initialized with {len(self.keys)} API Keys for Round-Robin load balancing.")
            for k in self.keys:
                self.key_history[k] = []

    def get_next_key(self) -> str:
        """
        Returns the optimal API key, pacing requests to strictly stay below Free Tier RPM limits.
        If all keys are saturated, cleanly sleeps the required interval to prevent HTTP 429 drops.
        """
        if not self.keys:
            return None

        import time
        from documorph.core.tier_manager import TierManager
        tier_profile = TierManager().get_profile()
        is_free_tier = TierManager().active_tier == "gemini_free"
        max_rpm = 14 if is_free_tier else 1000

        with self.lock:
            now = time.time()
            
            # Prune timestamps older than 60 seconds
            for k in self.keys:
                self.key_history[k] = [t for t in self.key_history.get(k, []) if now - t < 60.0]

            # Pick the least-used key
            best_key = min(self.keys, key=lambda k: len(self.key_history.get(k, [])))
            usage = len(self.key_history.get(best_key, []))

            # If even the least-used key has reached max_rpm in the last 60 seconds:
            if usage >= max_rpm:
                oldest_call = min(self.key_history[best_key])
                wait_time = max(0.1, 60.0 - (now - oldest_call) + 0.1)
                logger.info(f"RateLimitShield: All API keys reached {max_rpm} RPM. Pacing request for {wait_time:.2f}s...")
                time.sleep(wait_time)
                now = time.time()
                self.key_history[best_key] = [t for t in self.key_history.get(best_key, []) if now - t < 60.0]

            self.key_history[best_key].append(now)
            return best_key

    def get_total_keys(self) -> int:
        return len(self.keys)
