---
timestamp_ist: "2026-09-22 13:55:00 IST"
timestamp_utc: "2026-09-22T08:25:00Z"
step_index: "Active_Planning"
status: "CURRENT_ACTIVE"
tool_action: "master_architecture_planning"
overwritten_by: "None (Currently Active)"
title: "Master Architecture & Production Plan: Backend Latency, CI Acceleration, Modular UI Overhaul & 100k Concurrency Suite"
description: "Master Implementation Plan resolving 10m deployment latency, table/math/diagram pipeline quality, real-time admin desync, modular frontend styling, and 100k defensive cyber resilience."
---

> **Plan Status: `CURRENT_ACTIVE`**  
> **Timestamp:** Tuesday, September 22, 2026 at 01:55:00 PM IST (2026-09-22T08:25:00Z)  
> **Lifecycle Note:** Active current plan.

---

# Master Architecture & Production Plan: Backend Latency, CI Acceleration, Modular UI Overhaul & 100k Concurrency Suite

**Date:** September 22, 2026 (13:55 IST)  
**Status:** `CURRENT_ACTIVE`  
**Governing Standard:** Global Agent Rules, Senior Reviewer 5-Question Checklist, Usability Heuristics & GSD Protocol

---

## Executive Summary & Problem Diagnosis

Based on exhaustive analysis of the codebase, conversation history, and user requirements, four critical engineering bottlenecks must be resolved:

1. **10-Minute Deployment & CI Latency:** The current `Dockerfile` downloads Node.js, installs Playwright Chromium with 500MB+ of Linux dependencies, and builds the frontend on every commit without caching. This pushes deployment time to ~10 minutes.
2. **Backend Table, Math, and Image Degradation:** Tables suffer from broken markdown pipes or concatenated rows, LaTeX formulas are occasionally disrupted by markdown parser interference, and diagram cropping needs strict sub-pixel text boundary protection.
3. **Admin Panel Real-Time Desync:** The Admin Dashboard lacks instant real-time telemetry updates and detailed page-level drill-down for active and completed jobs.
4. **Broken / Unstyled Frontend State:** The newly created CleanNotes Studio workspace (`Workspace.jsx`) uses classes defined in `app.css`, which was never imported into the application, causing unstyled layout collapse. Furthermore, code must be modularized into clean, component-scoped files rather than dumped into a monolithic stylesheet.
5. **100k Concurrency & Cyber Resilience:** The platform must withstand viral bursts of 100–500 req/min within a 512MB RAM container budget, protected by pre-flight dimension kill-gates, 50MB stream ceilings, proxy-aware rate limiters, and ACID unique constraints.

---

## User Review Required

> [!IMPORTANT]
> **Docker Build Decoupling**: We propose a multi-stage Docker build that caches Playwright Chromium and Node dependencies, reducing cloud build times from ~10 minutes down to ~90 seconds.
> **Modular Styling Policy**: Stylesheets will be strictly component-scoped (`workspace.css`, `homeComponents.css`, `admin.css`, `footer.css`, `DesignTokens.css`) to prevent monolithic CSS bloat and make debugging instantaneous.

---

## Proposed Changes

### Phase 1: Docker & CI Deployment Acceleration (<90s Deploys)
- **Problem:** Every git push triggers a monolithic Docker build that re-downloads system packages, Chromium, and compiles the frontend from scratch.
- **Solution:**
  - Implement a **Multi-Stage Dockerfile** with layer caching.
  - Stage 1 (`frontend-builder`): Uses `node:20-alpine` with cached `package.json` layer to compile the static frontend bundle.
  - Stage 2 (`runtime`): Uses `python:3.10-slim`, installs Python dependencies first, installs Playwright with `--no-install-recommends`, and copies the pre-built frontend from Stage 1 into the static directory.
  - Changes:
    - [MODIFY] [Dockerfile](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/Dockerfile)
    - [MODIFY] [.github/workflows/ci.yml](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/.github/workflows/ci.yml)

### Phase 2: Backend Pipeline Quality & Real-Time Admin Telemetry
- **Table Integrity:**
  - In [format_fixer.py](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/documorph/postprocessing/format_fixer.py), tighten regex `([^\n|])\n(\|)` to ensure markdown table pipe formatting never splits rows across lines or drops table header lines.
  - In [native_extractor.py](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/documorph/core/native_extractor.py), ensure structured tables extracted via PyMuPDF `find_tables()` format cleanly into HTML `<table>` or valid GitHub-flavored Markdown.
- **Math Formula Shield:**
  - Protect LaTeX math delimiters (`$$ ... $$` and `\( ... \)`) against markdown emphasis tag collisions (`_` and `*`) by siphoning variables before markdown parsing.
- **Diagram & Image Precision:**
  - Enforce sub-pixel collision-aware text clearance in [diagram_extractor.py](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/documorph/core/diagram_extractor.py) and [pipeline.py](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/documorph/worker/pipeline.py), fusing Bézier drawing strokes (`page.get_drawings()`) so formulas, axes, and circuit paths are 100% preserved.
