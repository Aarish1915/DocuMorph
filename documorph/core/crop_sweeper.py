import logging
import re
import fitz # PyMuPDF
from typing import List, Tuple, Dict
from pathlib import Path

logger = logging.getLogger(__name__)

class LightningSweeper:
    """
    Profiles all pages locally at lightning speed.
    Decides on a per-page basis if the page is 'clean' (extract crops) 
    or 'complex' (send full page to AI).
    """
    def __init__(self, doc: fitz.Document):
        self.doc = doc
        
    def sweep(self) -> Dict[int, str]:
        """
        Returns a dict mapping page index to classification: 'clean', 'complex', or 'corrupted'.
        """
        classifications = {}
        
        for i in range(len(self.doc)):
            page = self.doc[i]
            
            # 1. Check for text corruption
            text = page.get_text("text")
            total_chars = len(text.strip())
            readable_chars = sum(1 for ch in text if ch.isascii() or ch.isalnum())
            
            if total_chars > 50:
                # 1.a Low alphanumeric ratio check
                if (readable_chars / total_chars) < 0.70:
                    classifications[i] = "corrupted"
                    logger.info(f"Page {i}: Classified as CORRUPTED (Garbled text layer).")
                    continue
                
                # 1.b Corrupted font layer check (KrutiDev / non-Unicode Devanagari mappings)
                # Word-initial short-i (\u093f) is impossible in valid Devanagari orthography
                has_bad_matras = len(re.findall(r'(?:^|\s)\u093f', text)) >= 2
                # Embedded Latin phonetic / IPA glyphs (e.g. ɟ, ɡ, ɞ) substituted for consonants
                has_ipa = len(re.findall(r'[\u0250-\u02AF]', text)) >= 2
                # Embedded digits inside Devanagari words (e.g. का3र्य)
                has_embedded_digits = len(re.findall(r'[\u0900-\u097F][0-9][\u0900-\u097F]', text)) >= 2
                
                if has_bad_matras or has_ipa or has_embedded_digits:
                    classifications[i] = "corrupted"
                    logger.info(f"Page {i}: Classified as CORRUPTED (Corrupted Hindi font / KrutiDev substitution).")
                    continue
                
            # 2. Check Layout Complexity (Vectors and Images)
            vector_area = 0
            image_area = 0
            total_area = page.rect.width * page.rect.height
            
            crop_count = 0
            
            # Images (raster)
            images = page.get_images()
            for img in images:
                crop_count += 1
                try:
                    # Get actual bounding box area of the image to factor into complexity
                    rects = page.get_image_rects(img[0])
                    for rect in rects:
                        image_area += abs(rect.width * rect.height)
                except Exception as e:
                    logger.debug(f"Could not calculate rect for image: {e}")
                # Rough area estimate not available directly without get_image_bbox, 
                # but we count the raw number of image blocks
                
            # Vectors (Tables/Colored Fills)
            try:
                drawings = page.get_drawings()
                for p in drawings:
                    if p.get("fill") is not None and p.get("fill_opacity", 0) > 0:
                        r = p["rect"]
                        # Ignore decorative header/footer banners (top 8% and bottom 8%)
                        if r.y0 < page.rect.height * 0.08 or r.y1 > page.rect.height * 0.92:
                            continue
                            
                        if r.width > page.rect.width * 0.2 and r.height > 10:
                            crop_count += 1
                            vector_area += (r.width * r.height)
            except Exception as e:
                logger.warning(f"Failed to parse drawings on page {i}: {e}")
                classifications[i] = "corrupted"
                continue
                
            image_ratio = image_area / total_area if total_area > 0 else 0
            vector_ratio = vector_area / total_area if total_area > 0 else 0
            combined_ratio = image_ratio + vector_ratio
            
            # Check for OCR separator line noise (characteristic of CamScanner / OKEN Scanner invisible text)
            has_ocr_noise = bool(re.search(r'[-:]{3,}|(?::\s*-\s*:)|(?:\(\s*\)\s*-\s*:)', text))
            
            # Breakeven Math Threshold:
            # 1. Scanned notes have background images covering >= 25% of the page.
            # 2. OCR-corrupted pages have separator artifacts (:- - - :).
            # 3. High vector/diagram density (tables/fills covering >= 20% or > 5 crops).
            # These must be read natively by Vision AI to preserve tables and clean formatting.
            if image_ratio > 0.25:
                classifications[i] = "complex"
                logger.info(f"Page {i}: Classified as COMPLEX (Scanned document: {image_ratio:.2f} image ratio).")
            elif has_ocr_noise:
                classifications[i] = "corrupted"
                logger.info(f"Page {i}: Classified as CORRUPTED (Detected CamScanner/OKEN OCR noise).")
            elif vector_ratio > 0.20 or crop_count >= 5:
                classifications[i] = "complex"
                logger.info(f"Page {i}: Classified as COMPLEX (High vector density: {vector_ratio:.2f} ratio, {crop_count} crops).")
            elif total_chars < 200 and combined_ratio > 0.15:
                classifications[i] = "complex"
                logger.info(f"Page {i}: Classified as COMPLEX (Low text, high visual elements).")
            else:
                classifications[i] = "clean"
                logger.info(f"Page {i}: Classified as CLEAN ({total_chars} chars, digital native text).")
                
        return classifications
