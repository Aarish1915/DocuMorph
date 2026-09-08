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

from documorph.core.crop_sweeper import LightningSweeper
from documorph.core.native_extractor import NativeExtractor
from documorph.core.batch_vision import BatchVisionEngine
from documorph.core.format_polisher import polish_markdown

from documorph.postprocessing.spam_filter import SpamFilter
from documorph.postprocessing.hindi_handler import HindiHandler
from documorph.postprocessing.format_fixer import FormatFixer
from documorph.compilers.pdf_compiler import PDFCompiler
from documorph.core.database import SessionLocal, PageResult

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
        custom_prompt: str = None
    ):
        load_dotenv(find_dotenv(), override=True)
        self.job_id = job_id
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
            to_lang = self.config_options.get("to_language", "")
            if to_lang:
                language_mode = to_lang
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
            language_mode=language_mode
        )
        
        self.spam_filter = SpamFilter(custom_spam_words=spam_words)
        self.hindi_handler = HindiHandler(mode=self.target_lang)
        self.format_fixer = FormatFixer()
        self.pdf_compiler = PDFCompiler()
        
        self.output_dir = "data/output/needs_review"
        os.makedirs(self.output_dir, exist_ok=True)
        
    def _report(self, status: str, pct: int):
        logger.info(f"Progress: {pct}% - {status}")
        self.progress_callback(status, pct)

    def _process_compression(self, doc, file_path: str, timestamp: int, base_name: str) -> str:
        self._report("Compressing PDF...", 25)
        remove_images = self.config_options.get("images") == "remove"
        strip_metadata = self.config_options.get("strip_metadata", True)
        remove_duplicates = self.config_options.get("remove_duplicates", True)

        output_path = os.path.join(self.output_dir, f"COMPRESSED_{timestamp}_{base_name}.pdf")

        if strip_metadata:
            try:
                doc.set_metadata({})
            except Exception as e:
                logger.warning(f"Could not clear metadata: {e}")

        if remove_images:
            self._report("Stripping images from PDF...", 40)
            for page in doc:
                try:
                    for img in page.get_images():
                        try:
                            page.delete_image(img[0])
                        except Exception:
                            pass
                except Exception:
                    pass

        self._report("Optimizing and deflating streams...", 70)
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
        self._report(f"Compression Complete (-{saved_pct}%)", 100)
        return output_path

    def process_file(self, file_path: str) -> str:
        start_time = time.time()
        timestamp = int(start_time)
        file_name = Path(file_path).name
        base_name = file_name.replace(".pdf", "")
        
        self._report("Initializing Document...", 5)
        
        try:
            doc = fitz.open(file_path)
            total_pages_count = len(doc)
            
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

            if self.service_type == "compress" and self.config_options.get("quality") == "bytes_only":
                res = self._process_compression(doc, file_path, timestamp, base_name)
                doc.close()
                return res
            
            # 1. LIGHTNING SWEEPER
            self._report("Lightning Sweep (Profiling Pages)...", 10)
            sweeper = LightningSweeper(doc)
            classifications = sweeper.sweep()
            
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
                    if page_num in cached_pages:
                        final_markdown_pages[page_num] = cached_pages[page_num]
                        continue
                    cls = classifications.get(page_num, "clean")
                    page = doc[page_num]
                    
                    if cls == "complex" or cls == "corrupted":
                        # Full page image for Native Multi-Part
                        zoom = 2.0
                        mat = fitz.Matrix(zoom, zoom)
                        pix = page.get_pixmap(matrix=mat)
                        img_path = os.path.join(temp_dir, f"full_{page_num}.png")
                        pix.save(img_path)
                        # Mark this page to be processed in the full-page batch
                        crops_to_batch.append({
                            "type": "full_page", 
                            "page_num": page_num, 
                            "path": img_path
                        })
                    else:
                        # Clean page: Local extract + targeted crops
                        page_data = self.native_extractor.extract_page(doc, page_num)
                        page_md_blocks = []
                        for idx, item in enumerate(page_data.get("items", [])):
                            if item["type"] == "text":
                                page_md_blocks.append(item["data"])
                            elif item["type"] == "crop":
                                bbox = item["data"]
                                rect = fitz.Rect(bbox[0], bbox[1], bbox[2], bbox[3])
                                mat = fitz.Matrix(2.0, 2.0)
                                pix = page.get_pixmap(matrix=mat, clip=rect)
                                crop_path = os.path.join(temp_dir, f"crop_{page_num}_{idx}.png")
                                pix.save(crop_path)
                                crops_to_batch.append({
                                    "type": "crop",
                                    "page_num": page_num,
                                    "path": crop_path,
                                    "block_idx": len(page_md_blocks) # Save where to inject
                                })
                                page_md_blocks.append(f"<!-- CROP_PLACEHOLDER_{page_num}_{idx} -->")
                        
                        final_markdown_pages[page_num] = page_md_blocks

                # 3. NATIVE MULTI-PART BATCHING
                if crops_to_batch:
                    self._report(f"AI Reading: Preparing {len(crops_to_batch)} pages...", 40)
                    batch_size = 10 # Restored from 1 back to 10 for multi-part batching (~5 API calls per 50 pages)
                    
                    full_pages_count = sum(1 for c in crops_to_batch if c["type"] == "full_page")
                    targeted_crops_count = sum(1 for c in crops_to_batch if c["type"] == "crop")
                    logger.info(f"TELEMETRY_CROPS: total={len(crops_to_batch)}, full_page={full_pages_count}, targeted={targeted_crops_count}")
                    
                    async def process_all_chunks():
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
                        # Use a semaphore to prevent SSL dropped connections from Google's API
                        semaphore = asyncio.Semaphore(15) 
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

            # 4. SMART POLISHING (Format local pages into clean headings, subheadings, and vertical bullet lists)
            self._report("Smart Polishing (Formatting Headings & Lists)...", 70)
            
            def polish_page_worker(p_idx, text):
                # Sanitize promotional spam BEFORE polishing so fee banners do not become H1 titles!
                sanitized_text = self.spam_filter.clean_text(text)
                # Only polish local pages that have sufficient text content
                if p_idx in local_pages and len(sanitized_text.strip()) > 60:
                    try:
                        return p_idx, polish_markdown(sanitized_text)
                    except Exception as e:
                        logger.warning(f"Error polishing page {p_idx}: {e}")
                        return p_idx, sanitized_text
                return p_idx, sanitized_text

            polished_pages = {}
            with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
                futures = [
                    pool.submit(polish_page_worker, p, "\n".join(final_markdown_pages[p]))
                    for p in range(len(final_markdown_pages))
                ]
                for f in concurrent.futures.as_completed(futures):
                    idx, text = f.result()
                    polished_pages[idx] = text

            format_polisher_calls_count = sum(
                1 for p in local_pages if len("\n".join(final_markdown_pages.get(p, []))) > 60
            )
            logger.info(f"Smart Polisher formatted {format_polisher_calls_count} local pages.")

            ordered_pages = [polished_pages[p] for p in range(len(final_markdown_pages))]
            raw_markdown = "\n\n---\n\n".join(ordered_pages)

            # Persist PageResult records for review & selective page reprocessing
            if self.job_id:
                try:
                    db = SessionLocal()
                    for p_idx, p_text in polished_pages.items():
                        pr = db.query(PageResult).filter(
                            PageResult.job_id == self.job_id,
                            PageResult.page_number == p_idx + 1
                        ).first()
                        if not pr:
                            pr = PageResult(job_id=self.job_id, page_number=p_idx + 1)
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
            processed = self.hindi_handler.process_text(processed)
            if fix_spacing:
                processed = self.format_fixer.fix_markdown(processed)

            # 6. OUTPUT COMPILATION BASED ON SERVICE TYPE
            output_result_path = None
            if self.service_type == "extract_text":
                out_fmt = str(self.config_options.get("output_format", "markdown")).lower()
                if "raw" in out_fmt or "txt" in out_fmt:
                    import re
                    plain_text = re.sub(r'#+\s*', '', processed)
                    plain_text = re.sub(r'\*{1,3}(.*?)\*{1,3}', r'\1', plain_text)
                    plain_text = re.sub(r'<!--.*?-->', '', plain_text)
                    txt_path = os.path.join(self.output_dir, f"EXTRACTED_{timestamp}_{base_name}.txt")
                    with open(txt_path, "w", encoding="utf-8") as f:
                        f.write(plain_text.strip())
                    output_result_path = txt_path
                    self._report("Text Extraction Complete (.txt)", 95)
                elif "json" in out_fmt:
                    json_data = {
                        "file_name": file_name,
                        "service_type": "extract_text",
                        "total_pages": len(ordered_pages),
                        "pages": [
                            {"page_number": idx + 1, "content": p_content}
                            for idx, p_content in enumerate(ordered_pages)
                        ]
                    }
                    json_path = os.path.join(self.output_dir, f"EXTRACTED_{timestamp}_{base_name}.json")
                    with open(json_path, "w", encoding="utf-8") as f:
                        json.dump(json_data, f, indent=2, ensure_ascii=False)
                    output_result_path = json_path
                    self._report("Text Extraction Complete (.json)", 95)
                else:
                    md_path = os.path.join(self.output_dir, f"EXTRACTED_{timestamp}_{base_name}.md")
                    with open(md_path, "w", encoding="utf-8") as f:
                        f.write(processed.strip())
                    output_result_path = md_path
                    self._report("Text Extraction Complete (.md)", 95)

            elif self.service_type == "translate" and "md" in str(self.config_options.get("output_format", "")).lower():
                md_path = os.path.join(self.output_dir, f"TRANSLATED_{timestamp}_{base_name}.md")
                with open(md_path, "w", encoding="utf-8") as f:
                    f.write(processed.strip())
                output_result_path = md_path
                self._report("Translation Complete (.md)", 95)

            else:
                self._report("Compiling Final PDF...", 90)
                final_pdf_path = os.path.join(self.output_dir, f"FINAL_{timestamp}_{base_name}.pdf")
                compact_mode = "standard"
                if self.service_type == "compress":
                    quality = self.config_options.get("quality", "balanced")
                    compact_mode = "ultra_dense" if quality in ("max", "ultra_dense") else "compact"
                self.pdf_compiler.compile(processed, final_pdf_path, compact_mode=compact_mode)
                output_result_path = final_pdf_path

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
                
                # Automatically generate the Markdown Analysis Report for the user
                md_report_path = os.path.join(self.output_dir, f"REPORT_{timestamp}_{base_name}.md")
                report_content = f"""# 📊 Ground Reality & Telemetry Report

## 1. Processing Data for {file_name}
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

## 2. Timing Calculations (Pure Compute)
* **Total Compute Time:** {pure_compute_time} Seconds
* *(Network dropouts and retry delays have been successfully excluded from this time)*
"""
                with open(md_report_path, "w", encoding="utf-8") as rf:
                    rf.write(report_content)
                logger.info(f"Saved Markdown Telemetry Report to {md_report_path}")

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

def main():
    if len(sys.argv) > 1:
        orchestrator = DocuMorphOrchestrator()
        orchestrator.process_file(sys.argv[1])
    else:
        print("Provide a file path")

if __name__ == "__main__":
    main()