- **Admin Real-Time Telemetry & Drill-Down:**
  - In [admin_router.py](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/documorph/api/admin_router.py), enhance `/api/internal/admin/jobs/{job_id}/details` and `/telemetry` to return full intermediate page markdown, crop thumbnails, OCR token timings, and system RSS memory.
  - In [AdminDashboardModal.jsx](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/frontend/src/components/admin/AdminDashboardModal.jsx), implement smooth 2.5s polling that preserves selected job focus, displays full detail drill-down tabs, and prevents list flickering.

### Phase 3: Modular Frontend Architecture & Visual Polish
- **Modular Stylesheets (No Monolithic Dumping):**
  - Break down styling into component-scoped, organized CSS modules:
    - `src/styles/workspace.css`: High-focus CleanNotes Studio (`Workspace.jsx`, `ToolTabs.jsx`, `DropZone.jsx`, `ProcessButton.jsx`, `ProgressTracker.jsx`, `ResultCard.jsx`, `SettingsPanel.jsx`).
    - `src/styles/homeComponents.css`: `HeaderBanner.jsx`, `AcademicScoreboard.jsx`, `MetricsStatGrid.jsx`, `HowItWorksThreePass.jsx`, `AspirantTestimonials.jsx`.
    - `src/styles/admin.css`: `AdminDashboardModal.jsx` and telemetry inspection modals.
    - `src/styles/footer.css`: Responsive multi-column `Footer.jsx` and legal badges.
    - `src/DesignTokens.css`: Midnight Sapphire & Carbon Slate variables, 4 radius tokens, font stacks.
    - `src/index.css`: Global baseline, typography, reset, importing all modular files.
  - Remove redundant monolithic `app.css` to prevent confusion.
- **Cohesive User Experience:**
  - Top: Live Rotating Donor Ticker (`HeaderBanner.jsx`).
  - Header: Sleek responsive header with active tool badges and standalone admin escape link.
  - Core Studio: Single-stage CleanNotes Workspace with tactile 1-click sample pills, custom setting toggles, real-time bandwidth meter, animated 5-stage progress tracker, and result card with direct download.
  - Social Proof: Academic Scoreboard ("Not a Claim — A Scoreboard"), 3-Pass Engine explanation, Aspirant Reviews with category filter tabs.
  - Footer: Multi-column authoritative directory with tool quick-links, legal pages, and copyright notice.

### Phase 4: 100k Concurrency, Cloud RAM Sizing & Defensive Cyber Shield
- **Worker Concurrency Clamp:**
  - Clamp `queue_worker.py` semaphore to `asyncio.Semaphore(2)` on 512MB RAM cloud environments (Render Free), scalable to `asyncio.Semaphore(10)` on a dedicated VPS.
- **Zero-Trust Ingress Defenses:**
  - 50MB chunked streaming upload ceiling in `main.py` (`HTTP 413`).
  - 3500pt pre-flight PDF dimension bomb kill-gate (`HTTP 400`).
  - Proxy-aware token bucket rate limiter prioritizing `CF-Connecting-IP`.
  - Strict parameter regex whitelisting (`^[a-zA-Z0-9_\-]+$`) on all job and download endpoints.
  - Database-level unique constraint on `donations.utr_number` with transactional rollback (`IntegrityError`).
- **100k Stress Testing Tool:**
  - Build `tests/load/stress_test_100k.py` to simulate 100 to 500 concurrent students performing upload, telemetry polling, review submission, and download operations, asserting:
    - 0 unhandled 500 errors.
    - Container RAM RSS stability (<250MB baseline).
    - Sub-30s turnaround time on standard documents.

---

## Verification Plan

### Automated Test Suites
1. **Pytest Unit Tests:**
   ```powershell
   python -m pytest tests/unit -q
   ```
2. **Pytest Integration Tests:**
   ```powershell
   python -m pytest tests/integration -q
   ```
3. **Frontend Production Build:**
   ```powershell
   cd frontend; npm run build
   ```
4. **100k Concurrency Stress Benchmark:**
   ```powershell
   python tests/load/stress_test_100k.py --concurrent 50 --requests 500
   ```

### Manual & Visual Verification
1. Inspect local frontend on `http://localhost:5173/` across Desktop (1280px) and Mobile (375px) viewports:
   - Verify CleanNotes Studio styling renders with zero unstyled CSS.
   - Verify tool tabs switch instantly between Clean, Compress, Extract, and Translate.
   - Verify DropZone accepts PDF and sample triggers populate settings.
   - Verify Academic Scoreboard, 3-Pass cards, and Aspirant Reviews render cleanly.
2. Log into Admin Panel at `/#admin` with bootstrap credentials:
   - Verify real-time metrics (RAM RSS, queue size, CPU) update every 2.5s.
   - Click a job row and verify full telemetry report, intermediate markdown, and crop thumbnails load without errors.
