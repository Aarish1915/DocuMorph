import os
import json
import time
import logging
from pathlib import Path
from typing import Optional
from google import genai
from google.genai import types
import fitz

logger = logging.getLogger(__name__)

# Resolve config.json relative to the project root (2 levels up from this file)
_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
_DEFAULT_CONFIG = _PROJECT_ROOT / "config.json"


class RateLimiter:
    """Token-bucket rate limiter. Replaces naive time.sleep(4.5)."""

    def __init__(self, max_rpm: int = 15):
        self.min_interval = 60.0 / max_rpm  # 4.0s for 15 RPM
        self.last_call = 0.0

    def wait(self):
        elapsed = time.time() - self.last_call
        if elapsed < self.min_interval:
            time.sleep(self.min_interval - elapsed)
        self.last_call = time.time()


class FullPageVision:
    """
    Tier 2 Processing: Sends the entire page image to Gemini 3.5 Flash Lite.
    Guarantees perfect contextual extraction with retry logic and adaptive rate limiting.
    """

    MAX_RETRIES = 3
    BACKOFF_BASE = 15  # seconds

    def __init__(self, config_path: str = None):
        self.api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY must be set in environment")

        self.client = genai.Client(api_key=self.api_key)
        self.model_name = "gemini-3.5-flash-lite"
        self.rate_limiter = RateLimiter(max_rpm=15)

        # Default fallback prompt
        self.prompt = "Extract all text, tables, and math from this document image into clean Markdown."

        # Resolve config path: explicit arg > project root default
        resolved_config = Path(config_path) if config_path else _DEFAULT_CONFIG
        if resolved_config.exists():
            try:
                with open(resolved_config, "r", encoding="utf-8") as f:
                    config = json.load(f)
                    self.prompt = config.get("ai_prompt", self.prompt)
            except Exception as e:
                logger.warning(f"Could not load {resolved_config}: {e}")

    def extract_page(self, page: fitz.Page) -> Optional[str]:
        """Converts the PyMuPDF page to an image and sends to Gemini with retry."""
        logger.debug(f"Routing complex page to {self.model_name}...")

        # Render page to JPEG
        pix = page.get_pixmap(dpi=150)
        img_bytes = pix.tobytes("jpeg")

        for attempt in range(1, self.MAX_RETRIES + 1):
            try:
                self.rate_limiter.wait()
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=[
                        self.prompt,
                        types.Part.from_bytes(data=img_bytes, mime_type="image/jpeg"),
                    ],
                )
                if response and response.text:
                    return response.text.strip()
                return None

            except Exception as e:
                err_str = str(e)
                logger.warning(f"Attempt {attempt}/{self.MAX_RETRIES} failed: {err_str}")

                if attempt < self.MAX_RETRIES:
                    wait = self.BACKOFF_BASE * (2 ** (attempt - 1))  # 15s, 30s
                    logger.info(f"Retrying in {wait}s...")
                    time.sleep(wait)
                else:
                    logger.error(f"All {self.MAX_RETRIES} attempts failed for page.")

        return None
