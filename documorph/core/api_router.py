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
                    
        if not self.keys:
            logger.warning("No API Keys found in environment variables!")
        else:
            logger.info(f"APIRouter initialized with {len(self.keys)} API Keys for Round-Robin load balancing.")

    def get_next_key(self) -> str:
        """
        Returns the next API key in the rotation.
        """
        if not self.keys:
            return None
            
        with self.lock:
            key = self.keys[self.current_index]
            self.current_index = (self.current_index + 1) % len(self.keys)
        return key

    def get_total_keys(self) -> int:
        return len(self.keys)
