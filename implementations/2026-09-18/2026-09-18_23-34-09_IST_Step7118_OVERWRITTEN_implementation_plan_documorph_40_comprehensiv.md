---
timestamp_ist: "2026-09-18 23:34:09 IST"
timestamp_utc: "2026-09-18T18:04:09Z"
step_index: 7118
status: "OVERWRITTEN"
tool_action: "write_to_file"
overwritten_by: "Step 7797 on 2026-09-19 12:38:06 IST ('Forensic 17-Page Audit of `cleaned_document (3).pdf` & Fix Plan')"
title: "Implementation Plan: DocuMorph 4.0 Comprehensive Upgrade & Stability Protocol"
description: "DocuMorph 4.0 Implementation Plan: Fix translation empty/lined pages, resolve Render 512MB OOM, add real-time upload bandwidth display, auto-refresh admin queue, and unify DropZone affordance."
---

> **Plan Status: `OVERWRITTEN`**  
> **Timestamp:** Friday, September 18, 2026 at 11:34:09 PM IST (2026-09-18T18:04:09Z)  
> **Transcript Step:** `7118`  
> **Lifecycle Note:** This plan was later replaced/overwritten by Step 7797 on 2026-09-19 12:38:06 IST ('Forensic 17-Page Audit of `cleaned_document (3).pdf` & Fix Plan')

---

# Implementation Plan: DocuMorph 4.0 Comprehensive Upgrade & Stability Protocol

Fix the "empty and lining page" translation defect, resolve Render 512MB OOM crashes, add real-time upload bandwidth display, enable real-time admin queue updates, add custom spam words input, unify the hero DropZone affordance, and run full end-to-end verification across all 4 features.

## User Review Required

> [!IMPORTANT]
> **Root Cause of Empty / Lining Translated Pages**:
> 1. In `pipeline.py`, when `service_type == "translate"`, all pages were forced to `complex`, rasterizing them into 100 DPI JPEGs.
> 2. The local system environment had a dummy `GEMINI_API_KEY="AIzaSy_Your_Actual_API_Key_Here"` which masked `.env` because `load_dotenv()` lacked `override=True`.
> 3. Discontinued Gemini model names (`gemini-2.5-flash`, `gemini-1.5-flash`, `gemini-2.0-flash`) threw HTTP 404/400 errors from Google GenAI. Google now mandates `gemini-3.6-flash` / `gemini-3.5-flash`.
> 4. When the API call failed, `pipeline.py` filled the page with `<!-- AI Extraction Failed -->` HTML comments. The markdown polisher stripped these comments, leaving an empty string `""`. Joining empty strings with `\n\n---\n\n` produced `<hr>` horizontal lines in Playwright, resulting in literal empty white pages with horizontal lines.
> 5. **The Fix**: Update to active model `gemini-3.6-flash`, enforce `load_dotenv(override=True)`, implement native text extraction & text translation fallback (no unnecessary rasterization of clean text), and ensure empty/failed AI calls fall back to native text so blank lined pages are physically impossible.

> [!WARNING]
> **Render Memory Limit Exceeded (512 MB Free Tier)**:
> 1. Playwright Headless Chromium + PyMuPDF in-memory pixmaps + Uvicorn easily exceed 512 MB if 15 concurrent batches run with large JPEG buffers.
> 2. **The Fix**: Cap Chromium with container-safe flags (`--js-flags="--max-old-space-size=128"`, `--disable-dev-shm-usage`, `--single-process` on low-memory environments), reduce chunk concurrency to 3 on free tier, stream pixmaps to disk instead of keeping in-memory arrays, and run `gc.collect()` before and after rendering.

---

## Proposed Changes

### Backend: Translation Engine & Memory Hardening

#### [MODIFY] [`documorph/core/tier_manager.py`](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/documorph/core/tier_manager.py)
- Update default vision and text models to `gemini-3.6-flash` and `gemini-3.5-flash`.
- In `config.json`, update model to `gemini-3.6-flash`.

