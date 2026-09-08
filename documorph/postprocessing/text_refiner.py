import os
import time
import logging
from typing import Optional
from google import genai

logger = logging.getLogger(__name__)

class RateLimiter:
    def __init__(self, max_rpm: int = 15):
        self.min_interval = 60.0 / max_rpm
        self.last_call = 0.0

    def wait(self):
        elapsed = time.time() - self.last_call
        if elapsed < self.min_interval:
            time.sleep(self.min_interval - elapsed)
        self.last_call = time.time()

class TextRefiner:
    """
    Takes raw, messy text extracted locally and uses a fast, cheap AI model
    to format tables, fix headings, and structure the data.
    """
    MAX_RETRIES = 3
    BACKOFF_BASE = 10

    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY must be set in environment")
        
        self.client = genai.Client(api_key=self.api_key)
        self.model_name = "gemini-3.5-flash-lite"
        self.rate_limiter = RateLimiter(max_rpm=15)
        
        self.prompt = (
            "You are a document formatting expert. I will provide you with raw text extracted from a PDF page. "
            "Your job is to clean it up and return perfect Markdown. "
            "Rules:\n"
            "1. ONLY create Markdown tables if the original text is clearly structured as a tabular grid with rows and columns. DO NOT convert normal text lists, multiple-choice questions, or bullet points into tables.\n"
            "2. Ensure headings and subheadings are properly formatted (e.g., using # or ##).\n"
            "3. Fix math alignments and spacing if they look shattered.\n"
            "4. DO NOT hallucinate, summarize, or add any information that is not in the text. Ensure all data is kept intact.\n"
            "5. Maintain the original structure. If it's a list or multiple-choice question, keep it formatted neatly as a list.\n"
            "Here is the raw text to format:\n\n"
        )

    def refine_page(self, raw_text: str) -> Optional[str]:
        if not raw_text or len(raw_text.strip()) == 0:
            return raw_text
            
        logger.info("Refining local text with AI TextRefiner...")
        for attempt in range(1, self.MAX_RETRIES + 1):
            try:
                self.rate_limiter.wait()
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=self.prompt + raw_text,
                )
                if response and response.text:
                    return response.text.strip()
                return raw_text
            except Exception as e:
                logger.warning(f"TextRefiner attempt {attempt}/{self.MAX_RETRIES} failed: {e}")
                if attempt < self.MAX_RETRIES:
                    wait = self.BACKOFF_BASE * (2 ** (attempt - 1))
                    logger.info(f"Retrying in {wait}s...")
                    time.sleep(wait)
        return raw_text # Fallback to raw text if AI fails
