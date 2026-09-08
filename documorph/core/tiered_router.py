import fitz  # PyMuPDF
import re
import logging
from .local_extractors import EXTRACTORS

logger = logging.getLogger(__name__)

class TieredRouter:
    """
    Analyzes each PDF page and routes it to:
    - LOCAL (PyMuPDF smart/blocks/dict)
    - VISION (Gemini)
    - SKIP (Ignore completely)
    """

    # Minimum text characters on an image-heavy page to justify an API call
    MIN_TEXT_THRESHOLD = 30
    
    # If a page has more than this many drawings, it likely has a complex table
    DRAWINGS_THRESHOLD = 15

    def __init__(self, local_engine: str = "smart"):
        self.local_engine = local_engine
        if self.local_engine not in EXTRACTORS:
            logger.warning(f"Unknown engine '{self.local_engine}', falling back to 'smart'.")
            self.local_engine = "smart"

    def analyze_page(self, page: fitz.Page) -> str:
        """Returns 'local', 'vision', or 'skip'."""
        text = page.get_text("text").strip()
        image_list = page.get_images(full=True)
        has_images = len(image_list) > 0

        # 1. PURE SCAN: No extractable text at all → must use vision_image
        if len(text) == 0:
            return 'vision_image'

        # 2. TABLES: Check PyMuPDF's built-in table detector
        tables = page.find_tables()
        if tables and len(tables.tables) > 0:
            return 'vision'

        # 3. COMPLEX TABLES (colored backgrounds, no borders):
        #    Detected by high vector drawing count (rectangles for cell backgrounds)
        try:
            drawings_count = len(page.get_drawings())
            if drawings_count > self.DRAWINGS_THRESHOLD:
                logger.debug(f"Page has {drawings_count} drawings → routing to vision")
                return 'vision'
        except Exception:
            pass  # get_drawings() can fail on malformed pages

        # 4. MATH: Detect math symbols that need LaTeX rendering
        math_patterns = [
            r'\b\d+\s*/\s*\d+\b',  # Fractions like 1/2
            r'\u222b', r'\u2211', r'\u221a', r'\u00b1',
            r'\u221d', r'\u2248', r'\u2260', r'\u2261', r'\u2264', r'\u2265'
        ]
        for pattern in math_patterns:
            if re.search(pattern, text):
                return 'vision'

        # 5. IMAGE HANDLING
        if has_images:

            if len(text) < self.MIN_TEXT_THRESHOLD:
                # Highly graphical page with minimal text (infographics/maps)
                return 'vision_image'
                
        # 6. Everything else: local extraction handles it
        return 'local'

    def extract_local(self, page: fitz.Page) -> str:
        """Extracts text locally using the configured engine."""
        engine_func = EXTRACTORS[self.local_engine]
        return engine_func(page)
