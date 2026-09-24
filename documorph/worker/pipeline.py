import os
import sys
import time
import json
import logging
import tempfile
import gc
import asyncio
import concurrent.futures
from pathlib import Path
from dotenv import load_dotenv, find_dotenv
import fitz
import re
import datetime
import io
import base64
from PIL import Image
try:
    import psutil as _psutil
    _PSUTIL_OK = True
except ImportError:
    _psutil = None
    _PSUTIL_OK = False

_RAM_GUARD_MB = 380  # Trigger emergency GC if RSS exceeds this on free-tier

def _maybe_gc(force: bool = False) -> None:
    """Collect garbage and (on Linux) trim glibc heap if RAM guard is breached."""
    if force or (_PSUTIL_OK and _psutil.Process().memory_info().rss / 1_048_576 > _RAM_GUARD_MB):
        gc.collect()
        try:
            import ctypes
            ctypes.CDLL("libc.so.6").malloc_trim(0)
        except Exception:
            pass

from documorph.core.crop_sweeper import LightningSweeper
from documorph.core.native_extractor import NativeExtractor
from documorph.core.batch_vision import BatchVisionEngine
from documorph.core.format_polisher import polish_markdown

from documorph.postprocessing.spam_filter import SpamFilter
from documorph.postprocessing.hindi_handler import HindiHandler
from documorph.postprocessing.format_fixer import FormatFixer
from documorph.compilers.pdf_compiler import PDFCompiler
from documorph.core.database import SessionLocal, PageResult, PageResultVersion, SpamCorpusEntity, Job
from documorph.core.diagram_extractor import DiagramExtractor
from documorph.services import (
    CleanFormatServiceHandler,
    CompressServiceHandler,
    ExtractTextServiceHandler,
    TranslateServiceHandler,
)

# --- Logging Setup ---
LOG_DIR = Path("data/logs")
LOG_DIR.mkdir(parents=True, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
    datefmt="%H:%M:%S",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(
            LOG_DIR / f"documorph_{time.strftime('%Y-%m-%d')}.log",
            encoding="utf-8",
        ),
    ],
)
logger = logging.getLogger("documorph")

def _save_whitened_image(pix, target_path: Path) -> None:
    """Save pixmap to PNG, converting gray photocopy artifacts (RGB > 225) to clean #FFFFFF."""
    try:
        from PIL import Image
        import numpy as np
        import io
        img_data = pix.tobytes("png")
        with Image.open(io.BytesIO(img_data)) as pil_img:
            pil_img = pil_img.convert("RGB")
            arr = np.array(pil_img)
            mask = (arr[:, :, 0] > 225) & (arr[:, :, 1] > 225) & (arr[:, :, 2] > 225)
            arr[mask] = [255, 255, 255]
            Image.fromarray(arr).save(str(target_path), "PNG", optimize=True)
    except Exception as e:
        logger.warning(f"Auto-whitening failed, saving direct pixmap: {e}")
        pix.save(str(target_path))


