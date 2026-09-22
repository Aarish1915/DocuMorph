---
timestamp_ist: "2026-09-22 14:10:00 IST"
timestamp_utc: "2026-09-22T08:40:00Z"
step_index: "Active_Planning"
status: "CURRENT_ACTIVE"
tool_action: "master_latency_and_scale_plan"
overwritten_by: "None (Currently Active)"
title: "Master Plan: Restoring Sub-30s PDF Pipeline, Table/Math Quality, Modular Frontend & 100k Concurrency Architecture"
description: "Forensic root-cause plan resolving 10m vs 30s 50-page PDF latency regression, fixing table/math formatting, modularizing CSS, and hardening for 100k scale."
---

# Master Plan: Restoring Sub-30s PDF Pipeline, Table/Math Quality, Modular Frontend & 100k Concurrency Architecture

**Date:** September 22, 2026 (14:10 IST)  
**Status:** `CURRENT_ACTIVE`  
**Governing Standard:** Global Agent Rules, Senior Reviewer 5-Question Checklist, Usability Heuristics & GSD Protocol

---

## Problem Diagnosis & Root Cause Analysis

### 1. Why 50-Page PDFs Took 10 Minutes (vs Past 30 Seconds)
Our forensic investigation into `documorph/core/crop_sweeper.py`, `documorph/worker/pipeline.py`, and `documorph/core/native_extractor.py` revealed three compounding bottlenecks:

1. **Catastrophic False-Positive in `crop_sweeper.py` (Line 72)**:
   - `has_ocr_noise = bool(re.search(r'[-:]{3,}|(?::\s*-\s*:)|(?:\(\s*\)\s*-\s*:)', text))` matched standard markdown horizontal rules `---`, table separators `|---|`, and syllabus dashes.
   - Crucially, this check ran **before** the digital fast-path check.
   - **Impact**: Virtually every digital academic note containing `---` or tables was falsely classified as `corrupted` or `complex`.
   - Instead of extracting text natively in 15ms via PyMuPDF, **all 50 pages were rendered as uncompressed JPEG images and dispatched to Gemini Vision AI**.
2. **Gemini Vision Multi-Modal Bottleneck & API Quotas**:
   - 50 full-page images across batches of 5 = 10 full-page multi-modal AI inference calls.
   - Concurrency clamped to `Semaphore(3)` caused serial execution of 30s requests.
   - Hit Gemini's 15 RPM rate limit, triggering exponential backoff retries (300s–600s total wait).
3. **Blocking `asyncio.run()` Calls in Loops (`pipeline.py`)**:
   - Calls to `asyncio.run(self.vision_engine.translate_text_direct(...))` at lines 403, 511, and 594 inside async functions blocked the event loop.
4. **Redundant Vision Calls for Tables in `NativeExtractor`**:
   - Native tables were cropped as images and routed to Gemini Vision instead of leveraging PyMuPDF's built-in `tab.to_markdown()`, which executes in <0.1ms with 100% character precision.

---

## User Review Required

> [!IMPORTANT]
> **Digital Fast-Path Restoration**: Digital native PDFs (having >=100 readable characters and no full-page scan image) will be processed 100% locally via PyMuPDF (`NativeExtractor` + `tab.to_markdown()`), reducing 50-page processing time from 600s down to ~15–30s. Only true scanned pages (photocopies/handwritten notes with `image_ratio >= 0.25` and no digital text) will use Gemini Vision AI.

> [!IMPORTANT]
> **Modular Styling (No Monolithic CSS)**: We will divide `app.css` into clean, maintainable modular stylesheets: `workspace.css`, `homeComponents.css`, `admin.css`, and `footer.css`. Monolithic dumping is strictly prohibited.

---

## Proposed Changes

### Component 1: Pipeline Latency & Page Classification (<30s for 50 Pages)

#### [MODIFY] [crop_sweeper.py](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/documorph/core/crop_sweeper.py)
- Reorder checks: place the **Digital Fast-Path** first. If a page has `total_chars >= 100` and readable ratio >= 0.70 without a dominant background scan (`image_ratio < 0.25`), classify as `"clean"` immediately.
- Refine `has_ocr_noise`: do NOT match isolated `---` (markdown rules). Match true repeated OCR separator noise like `(?::\s*-\s*:){2,}` or `(?:\(\s*\)\s*-\s*:){2,}`.
- Refine vector complexity: do not classify a digital page with selectable text as `complex` just because it has 5 table cells or bullet shapes (`crop_count >= 5`).

