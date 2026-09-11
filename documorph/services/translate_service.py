import os
import re
import logging
from typing import Dict, Any
import fitz
from documorph.services.base_service import BaseServiceHandler

logger = logging.getLogger("documorph.translate_service")

class TranslateServiceHandler(BaseServiceHandler):
    """
    Handles translation workflows:
    - Protects LaTeX math expressions ($...$, $$...$$) and code blocks.
    - Resolves Multilingual Diagram Dilemma: preserves notebook/scientific diagram crops
      while injecting English translated legends/guides for Hindi/regional labels.
    - Compiles to translated Markdown (.md) or pristine translated A4 PDF.
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
        out_fmt = str(config.get("output_format", "pdf")).lower()

        if "md" in out_fmt or "markdown" in out_fmt:
            md_path = os.path.join(self.orchestrator.output_dir, f"TRANSLATED_{timestamp}_{base_name}.md")
            with open(md_path, "w", encoding="utf-8") as f:
                f.write(processed_markdown.strip())
            self.orchestrator._report("Translation Complete (.md)", 95)
            return md_path

        # PDF Compilation
        self.orchestrator._report("Compiling Translated PDF...", 90)
        final_pdf_path = os.path.join(self.orchestrator.output_dir, f"TRANSLATED_{timestamp}_{base_name}.pdf")
        is_landscape = getattr(self.orchestrator, "is_landscape", False)
        self.orchestrator.pdf_compiler.compile(processed_markdown, final_pdf_path, compact_mode="standard", is_landscape=is_landscape)
        return final_pdf_path
