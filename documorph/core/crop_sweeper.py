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
        Prioritizes the Digital Fast-Path so native documents process locally in ~15ms/page,
        reserving multi-modal Vision AI strictly for true scanned photocopies and corrupted layers.
        """
        classifications = {}
        
        for i in range(len(self.doc)):
            page = self.doc[i]
            
            # 1. Inspect text layer
            text = page.get_text("text")
            total_chars = len(text.strip())
            # Support Latin, numeric, and full Devanagari (Hindi) Unicode range \u0900-\u097F
            readable_chars = sum(
                1 for ch in text 
                if ch.isascii() or ch.isalnum() or ('\u0900' <= ch <= '\u097F')
            )
            readable_ratio = (readable_chars / max(1, total_chars))
            
            # 1.a Check for corrupted font layers (KrutiDev / non-Unicode Devanagari mappings)
            if total_chars > 50:
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
                
                # Low readability ratio only on non-math text (garbled binary streams)
                if readable_ratio < 0.60 and total_chars > 120:
                    classifications[i] = "corrupted"
                    logger.info(f"Page {i}: Classified as CORRUPTED (Garbled text layer: {readable_ratio:.2f} readable ratio).")
                    continue

            # 2. Check images for full-page background scans
            images = page.get_images()
            total_area = max(1.0, page.rect.width * page.rect.height)
            image_area = 0.0
            for img in images[:5]:
                try:
                    rects = page.get_image_rects(img[0])
                    for rect in rects:
                        image_area += abs(rect.width * rect.height)
                except Exception as e:
                    logger.debug(f"Could not calculate rect for image: {e}")
            image_ratio = image_area / total_area

            # True Scanned Page: Dominant background photo/scan image covering >= 35% AND low selectable text
            if image_ratio >= 0.35 and total_chars < 120:
                classifications[i] = "complex"
                logger.info(f"Page {i}: Classified as COMPLEX (Scanned document without digital text: {image_ratio:.2f} image ratio).")
                continue

            # Check for true CamScanner / OKEN Scanner OCR noise patterns (repeated colon-dash sequences).
            # Do NOT match standard markdown rules '---' or table pipes '|---|'.
            has_repeating_ocr_noise = bool(re.search(r'(?::\s*-\s*:){2,}|(?:\(\s*\)\s*-\s*:){2,}', text))
            if has_repeating_ocr_noise and total_chars < 150:
                classifications[i] = "corrupted"
                logger.info(f"Page {i}: Classified as CORRUPTED (Detected CamScanner/OKEN repeating OCR noise).")
                continue

            # 4. Check Layout Complexity — must run BEFORE the digital fast-path so we can
            # detect diagram-heavy pages even when they have sufficient text.
            vector_area = 0
            crop_count = len(images)
            try:
                drawings = page.get_drawings()
                # Bound drawings inspection to max 400 paths to prevent CPU lockup
                for p in drawings[:400]:
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

            vector_ratio = vector_area / total_area if total_area > 0 else 0
            combined_ratio = image_ratio + vector_ratio

            # 3. DIGITAL FAST-PATH (<15ms/page):
            # Rich valid digital text — BUT check for dominant vector diagrams first.
            # FIX F: A digital-native page with >15% vector drawing area contains diagrams
            # that PyMuPDF's text extractor cannot describe. Send to Vision AI so the
            # diagram content is not silently dropped from the output.
            if total_chars >= 80 and readable_ratio >= 0.65:
                if vector_ratio > 0.15:
                    classifications[i] = "complex"
                    logger.info(f"Page {i}: COMPLEX override — digital text but vector-diagram heavy ({vector_ratio:.2f}). Sending to Vision AI.")
                else:
                    classifications[i] = "clean"
                    logger.info(f"Page {i}: Classified as CLEAN ({total_chars} chars, digital native fast-path).")
                continue

            # Low-text page with significant drawings/images requires Vision AI
            if total_chars < 80 and (combined_ratio > 0.20 or crop_count >= 3):
                classifications[i] = "complex"
                logger.info(f"Page {i}: Classified as COMPLEX (Low text {total_chars}c, high visual elements: {combined_ratio:.2f}).")
            else:
                classifications[i] = "clean"
                logger.info(f"Page {i}: Classified as CLEAN ({total_chars} chars).")

        return classifications