#### [MODIFY] [native_extractor.py](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/documorph/core/native_extractor.py)
- For native tables identified by `page.find_tables()`, call `tab.to_markdown()` directly to generate markdown table syntax instantly without sending images to Vision AI.
- Siphon math equations directly from digital text streams, formatting them as clean LaTeX without generating unnecessary crop images.

#### [MODIFY] [pipeline.py](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/documorph/worker/pipeline.py)
- Replace blocking `asyncio.run()` calls in loops (lines 403, 511, 594) with proper `await` calls inside `async def process_all_chunks()` and parallel `asyncio.gather`.
- Optimize batching for any remaining scanned pages.

---

### Component 2: Formatting Integrity (Tables & Math)

#### [MODIFY] [format_fixer.py](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/documorph/postprocessing/format_fixer.py)
- Fix markdown table pipe regex: ensure `([^\n|])\n(\|)` does not break table lines or drop table header separators (`|---|---|`).
- Protect LaTeX delimiters `$$ ... $$` and `\( ... \)` from markdown emphasis asterisks and underscores.

---

### Component 3: Modular Frontend Styling & Admin Telemetry

#### [NEW] [workspace.css](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/frontend/src/styles/workspace.css)
- Component-scoped CSS for CleanNotes Studio (`Workspace.jsx`, `ToolTabs.jsx`, `DropZone.jsx`, `ProcessButton.jsx`, `ProgressTracker.jsx`, `ResultCard.jsx`, `SettingsPanel.jsx`).

#### [NEW] [homeComponents.css](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/frontend/src/styles/homeComponents.css)
- Component-scoped CSS for `HeaderBanner.jsx`, `AcademicScoreboard.jsx`, `HowItWorksThreePass.jsx`, `AspirantTestimonials.jsx`, and `DonorTicker.jsx`.

#### [NEW] [admin.css](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/frontend/src/styles/admin.css)
- Component-scoped CSS for `AdminDashboardModal.jsx` and telemetry inspection.

#### [NEW] [footer.css](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/frontend/src/styles/footer.css)
- Component-scoped CSS for `Footer.jsx` and legal badges.

#### [MODIFY] [index.css](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/frontend/src/index.css)
- Import all modular stylesheets cleanly.
- Delete or replace monolithic `app.css`.

#### [MODIFY] [AdminDashboardModal.jsx](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/frontend/src/components/admin/AdminDashboardModal.jsx)
- Ensure 2.5s telemetry polling does not reset active row selection.
- Connect full page markdown and diagram inspection tabs to `/api/internal/admin/jobs/{job_id}/details`.

---

### Component 4: 100k Concurrency & Cyber Shield

#### [MODIFY] [main.py](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/documorph/api/main.py)
- Enforce 50MB stream upload ceiling (`HTTP 413`).
- Pre-flight PDF dimension bomb kill-gate (reject pages > 3500pt with `HTTP 400`).
- Strict parameter regex validation (`^[a-zA-Z0-9_\-]+$`) on all job and download endpoints.
- Database unique constraint handling with transactional rollback.

#### [NEW] [stress_test_100k.py](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/tests/load/stress_test_100k.py)
- Multi-threaded load testing script simulating 100–500 concurrent requests across upload, polling, review, and download paths.

---

## Verification Plan

### Automated Tests
1. **Pytest Unit Tests**:
   ```powershell
   python -m pytest tests/unit -q
   ```
2. **Pytest Integration Tests**:
   ```powershell
   python -m pytest tests/integration -q
   ```
3. **50-Page PDF Benchmark Test**:
   ```powershell
   python scripts/benchmark_50_pages.py
   ```
   Verify 50-page digital PDF processes in <30 seconds.
4. **Frontend Production Build**:
   ```powershell
   cd frontend; npm run build
   ```

### Manual Verification
1. Inspect `http://localhost:5173/` across desktop and mobile.
2. Verify Admin Panel at `/#admin`.
