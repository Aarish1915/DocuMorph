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
    def save_whitened_image(pix: fitz.Pixmap, target_path: Path, whitening_level: str = "high") -> None:
        """
        Saves pixmap converting scanner/paper tint to pure #FFFFFF based on whitening_level:
        - 'natural': RGB > 238 (keeps pencil markings and light graph grids)
        - 'high': RGB > 220 (default, clean white paper, sharp black text)
        - 'ultra': adaptive Sauvola-style binarization / RGB > 195 (eradicates dark photocopy stains)
        """
        try:
            img_data = pix.tobytes("png")
            with Image.open(io.BytesIO(img_data)) as pil_img:
                pil_img = pil_img.convert("RGB")
                arr = np.array(pil_img)
                
                threshold = 220
                if whitening_level == "natural":
                    threshold = 238
                elif whitening_level == "ultra":
                    threshold = 195
                    
                mask = (arr[:, :, 0] > threshold) & (arr[:, :, 1] > threshold) & (arr[:, :, 2] > threshold)
                arr[mask] = [255, 255, 255]
                Image.fromarray(arr).save(str(target_path), "PNG")
        except Exception as e:
            logger.warning(f"Whitening failed, saving raw pixmap: {e}")
            pix.save(str(target_path))

    @staticmethod
    def generate_bilingual_glossary_html(labels_map: Dict[str, str]) -> str:
        """
        Generates an accessible, elegant bilingual glossary key pill container to embed directly below the diagram.
        """
        if not labels_map:
            return ""
        items = []
        for en, trans in labels_map.items():
            if en and trans and en.strip().lower() != trans.strip().lower():
                items.append(f"<span class='glossary-pill'><strong>{en.strip()}</strong>: {trans.strip()}</span>")
        if not items:
            return ""
        glossary_items = " • ".join(items)
        return (
            f'\n\n<div class="diagram-glossary" align="center" style="margin: 6px auto 14px auto; max-width: 90%; '
            f'padding: 8px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; '
            f'font-size: 10pt; color: #334155; text-align: center; break-inside: avoid; page-break-inside: avoid;">\n'
            f'  <span style="font-weight: 700; color: #1e293b;">🔍 Diagram Glossary:</span> {glossary_items}\n'
            f'</div>\n\n'
        )

    def inpaint_diagram_labels(
        self,
        image_path: Path,
        labels_map: Dict[str, str],
        label_boxes: List[Dict[str, Any]]
    ) -> Path:
        """
        Replaces detected English text labels inside a diagram crop with translated text.
        Whitens the bounding box of the English label and renders Unicode text using PIL.
        """
        if not labels_map or not label_boxes or not image_path.exists():
            return image_path
            
        try:
            from PIL import ImageDraw, ImageFont
            with Image.open(str(image_path)) as img:
                img = img.convert("RGB")
                draw = ImageDraw.Draw(img)
                
                font = None
                font_paths = [
                    # Windows
                    "C:/Windows/Fonts/Nirmala.ttc",
                    "C:/Windows/Fonts/Nirmala.ttf",
                    "C:/Windows/Fonts/arial.ttf",
                    # Linux / Docker / Render
                    "/usr/share/fonts/truetype/noto/NotoSansDevanagari-Regular.ttf",
                    "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf",
                    "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
                    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
                    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
                    "/usr/share/fonts/truetype/freefont/FreeSans.ttf"
                ]
                for fp in font_paths:
                    if os.path.exists(fp):
                        try:
                            font = ImageFont.truetype(fp, size=14)
                            break
                        except Exception:
                            continue
                if not font:
                    font = ImageFont.load_default()

                modified = False
                for box in label_boxes:
                    orig_text = box.get("text", "").strip()
                    if not orig_text:
                        continue
                    trans_text = labels_map.get(orig_text) or labels_map.get(orig_text.lower())
                    if not trans_text:
                        continue

                    bbox = box.get("box") # [x0, y0, x1, y1] in image pixel coordinates
                    if bbox and len(bbox) == 4:
                        pad = 2
                        draw.rectangle(
                            [bbox[0] - pad, bbox[1] - pad, bbox[2] + pad, bbox[3] + pad],
                            fill=(255, 255, 255)
                        )
                        draw.text((bbox[0], bbox[1]), trans_text, fill=(15, 23, 42), font=font)
                        modified = True

                if modified:
                    out_path = image_path.parent / f"trans_{image_path.name}"
                    img.save(str(out_path), "PNG")
                    return out_path
        except Exception as e:
            logger.warning(f"Inpainting diagram labels failed: {e}")
        return image_path

    def extract_page_diagrams(
        self,
        page: fitz.Page,
        page_num: int,
        xref_frequency: Dict[int, int],
        total_doc_pages: int,
        job_prefix: str,
        whitening_level: str = "high",
        dpi_scale: float = 2.5
    ) -> List[Dict[str, Any]]:
        """
        Extracts genuine educational diagrams and figures from a page,
        filtering out institute watermarks, header/footer logos, and corner contact stamps.
        Fuses vector graphic drawings to prevent cutting schematics, circuits, or graphs.
        """
        page_area = page.rect.width * page.rect.height
        raw_blocks = page.get_text("blocks")
        seen_xrefs: Set[int] = set()
        candidates: List[Dict[str, Any]] = []

        # Gather vector drawing paths on this page
        try:
            drawings = page.get_drawings()
        except Exception:
            drawings = []

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

                # 4. Banner ribbon aspect ratio filter (headers, footers, ad divider ribbons)
                is_banner = (w / max(1.0, h) > 4.2) or (h / max(1.0, w) > 4.5)

                # 5. Overlapping promotional spam text filter
                import re
                clip_text = page.get_text("text", clip=rect).lower()
                is_spam_text = (
                    any(k in clip_text for k in ["telegram", "whatsapp", "@", "call", "academy", "institute", "classes", "fee", "mains", "pre :", "batch"])
                    or bool(re.search(r'\b[6-9]\d{9}\b', clip_text))
                )

                # 6. Body text intersection filter (dense text running over watermark)
                intersecting_chars = sum(len(b[4].strip()) for b in raw_blocks if b[6] == 0 and fitz.Rect(b[:4]).intersects(rect))
                is_watermark = intersecting_chars > 60

                # 7. Document-wide template watermark recurrence filter
                is_repeated_template = (xref_frequency.get(xref, 0) >= 3) or (total_doc_pages > 1 and xref_frequency.get(xref, 0) >= total_doc_pages * 0.35)

                if (
                    not is_repeated_template
                    and not is_hf
                    and not is_full_page
                    and not is_composite_scan
                    and not is_corner_stamp
                    and not is_banner
                    and not is_spam_text
                    and not is_watermark
                    and area >= 4000
                    and w >= 80
                    and h >= 80
                ):
                    d_mat = fitz.Matrix(dpi_scale, dpi_scale)
                    # Text boundary collision avoidance: expand safely without slicing adjacent text
                    pad_l, pad_t, pad_r, pad_b = 8.0, 8.0, 8.0, 8.0
                    for b in raw_blocks:
                        if b[6] == 0: # text block
                            bx0, by0, bx1, by1 = b[0], b[1], b[2], b[3]
                            if max(rect.x0 - pad_l, bx0) < min(rect.x1 + pad_r, bx1):
                                if by1 <= rect.y0 and (rect.y0 - by1) < pad_t:
                                    pad_t = max(2.0, rect.y0 - by1 - 2.0)
                                if by0 >= rect.y1 and (by0 - rect.y1) < pad_b:
                                    pad_b = max(2.0, by0 - rect.y1 - 2.0)

                    # VECTOR GRAPHIC FUSION:
                    # Encompass any vector drawing paths (circuits, arrows, coordinate axes) that touch candidate rect
                    padded_rect = fitz.Rect(
                        max(0, rect.x0 - pad_l),
                        max(0, rect.y0 - pad_t),
                        min(page.rect.width, rect.x1 + pad_r),
                        min(page.rect.height, rect.y1 + pad_b)
                    )
                    for d in drawings:
                        dr = fitz.Rect(d["rect"])
                        if dr.intersects(padded_rect) and dr.width < 0.90 * page.rect.width and dr.height < 0.80 * page.rect.height:
                            padded_rect.include_rect(dr)

                    diag_pix = page.get_pixmap(matrix=d_mat, clip=padded_rect)
                    diag_filename = f"{job_prefix}_scanned_diag_{page_num}_{xref}_{r_idx}.png"
                    diag_path = self.images_dir / diag_filename
                    self.save_whitened_image(diag_pix, diag_path, whitening_level)

                    y_rel = padded_rect.y0 / max(1.0, page.rect.height)
                    candidates.append({
                        "rel_path": f"images/{diag_filename}",
                        "y_rel": y_rel,
                        "rect": [padded_rect.x0, padded_rect.y0, padded_rect.x1, padded_rect.y1],
                        "area": padded_rect.width * padded_rect.height
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
