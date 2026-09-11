import os
import logging
from typing import Dict, Any
import fitz
from documorph.services.base_service import BaseServiceHandler

logger = logging.getLogger("documorph.clean_format_service")

class CleanFormatServiceHandler(BaseServiceHandler):
    """
    Handles Clean & Format workflows:
    - Restores multi-column layouts, LaTeX math equations, and tables.
    - Embeds whitened 300 DPI diagrams with anti-page-splitting CSS.
    - Compiles to publication-grade A4 PDF.
    """

    def process(
        self,
        doc: fitz.Document,
        config: Dict[str, Any],
        temp_dir: str,
        base_name: str,
        timestamp: int,
        processed_markdown: str = ""
    ) -> str:
        self.orchestrator._report("Compiling Final Clean PDF...", 90)
        final_pdf_path = os.path.join(self.orchestrator.output_dir, f"FINAL_{timestamp}_{base_name}.pdf")
        is_landscape = getattr(self.orchestrator, "is_landscape", False)
        self.orchestrator.pdf_compiler.compile(processed_markdown, final_pdf_path, compact_mode="standard", is_landscape=is_landscape)
        return final_pdf_path
