import logging
import fitz  # PyMuPDF

logger = logging.getLogger(__name__)

def classify_pdf(doc: fitz.Document, sample_pages: int = 3) -> str:
    """
    Classify a PDF's text layer quality to determine the optimal extraction route.
    
    Args:
        doc: The PyMuPDF Document object.
        sample_pages: Number of pages to sample from the beginning of the document.
        
    Returns:
        "scanned": Very few characters found, likely an image-only PDF.
        "corrupted": Text found but largely unreadable (garbled characters).
        "clean": Text is mostly readable, safe for local extraction.
    """
    total_chars = 0
    readable_chars = 0
    
    # Sample up to the specified number of pages
    pages_to_check = min(sample_pages, len(doc))
    
    if pages_to_check == 0:
        logger.warning("Document has no pages.")
        return "scanned"
        
    for i in range(pages_to_check):
        page = doc[i]
        text = page.get_text("text")
        
        for ch in text:
            # Ignore whitespace for ratio calculation
            if ch.strip():
                total_chars += 1
                # isascii() catches standard English/math/punctuation
                # isalnum() catches valid alphanumeric characters in other languages
                if ch.isascii() or ch.isalnum():
                    readable_chars += 1
                    
    logger.info(f"Decision Engine sampled {pages_to_check} pages: {total_chars} total non-whitespace chars.")
    
    # Thresholds
    if total_chars < 50:
        logger.info("Classification: SCANNED (No meaningful text layer found).")
        return "scanned"
        
    ratio = readable_chars / total_chars
    logger.info(f"Readable character ratio: {ratio:.2f} ({readable_chars}/{total_chars})")
    
    if ratio < 0.70:
        logger.info("Classification: CORRUPTED (Text layer is garbled/unreadable).")
        return "corrupted"
        
    # CHECK LAYOUT COMPLEXITY (The "Optimization Paradox" Fix)
    # Even if text is clean, highly graphical PDFs with many colored tables
    # will generate too many individual crops, making Path A slower and more expensive than Path B.
    vector_count = 0
    image_count = 0
    for i in range(pages_to_check):
        page = doc[i]
        image_count += len(page.get_images())
        for p in page.get_drawings():
            if p.get("fill") is not None and p.get("fill_opacity", 0) > 0:
                r = p["rect"]
                if r.width > page.rect.width * 0.2 and r.height > 10:
                    vector_count += 1
                    
    logger.info(f"Layout Check: {vector_count} large vectors, {image_count} images found in sample.")
    
    # Breakeven Math: Path B stitches 4 pages = 1 API call per 4 pages.
    # Path A makes 1 API call PER CROP. 
    # If average crops per page > 2, Path A is mathematically a complete waste of money and tokens.
    if (vector_count + image_count) > (pages_to_check * 2):
        logger.warning(f"Classification: SCANNED (Layout is too complex. {vector_count + image_count} crops found. Forcing Vision AI to save tokens).")
        return "scanned"
        
    logger.info("Classification: CLEAN (Text layer is readable and layout is simple).")
    return "clean"

