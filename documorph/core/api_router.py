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
        Returns the optimal API key for round-robin balancing.
        Non-blocking: records key usage and returns the least-used key.
        Call get_rate_wait_seconds() to handle async pacing if needed.
        """
        if not self.keys:
            return None

        import time

        with self.lock:
            now = time.time()
            
            # Prune timestamps older than 60 seconds
            for k in self.keys:
                self.key_history[k] = [t for t in self.key_history.get(k, []) if now - t < 60.0]

            # Pick the least-used key
            best_key = min(self.keys, key=lambda k: len(self.key_history.get(k, [])))
            self.key_history[best_key].append(now)
            return best_key

    def get_rate_wait_seconds(self, key: str = None) -> float:
        """
        Returns seconds to wait before executing an API call with this key.
        Non-blocking check; caller is responsible for awaiting asyncio.sleep().
        """
        if not self.keys:
            return 0.0

        import time
        from documorph.core.tier_manager import TierManager
        is_free_tier = TierManager().active_tier == "gemini_free"
        max_rpm = 14 if is_free_tier else 1000

        with self.lock:
            now = time.time()
            target_key = key if (key and key in self.keys) else min(self.keys, key=lambda k: len(self.key_history.get(k, [])))
            # Prune timestamps older than 60 seconds
            self.key_history[target_key] = [t for t in self.key_history.get(target_key, []) if now - t < 60.0]
            usage = len(self.key_history.get(target_key, []))

            # Since get_next_key() records the timestamp, usage > max_rpm means pacing is required
            if usage > max_rpm:
                oldest_call = min(self.key_history[target_key])
                wait_time = max(0.1, 60.0 - (now - oldest_call) + 0.1)
                return wait_time
            return 0.0

    def probe_omniroute(self) -> bool:
        """
        Fast health-check to detect if the local OmniRoute AI gateway is running.
        Default: http://127.0.0.1:20128/v1
        """
        omniroute_url = os.getenv("OMNIROUTE_URL", "http://127.0.0.1:20128/v1")
        try:
            import urllib.request
            req = urllib.request.Request(f"{omniroute_url}/models", headers={"User-Agent": "DocuMorph-OmniProbe/1.0"})
            with urllib.request.urlopen(req, timeout=0.6) as response:
                if response.status in (200, 401): # Active endpoint
                    logger.info(f"OmniRoute AI Gateway detected active at {omniroute_url}")
                    return True
        except Exception:
            pass
        return False

    def is_omniroute_available(self) -> bool:
        """Returns cached or live probe status of OmniRoute."""
        if not hasattr(self, '_omniroute_active'):
            self._omniroute_active = self.probe_omniroute()
        return self._omniroute_active

    @staticmethod
    def compress_prompt_caveman(prompt: str) -> str:
        """
        Rule-based deterministic Caveman compression.
        Strips polite conversational filler from OCR prompts, saving 15-40% on vision token quotas
        without degrading transcription accuracy.
        """
        import re
        filler_patterns = [
            r"You are an expert OCR and document structure AI\.\s*",
            r"Your job is to\s*",
            r"Please ensure that\s*",
            r"Please\s+",
            r"Make sure you\s*",
            r"It is very important that\s*",
            r"Note that\s*",
        ]
        compressed = prompt
        for pat in filler_patterns:
            compressed = re.sub(pat, "", compressed, flags=re.IGNORECASE)
        return compressed.strip()

    def get_total_keys(self) -> int:
        return len(self.keys)