#### [MODIFY] [`documorph/core/batch_vision.py`](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/documorph/core/batch_vision.py)
- Enforce `load_dotenv(override=True)` to ensure genuine `.env` keys take precedence over dummy OS environment variables.
- Add text-only translation method for digital PDFs that already have clean selectable text.

#### [MODIFY] [`documorph/worker/pipeline.py`](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/documorph/worker/pipeline.py)
- For `service_type == "translate"`, do NOT blindly force every digital text page into a raster JPEG. If a page has native selectable text, extract the text and translate it directly.
- Add fallback: if Vision AI returns an empty or failed block, fall back to native page text with an explicit disclaimer rather than invisible HTML comments that compile to empty `<hr>` lines.
- Limit concurrent batch semaphore on low-memory hosts to prevent RAM spikes.

#### [MODIFY] [`documorph/compilers/pdf_compiler.py`](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/documorph/compilers/pdf_compiler.py)
- Add Chromium memory constraints: `--js-flags="--max-old-space-size=128"`, `--disable-background-networking`, `--disable-default-apps`.
- Explicitly run `gc.collect()` before launching and after closing Chromium.

---

### Frontend: Real-Time Upload Bandwidth, Admin Polling & Unified Upload

#### [MODIFY] [`frontend/src/App.jsx`](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/frontend/src/App.jsx)
- In `handleProcess`, replace `fetch()` with an `XMLHttpRequest` with `xhr.upload.onprogress`.
- Calculate live upload speed (`MB/s` or `KB/s`), uploaded MB / total MB, and percentage.
- Pass real-time upload metrics into `jobStatus` (`status: 'UPLOADING'`).

#### [MODIFY] [`frontend/src/components/progress/ProgressCard.jsx`](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/frontend/src/components/progress/ProgressCard.jsx)
- When `jobStatus.status === 'UPLOADING'`, render a dedicated Network Upload speed banner showing live transfer speed (e.g. `2.4 MB/s`) and byte progress before the backend queue begins.

#### [MODIFY] [`frontend/src/components/admin/AdminDashboardModal.jsx`](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/frontend/src/components/admin/AdminDashboardModal.jsx)
- In the auto-refresh effect, poll BOTH `loadStatus(token)` and `loadJobs(token)` every 3 seconds regardless of active tab when `autoRefresh` is enabled.

#### [MODIFY] [`frontend/src/components/pages/CleanFormatPage.jsx`](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/frontend/src/components/pages/CleanFormatPage.jsx)
- Under "Erase Coaching Ads & Stamps", add the custom spam words input field bound to `config.spam_words`.
- Unify the upload action: remove duplicate "Select PDF File to Clean" bottom button when no file is chosen, keeping the central hero DropZone as the sole clear affordance.

#### [MODIFY] [`frontend/src/components/workspace/DropZone.jsx`](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/frontend/src/components/workspace/DropZone.jsx)
- Make the primary `[ 📂 Choose PDF File ]` button prominent inside the drop card, with subtext `or drag & drop PDF here`.

---

## Verification Plan

### Automated Tests
1. **Backend Model & Translation Test**:
   - Run a direct Python script testing `BatchVisionEngine` with `gemini-3.6-flash`.
   - Run `DocuMorphOrchestrator` on a sample document under `service_type='translate'` and verify the output PDF contains Hindi translated text and LaTeX equations (no empty lined pages).
2. **4-Feature Benchmark (Clean & Format, Compress, Extract Text, Translate)**:
   - Run comprehensive test across all 4 services via TestClient / API.
   - Verify all 4 jobs reach `COMPLETED` status (100%) and produce valid non-empty files.
3. **Frontend Build & Linter**:
   - `npx oxlint` (0 errors, 0 warnings).
   - `npm run build` (0 build errors).

### Manual / Browser Verification
- Verify `DropZone.jsx` has the unified button.
- Verify real-time upload progress displays in `ProgressCard.jsx`.
- Verify Admin dashboard auto-updates jobs queue in real-time.