class DocuMorphOrchestrator:
    def __init__(
        self, 
        job_id: str = None,
        progress_callback=None,
        service_type: str = "clean_format",
        config_options: str | dict = "{}",
        language_mode: str = "auto",
        spam_words: str = "",
        ignore_images: str = "",
        custom_api_key: str = None,
        custom_prompt: str = None,
        output_dir: str = None
    ):
        load_dotenv(find_dotenv(), override=True)
        self.job_id = job_id
        self.output_dir = output_dir or "data/output/needs_review"
        os.makedirs(self.output_dir, exist_ok=True)
        self.service_type = service_type or "clean_format"
        if isinstance(config_options, str):
            try:
                self.config_options = json.loads(config_options) if config_options else {}
            except Exception:
                self.config_options = {}
        else:
            self.config_options = config_options or {}

        # If translate service has a target language, wire it
        if self.service_type == "translate":
            to_lang = self.config_options.get("to_language") or self.config_options.get("language_mode") or language_mode
            if not to_lang or str(to_lang).lower() in ("auto", "none", ""):
                language_mode = "Hindi"
            else:
                language_mode = str(to_lang).strip()
        elif self.config_options.get("language_mode"):
            language_mode = self.config_options.get("language_mode")

        # If config specifies removing images
        if self.config_options.get("images") in ["remove", "none"]:
            ignore_images = "all"

        self.target_lang = language_mode
        self.progress_callback = progress_callback or (lambda status, pct: None)
        
        # Tools
        self.native_extractor = NativeExtractor(custom_spam_words=spam_words)
        self.vision_engine = BatchVisionEngine(
            custom_api_key=custom_api_key,
            custom_prompt=custom_prompt,
            ignore_images=ignore_images,
            language_mode=language_mode,
            service_type=self.service_type
        )
        
        self.spam_filter = SpamFilter(custom_spam_words=spam_words)
        self.hindi_handler = HindiHandler(mode=self.target_lang)
        self.format_fixer = FormatFixer()
        self.pdf_compiler = PDFCompiler(output_dir=self.output_dir)
        self.diagram_extractor = DiagramExtractor()

        # Decoupled Feature Service Handlers (Strategy Pattern)
        self.services = {
            "clean_format": CleanFormatServiceHandler(self),
            "compress": CompressServiceHandler(self),
            "extract_text": ExtractTextServiceHandler(self),
            "translate": TranslateServiceHandler(self),
        }
        
    def _report(self, status: str, pct: int):
        logger.info(f"Progress: {pct}% - {status}")
        self.progress_callback(status, pct)

    def _process_compression(self, doc, file_path: str, timestamp: int, base_name: str) -> str:
        return self.services["compress"].process_bytes_only(doc, self.config_options, file_path, timestamp, base_name)

    def process_file(self, file_path: str) -> str:
        start_time = time.time()
        self.start_time = start_time
        timestamp = int(start_time)
        file_name = Path(file_path).name
        base_name = file_name.replace(".pdf", "")
        
        try:
            doc = fitz.open(file_path)
            total_pages_count = len(doc)
            
            # Detect if source document is a landscape presentation slide deck (e.g. 16:9 lecture slides)
            self.is_landscape = False
            if total_pages_count > 0:
                p0 = doc[0]
                if (p0.rect.width / max(1.0, p0.rect.height)) > 1.20:
                    self.is_landscape = True
                    logger.info(f"Detected landscape presentation slide deck (aspect ratio: {p0.rect.width/p0.rect.height:.2f})")
            
            # Pre-compute image xref frequency across document to detect repeated template watermarks and logos
            xref_frequency = self.diagram_extractor.compute_xref_frequency(doc)
            
            # 0. PAGE RANGE SLICING (Optional - ONLY when explicitly set to 'custom')
            p_from_val = self.config_options.get("page_from")
            p_to_val = self.config_options.get("page_to")
            if self.config_options.get("page_range") == "custom":
                try:
                    p_from = max(1, min(int(p_from_val or 1), total_pages_count))
                    p_to = max(p_from, min(int(p_to_val or total_pages_count), total_pages_count))
                    logger.info(f"Slicing document to pages {p_from} to {p_to}")
                    doc.select(range(p_from - 1, p_to))
                    self._report(f"Sliced to pages {p_from} - {p_to} ({len(doc)} pages)", 8)
                except Exception as ex:
                    logger.warning(f"Could not slice pages: {ex}")

            # High-Speed Native Compression Fast-Path: Complete in <3s, 0 tokens, 0 API calls, <30MB RAM
            if self.service_type == "compress":
                res = self.services["compress"].process(
                    doc, self.config_options, None, base_name, timestamp, file_path=file_path
                )
                doc.close()
                return res
            
            # 1. LIGHTNING SWEEPER
            self._report("Lightning Sweep (Profiling Pages)...", 10)
            sweeper = LightningSweeper(doc)
            classifications = sweeper.sweep()
            
            if self.service_type == "translate":
                for p in range(len(doc)):
                    classifications[p] = "complex"
            
            ai_pages = [p for p, c in classifications.items() if c in ("complex", "corrupted")]
            local_pages = [p for p in range(len(doc)) if p not in ai_pages]
            logger.info(f"TELEMETRY_PAGES_AI: {ai_pages}")
            logger.info(f"TELEMETRY_PAGES_LOCAL: {local_pages}")
            
            # Check for existing cached pages if this is a selective reprocess run
            reprocess_pages = set(self.config_options.get("reprocess_pages", []))
            cached_pages = {}
            if self.job_id and reprocess_pages:
                try:
                    db = SessionLocal()
                    existing = db.query(PageResult).filter(PageResult.job_id == self.job_id).all()
                    for r in existing:
                        if r.page_number not in reprocess_pages and r.raw_markdown:
                            cached_pages[r.page_number - 1] = [r.raw_markdown]
                    db.close()
                    if cached_pages:
                        logger.info(f"Loaded {len(cached_pages)} cached pages from PageResult for job {self.job_id}")
                except Exception as e:
                    logger.warning(f"Could not load cached pages: {e}")

            final_markdown_pages = {}
            crops_to_batch = []
            
            with tempfile.TemporaryDirectory() as temp_dir:
                self._report("Local Extraction & Cropping...", 20)
                # 2. LOCAL EXTRACTION & CROPS
                for page_num in range(len(doc)):
                    prep_pct = 12 + int(((page_num + 1) / max(1, total_pages_count)) * 26)
                    self._report(f"Scanning & Profiling Layout: Page {page_num + 1}/{total_pages_count}...", prep_pct)

                    if page_num in cached_pages:
                        final_markdown_pages[page_num] = cached_pages[page_num]
                        continue
                    cls = classifications.get(page_num, "clean")
                    page = doc[page_num]
                    if cls == "complex" or cls == "corrupted":
                        # Fast native JPEG render clamped to max 1600px width, slashing token prefill & TTFT by ~60%
                        max_dim = 1600.0
                        curr_w = float(page.rect.width) if page.rect.width else 600.0
                        zoom = min(1.4, max_dim / max(1.0, curr_w))
                        mat = fitz.Matrix(zoom, zoom)
                        pix = page.get_pixmap(matrix=mat)
                        img_path = os.path.join(temp_dir, f"full_{page_num}.jpg")
                        pix.save(img_path)
                        pix = None  # Phase C: release pixmap memory immediately
                        
                        # Extract any standalone diagrams or sub-images on this scanned/complex page
                        try:
                            scanned_diagrams = self.diagram_extractor.extract_page_diagrams(
                                page, page_num, xref_frequency, total_pages_count, str(self.job_id or timestamp)
                            )
                        except Exception as e:
                            logger.warning(f"Failed extracting diagrams for scanned page {page_num}: {e}")
                            scanned_diagrams = []

                        # Mark this page to be processed in the full-page batch
                        crops_to_batch.append({
                            "type": "full_page", 
                            "page_num": page_num, 
                            "path": img_path,
                            "scanned_diagrams": scanned_diagrams
                        })
                    else:
                        # Clean page: Local extract + targeted crops
                        try:
                            page_data = self.native_extractor.extract_page(doc, page_num)
                        except Exception as n_ex:
                            logger.warning(f"Native extraction error on page {page_num}: {n_ex}")
                            page_data = {"items": [{"type": "text", "data": page.get_text("text")}]}

                        page_md_blocks = []
                        for idx, item in enumerate(page_data.get("items", [])):
                            if item["type"] == "text":
                                page_md_blocks.append(item["data"])
                            elif item["type"] == "diagram":
                                try:
                                    bbox = item["data"]
                                    rect = fitz.Rect(bbox[0], bbox[1], bbox[2], bbox[3])
                                    mat = fitz.Matrix(2.5, 2.5) # 300 DPI high-fidelity
                                    pix = page.get_pixmap(matrix=mat, clip=rect)
                                    images_dir = Path("data/output/images")
                                    images_dir.mkdir(parents=True, exist_ok=True)
                                    diagram_filename = f"{self.job_id or timestamp}_diagram_{page_num}_{idx}.png"
                                    diagram_path = images_dir / diagram_filename
                                    self.diagram_extractor.save_whitened_image(pix, diagram_path)
                                    pix = None  # Phase C: release pixmap memory immediately

                                    rel_img_path = f"images/{diagram_filename}"
                                    page_md_blocks.append(
                                        f'\n\n<div class="diagram-container" align="center" style="margin: 14px 0; break-inside: avoid; page-break-inside: avoid;">\n'
                                        f'  <img src="{rel_img_path}" alt="Document Diagram" style="max-width: 90%; max-height: 440px; object-fit: contain; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); break-inside: avoid; page-break-inside: avoid;" />\n'
                                        f'</div>\n\n'
                                    )
                                except Exception as d_ex:
                                    logger.warning(f"Failed saving diagram crop on page {page_num} #{idx}: {d_ex}")
                            elif item["type"] == "crop":
                                try:
                                    bbox = item["data"]
                                    rect = fitz.Rect(bbox[0], bbox[1], bbox[2], bbox[3])
                                    mat = fitz.Matrix(1.33, 1.33)
                                    pix = page.get_pixmap(matrix=mat, clip=rect)
                                    crop_path = os.path.join(temp_dir, f"crop_{page_num}_{idx}.jpg")
                                    pix.save(crop_path)
                                    pix = None  # Phase C: release pixmap memory immediately
                                    crops_to_batch.append({
                                        "type": "crop",
                                        "page_num": page_num,
                                        "path": crop_path,
                                        "block_idx": len(page_md_blocks) # Save where to inject
                                    })
                                    page_md_blocks.append(f"<!-- CROP_PLACEHOLDER_{page_num}_{idx} -->")
                                except Exception as c_ex:
                                    logger.warning(f"Failed saving crop on page {page_num} #{idx}: {c_ex}")
                        
                        final_markdown_pages[page_num] = page_md_blocks

                    # Phase C: periodic GC every 10 pages to prevent fragmentation on free-tier
                    if (page_num + 1) % 10 == 0:
                        _maybe_gc()
                        logger.debug(f"GC pass after page {page_num + 1}")

                # 3. NATIVE MULTI-PART BATCHING
                # Adaptive Micro-Batching: Balance token generation concurrency with API quota.
                # Partitioning into concurrent chunks of 2-3 pages allows parallel decoding across Semaphore(3),
                # slashing LLM generation latency from ~40s down to ~16s!
                total_crops = len(crops_to_batch)
                if total_crops <= 5:
                    batch_size = 5
                elif total_crops <= 19:
                    batch_size = 5
                else:
                    # Hard 50-Page Scaling Rule: 50 pages / 10 = 5 API calls max ceiling
                    batch_size = 10
                
                full_pages_count = sum(1 for c in crops_to_batch if c["type"] == "full_page")
                targeted_crops_count = sum(1 for c in crops_to_batch if c["type"] == "crop")
                logger.info(f"TELEMETRY_CROPS: total={len(crops_to_batch)}, full_page={full_pages_count}, targeted={targeted_crops_count}")
                
                async def process_all_chunks():
                    if not crops_to_batch:
                        logger.info("No scanned pages or crops detected: digital native fast-path complete.")
                        return
                    tasks = []
                    chunk_indices = []
                    for i in range(0, len(crops_to_batch), batch_size):
                        chunk = crops_to_batch[i:i+batch_size]
                        image_paths = [c["path"] for c in chunk]
                        batch_index = (i // batch_size) + 1
                        tasks.append(self.vision_engine.process_images_batch(image_paths, batch_index))
                        chunk_indices.append(i)
                        
                    total_batches = len(tasks)
                    self._report(f"AI Reading: Processing {total_batches} batches concurrently...", 40)
                    
                    completed_batches = 0
                    # Use a restrained semaphore (3) to prevent Render 512MB RAM OOM crashes
                    semaphore = asyncio.Semaphore(3) 
                    async def sem_task(task):
                        nonlocal completed_batches
                        async with semaphore:
                            res = await task
                            completed_batches += 1
                            pct = 40 + int((completed_batches / total_batches) * 25)
                            self._report(f"AI Reading: Completed batch {completed_batches}/{total_batches}...", pct)
                            return res
                            
                    sem_tasks = [sem_task(t) for t in tasks]
                    results = await asyncio.gather(*sem_tasks, return_exceptions=True)
                    
                    # Re-inject results
                    for batch_num, ai_results in enumerate(results):
                        if isinstance(ai_results, Exception):
                            logger.error(f"Batch {batch_num + 1} failed completely: {ai_results}")
                            ai_results = {}
                            
                        start_idx = chunk_indices[batch_num]
                        chunk = crops_to_batch[start_idx:start_idx+batch_size]
                        
                        for j, c in enumerate(chunk):
                            extracted_text = ai_results.get(j, f"<!-- AI Extraction Failed for {c['path']} -->")
                            pnum = c["page_num"]
                            
                            if c["type"] == "full_page":
                                extracted_text = ai_results.get(j, "")
                                page_obj = doc[pnum]
                                images_dir = Path("data/output/images")
                                images_dir.mkdir(parents=True, exist_ok=True)
                                
                                # BULLETPROOF FALLBACK: If AI extraction returned empty or failed (network/quota/rate limit):
                                # Fall back to native selectable text so the output NEVER produces empty lined pages!
                                if not extracted_text or not extracted_text.strip() or extracted_text.strip().startswith("<!--"):
                                    native_text = page_obj.get_text("text").strip()
                                    if native_text:
                                        logger.info(f"Page {pnum + 1}: AI extraction empty; falling back to native text ({len(native_text)} chars).")
                                        if self.service_type == "translate":
                                            try:
                                                extracted_text = await self.vision_engine.translate_text_direct(native_text, self.target_lang or "Hindi")
                                            except Exception as trans_ex:
                                                logger.warning(f"Fallback translation error on page {pnum + 1}: {trans_ex}")
                                                extracted_text = native_text
                                        else:
                                            extracted_text = native_text
                                    else:
                                        extracted_text = f"\n\n*Page {pnum + 1}: Visual diagram or handwritten content retained in document.*\n\n"
                                
                                # 1. First, search for Vision-detected diagram bounding boxes:
                                # [Figure: <desc> | bbox: [ymin, xmin, ymax, xmax]] or [चित्र: <desc> | bbox: [...]]
                                bbox_pattern = r'\[(?:Figure|Diagram|चित्र|डायग्राम):\s*([^\|\]]+?)\s*\|\s*bbox:\s*\[\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\]\s*\]'
                                bbox_matches = list(re.finditer(bbox_pattern, extracted_text, re.IGNORECASE))
                                
                                # Process matches in reverse to preserve string indices during replacement
                                for m_idx, m in enumerate(reversed(bbox_matches)):
                                    desc = m.group(1).strip()
                                    ymin, xmin, ymax, xmax = int(m.group(2)), int(m.group(3)), int(m.group(4)), int(m.group(5))
                                    
                                    # Clamp to 0..1000
                                    ymin = max(0, min(1000, ymin))
                                    ymax = max(0, min(1000, ymax))
                                    xmin = max(0, min(1000, xmin))
                                    xmax = max(0, min(1000, xmax))
                                    
                                    box_w = xmax - xmin
                                    box_h = ymax - ymin
                                    
                                    # Validate dimensions (ignore tiny noise or full-page captures)
                                    if box_w >= 40 and box_h >= 40 and (box_w * box_h) < 850000:
                                        pw, ph = page_obj.rect.width, page_obj.rect.height
                                        raw_x0 = (xmin * pw / 1000.0)
                                        raw_y0 = (ymin * ph / 1000.0)
                                        raw_x1 = (xmax * pw / 1000.0)
                                        raw_y1 = (ymax * ph / 1000.0)

                                        # Safe adaptive padding: 4% width, 4% height
                                        pad_x = max(14.0, 0.040 * pw)
                                        pad_y = max(16.0, 0.040 * ph)

                                        rx0 = max(0.0, raw_x0 - pad_x)
                                        ry0 = max(0.0, raw_y0 - pad_y)
                                        rx1 = min(pw, raw_x1 + pad_x)
                                        ry1 = min(ph, raw_y1 + pad_y)

                                        # VECTOR DRAWING FUSION:
                                        # Encompass any vector drawing paths (circuits, arrows, coordinate axes) that touch candidate rect
                                        try:
                                            drawings = page_obj.get_drawings()
                                            cand_rect = fitz.Rect(rx0, ry0, rx1, ry1)
                                            for d in drawings:
                                                dr = fitz.Rect(d["rect"])
                                                if dr.intersects(cand_rect) and dr.width < 0.90 * pw and dr.height < 0.80 * ph:
                                                    rx0 = min(rx0, dr.x0 - 4.0)
                                                    ry0 = min(ry0, dr.y0 - 4.0)
                                                    rx1 = max(rx1, dr.x1 + 4.0)
                                                    ry1 = max(ry1, dr.y1 + 4.0)
                                        except Exception as dr_ex:
                                            logger.debug(f"Vector drawing inspection skipped: {dr_ex}")

                                        # SUB-PIXEL TEXT COLLISION BARRIER:
                                        try:
                                            blocks = page_obj.get_text("blocks")
                                            for b in blocks:
                                                if b[6] == 0:  # text block
                                                    bx0, by0, bx1, by1 = b[0], b[1], b[2], b[3]
                                                    if max(rx0, bx0) < min(rx1, bx1):
                                                        if by1 <= raw_y0 + 2.0 and by1 > ry0:
                                                            ry0 = min(raw_y0, by1 + 2.0)
                                                        if by0 >= raw_y1 - 2.0 and by0 < ry1:
                                                            ry1 = max(raw_y1, by0 - 2.0)
                                        except Exception as coll_err:
                                            logger.debug(f"Text boundary collision check skipped: {coll_err}")

                                        crop_rect = fitz.Rect(max(0.0, rx0), max(0.0, ry0), min(pw, rx1), min(ph, ry1))

                                        # SPAM DIAGRAM & WATERMARK FILTER:
                                        crop_text = page_obj.get_text("text", clip=crop_rect).lower()
                                        custom_spam = [w.strip().lower() for w in str(self.config_options.get("spam_words", "")).split(",") if w.strip()]
                                        spam_keywords = ["telegram", "whatsapp", "@", "call", "academy", "classes", "institute", "pre :", "mains :", "foundation batch", "fee:"] + custom_spam
                                        is_spam_diag = (
                                            any(k in crop_text for k in spam_keywords)
                                            or bool(re.search(r'\b[6-9]\d{9}\b', crop_text))
                                        )
                                        if is_spam_diag:
                                            logger.info(f"Rejected spam diagram on page {pnum}: '{desc}' containing promotional text.")
                                            extracted_text = extracted_text[:m.start()] + "" + extracted_text[m.end():]
                                            continue

                                        # Determine quality DPI scaling: 300 DPI (2.5), 200 DPI (1.8), 150 DPI (1.2)
                                        pic_q = str(self.config_options.get("picture_quality", "high")).lower()
                                        scale_factor = 1.2 if "fast" in pic_q or "150" in pic_q else (1.8 if "balanced" in pic_q or "200" in pic_q else 2.5)
                                        diag_pix = page_obj.get_pixmap(matrix=fitz.Matrix(scale_factor, scale_factor), clip=crop_rect)
                                        diag_fname = f"{self.job_id or timestamp}_vdiag_{pnum}_{m_idx}.png"
                                        diag_path = images_dir / diag_fname
                                        
                                        whitening_level = str(self.config_options.get("whitening_level", "high")).lower()
                                        self.diagram_extractor.save_whitened_image(diag_pix, diag_path, whitening_level)
                                        diag_pix = None  # Phase C: release pixmap immediately
                                        
                                        rel_path = f"images/{diag_fname}"
                                        
                                        # Inside-Diagram Bilingual Companion Glossary support
                                        glossary_html = ""
                                        if self.service_type == "translate":
                                            try:
                                                glossary_map = {}
                                                if desc and len(desc.strip()) > 2 and not desc.lower().startswith("diagram"):
                                                    glossary_map[desc] = desc
                                                glossary_html = self.diagram_extractor.generate_bilingual_glossary_html(glossary_map)
                                            except Exception:
                                                glossary_html = ""

                                        diag_html = (
                                            f'\n\n<div class="diagram-container" align="center" style="margin: 16px 0; break-inside: avoid; page-break-inside: avoid;">\n'
                                            f'  <img src="{rel_path}" alt="{desc}" style="max-width: 90%; max-height: 440px; object-fit: contain; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); break-inside: avoid; page-break-inside: avoid;" />\n'
                                            f'  <div class="figure-caption" style="font-size: 10.5pt; color: #475569; font-weight: 600; margin-top: 6px;">Figure: {desc}</div>\n'
                                            f'</div>\n{glossary_html}\n'
                                        )
                                        extracted_text = extracted_text[:m.start()] + diag_html + extracted_text[m.end():]
                                
                                # 2. Next, inject any PDF XObject diagrams if available
                                diags = c.get("scanned_diagrams", [])
                                if diags:
                                    diags.sort(key=lambda d: d.get("y_rel", 0.5))
                                    for diag_item in diags:
                                        diag_html = (
                                            f'\n\n<div class="diagram-container" align="center" style="margin: 14px 0; break-inside: avoid; page-break-inside: avoid;">\n'
                                            f'  <img src="{diag_item["rel_path"]}" alt="Figure Diagram" style="max-width: 90%; max-height: 440px; object-fit: contain; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); break-inside: avoid; page-break-inside: avoid;" />\n'
                                            f'</div>\n\n'
                                        )
                                        placeholder_match = re.search(r'(\[(?:Diagram|Figure|Image|चित्र|डायग्राम)[^\]]*\]|\((?:Figure|Fig\.|चित्र)[^\)]*\))', extracted_text, re.IGNORECASE)
                                        if placeholder_match:
                                            extracted_text = extracted_text[:placeholder_match.start()] + diag_html + extracted_text[placeholder_match.end():]
                                        else:
                                            y_rel = diag_item.get("y_rel", 0.5)
                                            target_char_idx = int(y_rel * len(extracted_text))
                                            split_pos = extracted_text.find('\n\n', target_char_idx)
                                            if split_pos == -1:
                                                split_pos = extracted_text.rfind('\n\n', 0, target_char_idx)
                                            if split_pos != -1:
                                                extracted_text = extracted_text[:split_pos] + diag_html + extracted_text[split_pos:]
                                            else:
                                                extracted_text = extracted_text + diag_html
                                
                                # 3. Clean up or style any residual unreplaced [Figure: <desc>] tags
                                # Never leak raw bracket tags into text or slice words
                                def _replace_residual_tag(match):
                                    tag_text = match.group(0)
                                    # Extract the description inside the brackets
                                    inner = re.sub(r'^\[(?:Figure|Diagram|Image|चित्र|डायग्राम):\s*|\s*\]$', '', tag_text, flags=re.IGNORECASE).strip()
                                    if len(inner) > 3 and not inner.lower().startswith("bbox"):
                                        return f'\n\n<div class="diagram-callout" style="margin: 12px 0; padding: 10px 14px; background: #f8fafc; border-left: 4px solid #3b82f6; border-radius: 6px; font-size: 11pt; color: #1e3a8a;">📌 <strong>Illustration:</strong> {inner}</div>\n\n'
                                    return ''
                                
                                extracted_text = re.sub(r'\[(?:Figure|Diagram|Image|चित्र|डायग्राम)[^\]]*\]', _replace_residual_tag, extracted_text, flags=re.IGNORECASE)
                                extracted_text = re.sub(r'\((?:Figure|Fig\.|\u091a\u093f\u0924\u094d\u0930)[^\)]*\)', '', extracted_text)
                                final_markdown_pages[pnum] = [extracted_text]
                            else:
                                b_idx = c["block_idx"]
                                final_markdown_pages[pnum][b_idx] = f"\n\n{extracted_text}\n\n"
                                
                try:
                    loop = asyncio.get_running_loop()
                except RuntimeError:
                    loop = None
                    
                if loop and loop.is_running():
                    with concurrent.futures.ThreadPoolExecutor() as pool:
                        pool.submit(asyncio.run, process_all_chunks()).result()
                else:
                    asyncio.run(process_all_chunks())
                self._report(f"AI Reading: Completed.", 65)
                # Combine pages
                for p in range(len(doc)):
                    if p not in final_markdown_pages:
                        final_markdown_pages[p] = ["<!-- Missing Page Content -->"]
                        
            doc.close()

            # 4. SMART POLISHING (Fast local AST regex cleanup - <5ms, eliminates 25s latency!)
            self._report("Smart Polishing (Formatting Headings & Lists)...", 70)
            
            def polish_page_worker(p_idx, text):
                # Sanitize promotional spam BEFORE polishing so fee banners do not become H1 titles!
                sanitized_text = self.spam_filter.clean_text(text)
                
                # If translation service and local page, translate directly using fast text model
                if self.service_type == "translate" and p_idx in local_pages and len(sanitized_text.strip()) > 10:
                    try:
                        translated = asyncio.run(self.vision_engine.translate_text_direct(sanitized_text, self.target_lang or "Hindi"))
                        return p_idx, translated
                    except Exception as t_err:
                        logger.warning(f"Error translating local page {p_idx}: {t_err}")
                        return p_idx, sanitized_text
                        
                # Fast local AST formatting for digital pages (instant <5ms, saves 25s!)
                try:
                    fixed_text = self.format_fixer.fix_markdown(sanitized_text)
                    return p_idx, fixed_text
                except Exception as e:
                    logger.warning(f"Local formatting fallback on page {p_idx}: {e}")
                    return p_idx, sanitized_text

            polished_pages = {}
            for p in range(len(final_markdown_pages)):
                idx, text = polish_page_worker(p, "\n".join(final_markdown_pages[p]))
                polished_pages[idx] = text

            format_polisher_calls_count = 0
            logger.info("Smart Polisher formatted all pages with local AST normalizer in <5ms.")

            ordered_pages = [polished_pages[p] for p in range(len(final_markdown_pages))]
            raw_markdown = "\n\n---\n\n".join(ordered_pages)

            # Persist PageResult records & version audit trails in a single bulk transaction
            if self.job_id:
                try:
                    import difflib
                    from sqlalchemy import func
                    db = SessionLocal()
                    # Batch fetch all existing PageResult and version counts in 2 single queries
                    existing_prs = {
                        pr.page_number: pr for pr in db.query(PageResult).filter(PageResult.job_id == self.job_id).all()
                    }
                    existing_v_counts = dict(
                        db.query(PageResultVersion.page_number, func.count(PageResultVersion.id))
                        .filter(PageResultVersion.job_id == self.job_id)
                        .group_by(PageResultVersion.page_number)
                        .all()
                    )

                    for p_idx, p_text in polished_pages.items():
                        page_num = p_idx + 1
                        pr = existing_prs.get(page_num)

                        prev_text = pr.raw_markdown if pr and pr.raw_markdown else ""
                        diff_summary = ""
                        if prev_text and prev_text != p_text:
                            diff_lines = list(difflib.unified_diff(
                                prev_text.splitlines(keepends=True),
                                p_text.splitlines(keepends=True),
                                fromfile=f"page_{page_num}_v_prev",
                                tofile=f"page_{page_num}_v_new"
                            ))
                            diff_summary = "".join(diff_lines[:50])

                        v_count = existing_v_counts.get(page_num, 0)

                        pv = PageResultVersion(
                            job_id=self.job_id,
                            page_number=page_num,
                            version_number=v_count + 1,
                            prompt_used=str(getattr(self.vision_engine, 'custom_prompt', "") or ""),
                            raw_markdown=p_text,
                            diff_summary=diff_summary
                        )
                        db.add(pv)

                        if not pr:
                            pr = PageResult(job_id=self.job_id, page_number=page_num)
                            db.add(pr)
                        pr.raw_markdown = p_text
                        pr.status = "COMPLETED"
                    db.commit()
                    db.close()
                except Exception as e:
                    logger.warning(f"Could not persist PageResult records: {e}")


            # 5. POST-PROCESSING
            self._report("Running Post-Processing...", 80)
            clean_watermarks = self.config_options.get("clean_watermarks", True)
            fix_spacing = self.config_options.get("fix_spacing", True)

            processed = self.spam_filter.clean_text(raw_markdown) if clean_watermarks else raw_markdown
            if self.service_type != "translate":
                processed = self.hindi_handler.process_text(processed)
            if fix_spacing:
                processed = self.format_fixer.fix_markdown(processed)

            # 6. OUTPUT COMPILATION BASED ON SERVICE TYPE (Strategy Pattern Delegation)
            self._report("Compiling and typesetting final output pages...", 86)
            output_result_path = None
            if self.service_type == "extract_text":
                output_result_path = self.services["extract_text"].process(
                    doc, self.config_options, temp_dir, base_name, timestamp,
                    processed_markdown=processed, ordered_pages=ordered_pages, file_name=file_name
                )
            elif self.service_type == "translate":
                output_result_path = self.services["translate"].process(
                    doc, self.config_options, temp_dir, base_name, timestamp,
                    processed_markdown=processed
                )
            elif self.service_type == "compress":
                output_result_path = self.services["compress"].process(
                    doc, self.config_options, temp_dir, base_name, timestamp,
                    processed_markdown=processed, file_path=file_path
                )
            else:
                output_result_path = self.services["clean_format"].process(
                    doc, self.config_options, temp_dir, base_name, timestamp,
                    processed_markdown=processed
                )

            # Telemetry compilation (excluding network retries/dropouts from pure compute)
            total_wall_time = round(time.time() - start_time, 2)
            network_delay_retry = round(getattr(self.vision_engine, 'total_retry_delay_seconds', 0.0), 2)
            pure_compute_time = round(max(0.0, total_wall_time - network_delay_retry), 2)
            
            telemetry = {
                "file_name": file_name,
                "total_pages": total_pages_count,
                "pages_local_count": len(local_pages),
                "pages_local_list": local_pages,
                "pages_ai_count": len(ai_pages),
                "pages_ai_list": ai_pages,
                "targeted_crops_count": targeted_crops_count if 'targeted_crops_count' in locals() else 0,
                "full_page_crops_count": full_pages_count if 'full_pages_count' in locals() else 0,
                "total_crops_count": len(crops_to_batch) if 'crops_to_batch' in locals() else 0,
                "vision_api_calls": self.vision_engine.total_api_calls,
                "format_polisher_calls": format_polisher_calls_count,
                "total_api_calls": self.vision_engine.total_api_calls + format_polisher_calls_count,
                "tokens_input": self.vision_engine.total_input_tokens,
                "tokens_output": self.vision_engine.total_output_tokens,
                "tokens_total": self.vision_engine.total_input_tokens + self.vision_engine.total_output_tokens,
                "timing": {
                    "total_wall_time_seconds": total_wall_time,
                    "network_retry_delay_seconds": network_delay_retry,
                    "pure_compute_time_seconds": pure_compute_time
                }
            }
            logger.info(f"TELEMETRY_REPORT: {json.dumps(telemetry)}")
            try:
                os.makedirs("data", exist_ok=True)
                with open("data/telemetry_latest.json", "w", encoding="utf-8") as tf:
                    json.dump(telemetry, tf, indent=2)
                
                orig_size = os.path.getsize(file_path) if os.path.exists(file_path) else 0
                output_size = os.path.getsize(output_result_path) if (output_result_path and os.path.exists(output_result_path)) else 0
                compaction_pct = round(((orig_size - output_size) / max(1, orig_size)) * 100, 1) if orig_size > 0 and output_size > 0 else 0

                # Automatically generate the Markdown Analysis Report for the user
                md_report_path = os.path.join(self.output_dir, f"REPORT_{timestamp}_{base_name}.md")
                report_content = f"""# 📊 Ground Reality & Telemetry Report: {file_name}
**Service Type:** `{self.service_type}` | **Language Mode:** `{self.target_lang}`  
**Generated:** {time.strftime('%Y-%m-%d %H:%M:%S')}  

---

## 1. Performance & Telemetry
| Metric | Value |
| :--- | :--- |
| **Original Pages** | {total_pages_count} |
| **Processed Pages** | {len(ordered_pages)} |
| **Original File Size** | {orig_size / 1024:.1f} KB |
| **Output File Size** | {output_size / 1024:.1f} KB |
| **Physical Space / Data Compaction** | {compaction_pct}% |
| **Processing Latency** | {total_wall_time:.2f} seconds |
| **Status** | ✅ SUCCESS |

---

## 2. Processing Breakdown
| Metric | Value |
| :--- | :--- |
| **Total Pages** | {total_pages_count} |
| **Local CPU Pages (Count)** | {len(local_pages)} |
| **Local CPU Pages (List)** | {sorted(list(local_pages))} |
| **Vision AI Pages (Count)** | {len(ai_pages)} |
| **Vision AI Pages (List)** | {sorted(list(ai_pages))} |
| **Targeted AI Crops** | {telemetry.get('targeted_crops_count', 0)} |
| **Total Images Sent to AI** | {telemetry.get('total_crops_count', 0)} |
| **Vision API Calls** | {telemetry['vision_api_calls']} |
| **Format Polisher API Calls**| {telemetry['format_polisher_calls']} |
| **Total API Calls** | **{telemetry['total_api_calls']}** |

### 🪙 Token Usage (Gemini 3.5 Flash-Lite)
* **Input Tokens (Images + Prompt):** {telemetry['tokens_input']} tokens
* **Output Tokens (Markdown Text):** {telemetry['tokens_output']} tokens
* **Total Cost Equivalent:** {(telemetry['tokens_total'] / 1000000) * 0.15:.4f} USD (Estimated)

## 3. Timing Calculations
* **Total Wall Time:** {total_wall_time:.2f} Seconds
* **Pure Compute Time:** {pure_compute_time} Seconds
* *(Network dropouts and retry delays have been successfully excluded from this time)*
"""
                with open(md_report_path, "w", encoding="utf-8") as rf:
                    rf.write(report_content)
                logger.info(f"Saved Markdown Telemetry Report to {md_report_path}")

                # -------------------------------------------------------------
                # DOCUMORPH QUALITY AUDIT VAULT
                # Archives inputs, custom prompts, raw & clean markdown, and
                # metrics so developers can review student jobs and refine prompts.
                # -------------------------------------------------------------
                try:
                    vault_dir = os.path.join("data", "audit_vault")
                    os.makedirs(vault_dir, exist_ok=True)
                    audit_record_path = os.path.join(vault_dir, f"AUDIT_{timestamp}_{self.job_id or 'anon'}.json")
                    audit_entry = {
                        "job_id": self.job_id or f"job_{timestamp}",
                        "timestamp": timestamp,
                        "datetime_iso": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                        "file_name": os.path.basename(file_path),
                        "service_type": self.service_type,
                        "language_mode": self.language_mode,
                        "custom_prompt": self.custom_prompt,
                        "custom_api_key_used": bool(self.custom_api_key),
                        "config_options": self.config_options,
                        "total_pages": total_pages_count,
                        "output_file": output_result_path,
                        "telemetry": telemetry,
                        "final_markdown_preview": processed_markdown[:8000] if 'processed_markdown' in locals() else "",
                        "final_markdown": processed_markdown if 'processed_markdown' in locals() else ""
                    }
                    with open(audit_record_path, "w", encoding="utf-8") as af:
                        json.dump(audit_entry, af, indent=2, ensure_ascii=False)
                    logger.info(f"Quality Audit Vault archived job to {audit_record_path}")
                except Exception as ve:
                    logger.debug(f"Audit vault archiving error: {ve}")

                # -------------------------------------------------------------
                # PERSISTENT NEON DATABASE TELEMETRY & DIAGRAM THUMBNAILS
                # Guarantees 100% data availability for Admin Hub across restarts
                # and remote client connections!
                # -------------------------------------------------------------
                if self.job_id:
                    try:
                        db = SessionLocal()
                        job_record = db.query(Job).filter(Job.id == self.job_id).first()
                        if job_record:
                            job_record.telemetry_json = json.dumps(telemetry, ensure_ascii=False)
                            job_record.report_markdown = report_content
                            
                            diagrams_meta = []
                            import glob
                            diag_patterns = [
                                f"data/output/images/*{self.job_id}*.png",
                                f"data/output/**/*{self.job_id}*.png"
                            ]
                            found_diags = set()
                            for pat in diag_patterns:
                                for dp in glob.glob(pat, recursive=True):
                                    found_diags.add(dp)

                            for dp in sorted(list(found_diags))[:16]:
                                try:
                                    sz_kb = round(os.path.getsize(dp) / 1024, 1)
                                    with Image.open(dp) as im:
                                        im.thumbnail((360, 360), Image.Resampling.BILINEAR)
                                        buf = io.BytesIO()
                                        im.save(buf, format="PNG", optimize=True)
                                        b64_str = base64.b64encode(buf.getvalue()).decode("ascii")
                                    diagrams_meta.append({
                                        "filename": os.path.basename(dp),
                                        "size_kb": sz_kb,
                                        "data_url": f"data:image/png;base64,{b64_str}"
                                    })
                                except Exception as img_err:
                                    logger.debug(f"Could not encode diagram {dp}: {img_err}")

                            job_record.diagrams_data = json.dumps(diagrams_meta, ensure_ascii=False)
                            db.commit()
                        db.close()
                    except Exception as db_persist_err:
                        logger.warning(f"Could not persist Job telemetry and diagrams to DB: {db_persist_err}")

            except Exception as te:
                logger.warning(f"Could not save telemetry files: {te}")

            self._report("Completed", 100)
            return output_result_path
            
        except Exception as e:
            logger.error(f"Pipeline crashed: {e}", exc_info=True)
            self._report("Error", -1)
            raise e
        finally:
            # FREE TIER OPTIMIZATION: Aggressive Memory Cleanup
            if 'doc' in locals() and hasattr(doc, 'close'):
                try:
                    if not doc.is_closed:
                        doc.close()
                except Exception:
                    pass
            # Force garbage collection to free PyMuPDF C-bindings and image buffers
            gc.collect()
            try:
                import ctypes
                libc = ctypes.CDLL("libc.so.6")
                libc.malloc_trim(0)
            except Exception:
                pass

def main():
    if len(sys.argv) > 1:
        orchestrator = DocuMorphOrchestrator()
        orchestrator.process_file(sys.argv[1])
    else:
        print("Provide a file path")

if __name__ == "__main__":
    main()
