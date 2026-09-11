import os
import io
import logging
from pathlib import Path
from typing import Dict, List, Any, Set
import fitz
from PIL import Image
import numpy as np

logger = logging.getLogger("documorph.diagram_extractor")

class DiagramExtractor:
    """
    Precision Diagram & Figure Extraction Engine.
    Handles high-resolution 300 DPI crops, gray-background whitening,
    multi-stage watermark/stamp filtering, and deduplication.
    """
    def __init__(self, images_dir: Path = None):
        self.images_dir = images_dir or Path("data/output/images")
        self.images_dir.mkdir(parents=True, exist_ok=True)

    @staticmethod
    def compute_xref_frequency(doc: fitz.Document) -> Dict[int, int]:
        """Counts occurrence of each image xref across the entire document."""
        freq: Dict[int, int] = {}
        for page in doc:
            for img in page.get_images():
                xref = img[0]
                freq[xref] = freq.get(xref, 0) + 1
        return freq

    @staticmethod
    def save_whitened_image(pix: fitz.Pixmap, target_path: Path) -> None:
        """Saves pixmap converting grayish scanner/paper tint (RGB > 225) to pure #FFFFFF."""
        try:
            img_data = pix.tobytes("png")
            with Image.open(io.BytesIO(img_data)) as pil_img:
                pil_img = pil_img.convert("RGB")
                arr = np.array(pil_img)
                mask = (arr[:, :, 0] > 225) & (arr[:, :, 1] > 225) & (arr[:, :, 2] > 225)
                arr[mask] = [255, 255, 255]
                Image.fromarray(arr).save(str(target_path), "PNG", optimize=True)
        except Exception as e:
            logger.warning(f"Whitening failed, saving raw pixmap: {e}")
            pix.save(str(target_path))

    def extract_page_diagrams(
        self,
        page: fitz.Page,
        page_num: int,
        xref_frequency: Dict[int, int],
        total_doc_pages: int,
        job_prefix: str
    ) -> List[Dict[str, Any]]:
        """
        Extracts genuine educational diagrams and figures from a page,
        filtering out institute watermarks, header/footer logos, and corner contact stamps.
        """
        page_area = page.rect.width * page.rect.height
        raw_blocks = page.get_text("blocks")
        seen_xrefs: Set[int] = set()
        candidates: List[Dict[str, Any]] = []

        for img_info in page.get_images():
            xref = img_info[0]
            if xref in seen_xrefs:
                continue
            seen_xrefs.add(xref)

            rects = page.get_image_rects(xref)
            for r_idx, rect in enumerate(rects):
                w, h = rect.width, rect.height
                area = w * h

                # 1. Header/Footer margin filter
                is_hf = (rect.y0 < page.rect.height * 0.08 or rect.y1 > page.rect.height * 0.92) and (h < 60 or w < 200)

                # 2. Full page background scan or composite section filter
                has_full_page_bg = any(
                    ((r.width * r.height) >= 0.70 * page_area)
                    for x in page.get_images()
                    for r in page.get_image_rects(x[0])
                )
                is_full_page = (w >= 0.88 * page.rect.width and h >= 0.75 * page.rect.height) or (area >= 0.70 * page_area)
                is_composite_scan = (has_full_page_bg and (area >= 0.25 * page_area or (w >= 0.75 * page.rect.width and h >= 0.35 * page.rect.height)))

                # 3. Corner promotional stamp filter (Telegram, WhatsApp, phone icons)
                is_corner_stamp = (
                    (rect.x0 > 0.65 * page.rect.width and rect.y0 > 0.50 * page.rect.height) or # Bottom-Right
                    (rect.x1 < 0.30 * page.rect.width and rect.y0 > 0.65 * page.rect.height) or # Bottom-Left
                    (rect.x0 > 0.70 * page.rect.width and rect.y1 < 0.30 * page.rect.height)    # Top-Right
                ) and (area < 0.20 * page_area)

                # 4. Body text intersection filter (dense text running over watermark)
                intersecting_chars = sum(len(b[4].strip()) for b in raw_blocks if b[6] == 0 and fitz.Rect(b[:4]).intersects(rect))
                is_watermark = intersecting_chars > 60

                # 5. Document-wide template watermark recurrence filter
                is_repeated_template = (xref_frequency.get(xref, 0) >= 3) or (total_doc_pages > 1 and xref_frequency.get(xref, 0) >= total_doc_pages * 0.35)

                if (
                    not is_repeated_template
                    and not is_hf
                    and not is_full_page
                    and not is_composite_scan
                    and not is_corner_stamp
                    and not is_watermark
                    and area >= 4000
                    and w >= 80
                    and h >= 80
                ):
                    d_mat = fitz.Matrix(2.5, 2.5) # 300 DPI high-fidelity crop
                    diag_pix = page.get_pixmap(matrix=d_mat, clip=rect)
                    diag_filename = f"{job_prefix}_scanned_diag_{page_num}_{xref}_{r_idx}.png"
                    diag_path = self.images_dir / diag_filename
                    self.save_whitened_image(diag_pix, diag_path)

                    y_rel = rect.y0 / max(1.0, page.rect.height)
                    candidates.append({
                        "rel_path": f"images/{diag_filename}",
                        "y_rel": y_rel,
                        "rect": [rect.x0, rect.y0, rect.x1, rect.y1],
                        "area": area
                    })

        # Deduplicate overlapping diagrams (keep larger outer bounding box)
        deduped: List[Dict[str, Any]] = []
        for i, d1 in enumerate(candidates):
            is_nested = False
            for j, d2 in enumerate(candidates):
                if i != j and d2["area"] > d1["area"]:
                    inter = fitz.Rect(d1["rect"]).intersect(fitz.Rect(d2["rect"]))
                    if not inter.is_empty and (inter.width * inter.height) / max(1.0, d1["area"]) > 0.50:
                        is_nested = True
                        break
            if not is_nested:
                deduped.append(d1)

        # Sort diagrams from top to bottom
        deduped.sort(key=lambda d: d.get("y_rel", 0.5))
        return deduped
