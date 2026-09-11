import os
import logging
from typing import Dict, Any
import fitz
from documorph.services.base_service import BaseServiceHandler

logger = logging.getLogger("documorph.compress_service")

class CompressServiceHandler(BaseServiceHandler):
    """
    Handles PDF compression workflows:
    1. Bytes-only stream deflation, metadata stripping, and PyMuPDF garbage collection.
    2. Intelligent layout compaction (space saving without deleting text).
    """

    def process_bytes_only(
        self,
        doc: fitz.Document,
        config: Dict[str, Any],
        file_path: str,
        timestamp: int,
        base_name: str
    ) -> str:
        self.orchestrator._report("Compressing PDF (stream deflation)...", 25)
        remove_images = config.get("images") == "remove"
        strip_metadata = config.get("strip_metadata", True)
        remove_duplicates = config.get("remove_duplicates", True)

        output_path = os.path.join(self.orchestrator.output_dir, f"COMPRESSED_{timestamp}_{base_name}.pdf")

        if strip_metadata:
            try:
                doc.set_metadata({})
            except Exception as e:
                logger.warning(f"Could not clear metadata: {e}")

        if remove_images:
            self.orchestrator._report("Stripping images from PDF...", 40)
            for page in doc:
                try:
                    for img in page.get_images():
                        try:
                            page.delete_image(img[0])
                        except Exception:
                            pass
                except Exception:
                    pass

        self.orchestrator._report("Optimizing and deflating streams...", 70)
        doc.save(
            output_path,
            garbage=4 if remove_duplicates else 3,
            deflate=True,
            clean=True,
            deflate_images=True,
            deflate_fonts=True
        )

        orig_size = os.path.getsize(file_path) if os.path.exists(file_path) else 0
        comp_size = os.path.getsize(output_path) if os.path.exists(output_path) else 0
        saved_pct = round(((orig_size - comp_size) / max(1, orig_size)) * 100, 1) if orig_size > 0 else 0
        logger.info(f"PDF Compressed: {orig_size} bytes -> {comp_size} bytes (-{saved_pct}%)")
        self.orchestrator._report(f"Compression Complete (-{saved_pct}%)", 100)
        return output_path

    def process(
        self,
        doc: fitz.Document,
        config: Dict[str, Any],
        temp_dir: str,
        base_name: str,
        timestamp: int,
        processed_markdown: str = "",
        file_path: str = ""
    ) -> str:
        quality = config.get("quality", "balanced")
        if quality == "bytes_only":
            return self.process_bytes_only(doc, config, file_path, timestamp, base_name)

        # Intelligent Layout Compaction to PDF
        self.orchestrator._report("Compiling Compact PDF...", 90)
        final_pdf_path = os.path.join(self.orchestrator.output_dir, f"COMPACT_{timestamp}_{base_name}.pdf")
        compact_mode = "ultra_dense" if quality in ("max", "ultra_dense") else "compact"
        is_landscape = getattr(self.orchestrator, "is_landscape", False)
        self.orchestrator.pdf_compiler.compile(processed_markdown, final_pdf_path, compact_mode=compact_mode, is_landscape=is_landscape)
        return final_pdf_path
