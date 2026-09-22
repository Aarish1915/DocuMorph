---
timestamp_ist: "2026-09-20 14:13:50 IST"
timestamp_utc: "2026-09-20T08:43:50Z"
step_index: 9222
status: "OVERWRITTEN"
tool_action: "write_to_file"
overwritten_by: "Step 9547 on 2026-09-20 15:12:51 IST ('Production Engineering Plan: Security Hardening, 10k–100k Scaling, Top-Tier Dark Mode & SEO Domination')"
title: "Production Transformation & Engineering Plan: Cockpit Polish, Latency Reduction & Global Launch Readiness"
description: "Create implementation plan artifact for processing cockpit redesign, latency optimization, and legal/SEO roadmap"
---

> **Plan Status: `OVERWRITTEN`**  
> **Timestamp:** Sunday, September 20, 2026 at 02:13:50 PM IST (2026-09-20T08:43:50Z)  
> **Transcript Step:** `9222`  
> **Lifecycle Note:** This plan was later replaced/overwritten by Step 9547 on 2026-09-20 15:12:51 IST ('Production Engineering Plan: Security Hardening, 10k–100k Scaling, Top-Tier Dark Mode & SEO Domination')

---

# Production Transformation & Engineering Plan: Cockpit Polish, Latency Reduction & Global Launch Readiness

## 1. Executive Summary & Problem Breakdown

This engineering plan directly addresses the three core issues raised:

1. **"Last page is not perfect"**:
   - **Root Cause**: The processing view currently displays legacy wizard relics (`Step 4 of 4` with 4 purple dashes in `Header.jsx`), and `ProgressCard.jsx` sits as an ungrounded white box floating in a sterile void without ambient depth, document telemetry (filename, pages, preset), or an alive AI cockpit feel.
   - **Fix**: Re-architect `Header.jsx` to eliminate wizard dashes during processing, and overhaul `ProgressCard.jsx` and `progress.css` into a **State-of-the-Art AI Cockpit**: ambient radial backdrop aura, top document telemetry bar (filename, page count, target mode, live stopwatch), connected glowing pipeline stages with pulse radar, sleek terminal-grade live milestone ticker, and a grand completion reveal with direct universal one-click download.

2. **"Latency analysis: Why 1min+ and how much can we reduce it?"**:
   - **Root Cause**: In multi-page documents (e.g., 5-page PDF), Gemini Vision decode latency is sequential (generating ~5,000-8,000 tokens across all pages takes ~30-45s on Gemini Free Tier), combined with Playwright MathJax CDN wait (8-12s) and PyMuPDF disk rendering (3-5s), totaling ~55-65s.
   - **Optimization Strategy**:
     - **Micro-Batch Concurrency (`asyncio.gather`)**: Instead of 1 monolithic 10-page batch, partition pages into chunks of 2-3 pages executed concurrently across API keys in `APIRouter`. Two parallel decode streams cut LLM generation time in half (from ~35s down to ~17s).
     - **RTK/Caveman Token Compression**: Strip ~60 redundant conversational lines from the system prompt in `batch_vision.py`, reducing TTFT (Time-to-First-Token) by ~40%.
     - **MathJax Conditional Bypass & Local Caching**: Skip MathJax CDN wait when no LaTeX formulas exist in the document, saving 8-10s.
     - **Target Latency**: Down from **60-75s to 20-26s** (a ~62% latency reduction).

3. **"What is left to make it a website for all: SEO, GEO, Legal, Penalties & Government Regulations"**:
   - Deliver an exhaustive, authoritative blueprint covering:
     - **India DPDP Act 2023 & GDPR Compliance**: Zero-retention auto-purge daemon, no-PII logging, and statutory Grievance Officer appointment.
     - **Copyright & Fair Use Defense**: Section 52(1)(a) of the Indian Copyright Act 1957 (Educational Fair Dealing) and US DMCA 512 Safe Harbor.
     - **Google Gemini GenAI Acceptable Use Policy**: Prompt boundaries and quota abuse prevention.
     - **Abuse Prevention**: Sliding-window IP rate limiting on PDF submission.
     - **SEO & Geo-Targeting**: Schema.org `WebApplication` structured data, OpenGraph tags, multilingual `hreflang` headers, and sitemap.
     - **Required Missing Pages**: FAQ, About/Mission, and DMCA/Grievance Redressal.

---

## 2. Proposed Source Code Modifications

### Component 1: Unified Modern Cockpit Navigation
- **File**: `frontend/src/components/common/Header.jsx`
- **Changes**:
  - Check `step === 4`: suppress the `Step 4 of 4` text and remove the 4-dash segment bar.
  - Render an active tool badge (`✨ Clean & Beautify` / `🌐 Translate Language`) with a live status indicator (`⚡ Processing Live`).
  - Provide a clean `← Back to Tools` or `← Cancel` button.

### Component 2: State-of-the-Art AI Cockpit Experience
- **File**: `frontend/src/components/progress/ProgressCard.jsx`
- **Changes**:
  - Add top Document Telemetry Bar: File Name, Page Count, Target Mode, and Live Stopwatch (`⏱️ 00:14`).
  - Upgrade the Hero Header with pulsing engine ring and high-precision percentage badge.
  - Implement a connected stage pipeline track with glowing connectors and active radar halo.
  - Upgrade live status console to display current granular sub-progress.
  - Enhance completion view with direct device storage download CTA, document relief badges, and reprocess drawer.

### Component 3: Premium Styling & Ambient Aura
- **File**: `frontend/src/styles/progress.css`
- **Changes**:
  - Implement `.cockpit-ambient-aura` with dynamic radial gradient backdrops.
  - Style `.cockpit-telemetry-bar`, `.cockpit-live-console`, `.stage-connector-line`, and pulsing radar rings.
  - Support full Dark Mode and Light Mode with seamless CSS variable inheritance.

### Component 4: Pipeline Latency Micro-Batching
- **File**: `documorph/worker/pipeline.py` & `documorph/core/batch_vision.py`
- **Changes**:
  - In `pipeline.py`: Reduce `batch_size` from 10 to 3 for concurrent multi-tasking via `asyncio.gather`.
  - In `batch_vision.py`: Apply token compression to system prompt rules to drop TTFT.

---

## 3. Verification & Validation Plan
1. **Automated Build Check**: Run `npm run build` in `frontend/` to ensure zero compilation or syntax errors.
2. **Backend Integrity**: Verify FastAPI health probe (`http://127.0.0.1:8000/api/health`) returns 200 OK.
3. **UI Visual Audit**: Inspect the redesigned cockpit at `#processing` to verify aesthetic depth, telemetry badges, and absence of wizard dashes.
4. **State & Decisions Governance**: Update `STATE.md`, `DECISIONS.md`, and `MISTAKES.md`.
