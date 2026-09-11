import pymupdf as fitz
import os
import re
import statistics
from typing import List, Dict, Any

class NativeExtractor:
    """
    Phase 1 (CPU): Extracts text using the perfect PyMuPDF block logic from August 26.
    Detects tables/images, crops them, and orders everything flawlessly without squishing text.
    """
    def __init__(self, gap_threshold: float = 30.0, custom_spam_words: str = ""):
        self.min_image_width = 80
        self.min_image_height = 80
        self.gap_threshold = gap_threshold
        
        # Build local spam pattern
        base_pattern = r"lexrise academy|subscribe to|telegram|@\w+|\d{10}|UK-APO FOUNDATION|EXA|original price|coupon code|best value offer|support & enquiry|steps to join|vishesh sir|tricks wale sir|expert faculty|result oriented|save\s*₹|APO F:|Raj APO|Mains-\d+|Contact with us:|Jharkhand APO"
        if custom_spam_words:
            words = [re.escape(w.strip()) for w in custom_spam_words.split(",") if w.strip()]
            if words:
                custom_pattern = "|".join(words)
                base_pattern = f"{base_pattern}|{custom_pattern}"
                
        self.spam_pattern = f"(?i)({base_pattern})"

    def is_math_block(self, text: str) -> bool:
        math_chars = set(['∫', '∑', '√', '±', '≠', '≈', '≤', '≥', '∝', '∞', 'θ', 'π', 'α', 'β', 'γ', 'Δ'])
        symbol_count = sum(1 for c in text if c in math_chars or c in ['=', '+', '-', '*', '/'])
        if len(text) > 0 and symbol_count / len(text) > 0.40:
            return True
        if any(c in text for c in math_chars):
            return True
        return False

    def is_header_footer(self, y0: float, y1: float, page_height: float) -> bool:
        """Margin Bounds: Top 10% and Bottom 10% of the page"""
        return (y0 < page_height * 0.10) or (y1 > page_height * 0.90)

    def extract_page(self, doc: fitz.Document, page_num: int) -> Dict[str, Any]:
        page = doc[page_num]
        elements = []
        crop_rects = []
        
        # 1. FIND NATIVE TABLES (Classic August 26 Logic)
        # We do NOT use strategy="text" because it aggressively destroys normal text lists.
        tables = page.find_tables()
        for tab in tables:
            bbox = tab.bbox
            crop_rects.append(fitz.Rect(bbox))
            pad = 5
            padded_bbox = [max(0, bbox[0]-pad), max(0, bbox[1]-pad), min(page.rect.width, bbox[2]+pad), min(page.rect.height, bbox[3]+pad)]
            elements.append((bbox[1], "crop", padded_bbox))
            
        # Using dict instead of blocks so we can measure font sizes and bold styles
        dict_data = page.get_text("dict")
        
        # Calculate true body median font size and dominant font across the page (excluding spam headers/footers)
        all_sizes = []
        font_counts = {}
        for block in dict_data["blocks"]:
            if block["type"] == 0:
                b_bbox = block.get("bbox", [0, 0, 0, 0])
                by0, by1 = b_bbox[1], b_bbox[3]
                if not self.is_header_footer(by0, by1, page.rect.height):
                    for line in block["lines"]:
                        for span in line["spans"]:
                            text = span["text"].strip()
                            if text and not re.search(self.spam_pattern, text):
                                all_sizes.append(span["size"])
                                fn = span["font"]
                                font_counts[fn] = font_counts.get(fn, 0) + len(text)
                                
        median_size = statistics.median(all_sizes) if all_sizes else 11.0
        dominant_font = max(font_counts, key=font_counts.get) if font_counts else ""
        dominant_has_bold = "bold" in dominant_font.lower()

        # 2. Extract images and drawings
        page_area = page.rect.width * page.rect.height

        # 2a. Check for vector drawing diagrams (circuits, geometry, maps)
        try:
            drawings = page.get_drawings()
            if drawings:
                for d in drawings:
                    d_rect = d.get("rect")
                    if d_rect:
                        dw, dh = d_rect.width, d_rect.height
                        d_area = dw * dh
                        if d_area >= 4000 and (d_area / max(1, page_area) < 0.85):
                            if not self.is_header_footer(d_rect.y0, d_rect.y1, page.rect.height):
                                if not any(c.intersects(d_rect) for c in crop_rects):
                                    crop_rects.append(d_rect)
                                    elements.append((d_rect.y0, "diagram", [d_rect.x0, d_rect.y0, d_rect.x1, d_rect.y1]))
        except Exception:
            pass

        # 2b. Extract images from raw blocks tuple if present (b[6] == 1)
        try:
            raw_blocks = page.get_text("blocks")
            for b in raw_blocks:
                if len(b) >= 7 and b[6] == 1:
                    bx0, by0, bx1, by1 = b[0], b[1], b[2], b[3]
                    w, h = bx1 - bx0, by1 - by0
                    area = w * h
                    if not self.is_header_footer(by0, by1, page.rect.height) and w >= self.min_image_width and h >= self.min_image_height:
                        img_rect = fitz.Rect(bx0, by0, bx1, by1)
                        if not any(c.intersects(img_rect) for c in crop_rects):
                            crop_rects.append(img_rect)
                            tag = "diagram" if (area >= 4000 and area / max(1, page_area) < 0.85) else "crop"
                            elements.append((by0, tag, [bx0, by0, bx1, by1]))
        except Exception:
            pass

        for block in dict_data["blocks"]:
            b_bbox = block.get("bbox", [0, 0, 0, 0])
            x0, y0, x1, y1 = b_bbox[0], b_bbox[1], b_bbox[2], b_bbox[3]
            bbox = [x0, y0, x1, y1]
            
            if block["type"] == 1:
                width, height = x1 - x0, y1 - y0
                area = width * height
                # Anti-Spam Margin Bounds
                if not self.is_header_footer(y0, y1, page.rect.height) and width >= self.min_image_width and height >= self.min_image_height:
                    img_rect = fitz.Rect(bbox)
                    if not any(c.intersects(img_rect) for c in crop_rects):
                        crop_rects.append(img_rect)
                        tag = "diagram" if (area >= 4000 and area / max(1, page_area) < 0.85) else "crop"
                        elements.append((y0, tag, bbox))
                continue
                
            # It's a text block. Let's reconstruct it and format it.
            block_lines = []
            block_max_size = 0
            
            for line in block["lines"]:
                line_parts = []
                for span in line["spans"]:
                    text = span["text"].strip()
                    if not text:
                        continue
                        
                    size = span["size"]
                    block_max_size = max(block_max_size, size)
                    
                    # Prevent font trap: if the entire body font has 'Bold' in its name,
                    # only treat span as bold if it has explicit flag or size > median
                    if dominant_has_bold:
                        is_bold = bool(span["flags"] & 16) and (size > median_size)
                    else:
                        is_bold = bool(span["flags"] & 16) or ("bold" in span["font"].lower())
                    
                    if is_bold:
                        line_parts.append(f"**{text}**")
                    else:
                        line_parts.append(text)
                
                if line_parts:
                    block_lines.append(" ".join(line_parts))
                    
            if not block_lines:
                continue
                
            clean_text = "\n".join(block_lines).strip()
            
            if self.is_math_block(clean_text):
                pad = 5
                padded_bbox = [max(0, x0-pad), max(0, y0-pad), min(page.rect.width, x1+pad), min(page.rect.height, y1+pad)]
                crop_rects.append(fitz.Rect(padded_bbox))
                elements.append((y0, "crop", padded_bbox))
                continue

        # 3. EXTRACT TEXT (Second Pass: Overlap Detection & Perfect Paragraphs)
        for block in dict_data["blocks"]:
            if block["type"] == 1: continue # Images handled above
            
            b_bbox = block.get("bbox", [0, 0, 0, 0])
            x0, y0, x1, y1 = b_bbox[0], b_bbox[1], b_bbox[2], b_bbox[3]
            
            # Reconstruct the text block identically to pass 1
            block_lines = []
            block_max_size = 0
            for line in block["lines"]:
                line_parts = []
                for span in line["spans"]:
                    text = span["text"].strip()
                    if not text:
                        continue
                    size = span["size"]
                    block_max_size = max(block_max_size, size)
                    
                    if dominant_has_bold:
                        is_bold = bool(span["flags"] & 16) and (size > median_size)
                    else:
                        is_bold = bool(span["flags"] & 16) or ("bold" in span["font"].lower())
                        
                    if is_bold:
                        line_parts.append(f"**{text}**")
                    else:
                        line_parts.append(text)
                if line_parts:
                    block_lines.append(" ".join(line_parts))
            
            if not block_lines:
                continue
                
            clean_text = "\n".join(block_lines).strip()
            
            if self.is_math_block(clean_text): continue # Handled above
            
            # Anti-Spam: Skip headers/footers with spam keywords
            if self.is_header_footer(y0, y1, page.rect.height):
                if re.search(self.spam_pattern, clean_text):
                    continue
            else:
                if re.search(self.spam_pattern, clean_text):
                    continue
                
            # OVERLAP DETECTION: Does this text touch ANY crop region (math, table, image)?
            rect = fitz.Rect(x0, y0, x1, y1)
            is_overlapping = False
            for c_rect in crop_rects:
                expanded = c_rect + fitz.Rect(-5, -5, 5, 5)
                if rect.intersects(expanded):
                    is_overlapping = True
                    break
                    
            if not is_overlapping:
                # Inject Markdown Headings based on relative font size
                if block_max_size >= median_size * 1.35 or block_max_size >= median_size + 3.0:
                    clean_text = f"## {clean_text}"
                elif block_max_size >= median_size * 1.15 or block_max_size >= median_size + 1.5:
                    clean_text = f"### {clean_text}"
                    
                elements.append((y0, "text", clean_text))

        # 4. SCANNED PAGE FALLBACK
        total_text_len = sum(len(data) for _, etype, data in elements if etype == "text")
        if total_text_len < 50 and not crop_rects:
            if len(page.get_images()) > 0:
                elements = [(0, "crop", [0, 0, page.rect.width, page.rect.height])]
                
        # 5. SORT ELEMENTS FROM TOP TO BOTTOM
        elements.sort(key=lambda e: e[0])
        
        # Format the ordered items for the infiller
        ordered_items = []
        for y0, elem_type, data in elements:
            ordered_items.append({
                "type": elem_type,
                "data": data
            })
            
        return {
            "page_num": page_num,
            "items": ordered_items,
            "page_width": page.rect.width,
            "page_height": page.rect.height
        }

    def process_document(self, pdf_path: str) -> List[Dict[str, Any]]:
        if not os.path.exists(pdf_path):
            raise FileNotFoundError(f"PDF not found: {pdf_path}")
            
        results = []
        with fitz.open(pdf_path) as doc:
            for i in range(len(doc)):
                page_data = self.extract_page(doc, i)
                results.append(page_data)
                
        return results
