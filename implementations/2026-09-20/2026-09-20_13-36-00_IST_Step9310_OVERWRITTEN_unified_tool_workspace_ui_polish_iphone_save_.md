---
timestamp_ist: "2026-09-20 13:36:00 IST"
timestamp_utc: "2026-09-20T08:06:00Z"
step_index: 9310
status: "OVERWRITTEN"
tool_action: "write_to_file"
overwritten_by: "Step 8998 on 2026-09-20 13:43:05 IST ('Unified Tool Workspace, UI Polish, iPhone Save Fix & UX Production Audit')"
title: "Unified Tool Workspace, UI Polish, iPhone Save Fix & UX Production Audit"
description: "Comprehensive implementation plan for reverting wizard steps, compacting language options, removing redundant upload button, fixing processing freeze, optimizing 15 AI latency drivers, and conducting UX production audit"
---

> **Plan Status: `OVERWRITTEN`**  
> **Timestamp:** Sunday, September 20, 2026 at 01:36:00 PM IST (2026-09-20T08:06:00Z)  
> **Transcript Step:** `9310`  
> **Lifecycle Note:** This plan was later replaced/overwritten by Step 8998 on 2026-09-20 13:43:05 IST ('Unified Tool Workspace, UI Polish, iPhone Save Fix & UX Production Audit')

---

# Unified Tool Workspace, UI Polish, iPhone Save Fix & UX Production Audit

## Goal Description
1. **Revert Multi-Step Wizard to Single-Page Workspace**: Eliminate the disjointed "Step 1 of 4 ... Continue to upload" flow that divided options and file upload across separate pages. Restore the intuitive, unified single-page tool layout (as in commit `77b7247`), keeping DropZone, sleek options, action CTA, and interactive before/after proof preview all on one screen.
2. **Compact `Language & Context Mode`**: Redesign the tall vertical stack into a sleek 2x2 grid or compact segmented pill bar to reclaim ~220px of vertical space and bring the CTA above the fold.
3. **Remove Redundant Bottom Button**: Delete the secondary `"Choose or drop a PDF above to clean"` button at the bottom since the primary DropZone is already visible right above the options.
4. **Fix Processing Screen Freeze & Visual Void**:
   - Eliminate the "100% frozen" visual bug by capping active progress at 92% until `status === 'COMPLETED'` is confirmed.
   - Add continuous organic micro-stepping so the progress bar and stage rings never look stalled.
   - Wrap the processing screen in a modern SaaS cockpit with ambient glow, document metadata telemetry (filename, size, mode), and reassuring typesetting status.
5. **Fix iPhone PDF Download & "Save to Files"**:
   - Guarantee `📱 Save to iPhone / Share` is visible on iOS and triggers native `navigator.share({ files })`.
   - Ensure direct download on iOS Safari triggers native `Content-Disposition: attachment; filename="Cleaned_Notes.pdf"` without "unknown sources".
   - Add direct "View in Safari (to Save to Files)" fallback link.
6. **15 AI Pipeline Latency Drivers Optimization**: Address TTFT, TPOT, Queue Time, Orchestration overhead, Prefill/Decode, and P99 latency with concrete code improvements.
7. **Complete UX Production Audit**: Audit all screens for loading/empty/error states, offline resilience, responsive layouts, theme consistency, and duplicate tap prevention.

---

## User Review Required

> [!IMPORTANT]
> **No Code Changes Until Plan Approval**: As requested, this plan outlines the exact changes across all files. No git pushes will be made.

> [!NOTE]
> **Single-Page Tool Experience**: The user will never have to click "Continue to upload" or navigate between Step 1 and Step 2. Opening any tool (`Clean & Format`, `Compress`, `Extract Text`, `Translate`) presents the full workspace immediately.

---

## Proposed Changes

### Component 1: Header & Navigation
#### [MODIFY] [Header.jsx](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/frontend/src/components/common/Header.jsx)
- Remove `Step X of 4` indicator and 4-dash segmented bar.
- Provide clean back navigation (`← All Tools`) when on a tool page.
- On desktop, display quick-switcher links (`All Tools`, `✨ Clean`, `📉 Compress`, `📋 Extract`, `🌐 Translate`).
- Maintain theme toggle (Sun/Moon) and History drawer trigger with badge count.

---

### Component 2: Tool Pages (Single-Page Unified Workspaces)
#### [MODIFY] [CleanFormatPage.jsx](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/frontend/src/components/pages/CleanFormatPage.jsx)
- Restore 2-column layout (Desktop: Workspace Cockpit on left, Real Result Proof Viewer on right; Mobile: single-column stack).
- Direct `<DropZone />` at the top of the action card.
- Compact Paper Brightness selector (3 cards: Natural Clean, Bright White, Extra Deep).
- Compact Scope selector (2 cards: Quick Test Pages 1–3, Full Document).
- Clean-up checkboxes with inline input for watermark keywords.
- Compact `Language & Context Mode` (2x2 grid).
- **Remove** redundant bottom dashed button.
- Primary Action CTA: `✨ Clean PDF Notes Now →`.

#### [MODIFY] [CompressPage.jsx](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/frontend/src/components/pages/CompressPage.jsx)
- Integrated Paper & Cost Savings Calculator with interactive slider (10 to 200 pages).
- Direct `<DropZone />`.
- Compaction layout cards (Smart Compact, Extreme Shrink, High-Res Mode).
- Diagram DPI cards (150 DPI, 200 DPI, 300 DPI).
- **Remove** redundant bottom dashed button.
- Primary Action CTA: `📉 Compress & Save Paper Now →`.

#### [MODIFY] [ExtractTextPage.jsx](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/frontend/src/components/pages/ExtractTextPage.jsx)
- Direct `<DropZone />`.
- Output format cards (Markdown, Plain Text, Structured JSON).
- Structure & LaTeX math preservation toggles.
- **Remove** redundant bottom dashed button.
- Primary Action CTA: `📋 Extract Text & Formulas Now →`.

#### [MODIFY] [TranslatePage.jsx](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/frontend/src/components/pages/TranslatePage.jsx)
- Direct `<DropZone />`.
- Target language card grid with native scripts (Hindi, Marathi, Tamil, Telugu, Bengali, Gujarati, Kannada, English) — ZERO raw `<select>`.
- Math & diagram preservation toggles.
- **Remove** redundant bottom dashed button.
- Primary Action CTA: `🌐 Translate PDF Notes Now →`.

---

### Component 3: Language & Context Selector
#### [MODIFY] [StudentExamLanguageSelector.jsx](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/frontend/src/components/common/StudentExamLanguageSelector.jsx)
- Convert from tall vertical card stack into a compact 2x2 grid with short labels:
  - `⚡ Auto (STEM / All)`
  - `📐 Hindi + Math`
  - `⚖️ English Only`
  - `🔬 STEM Pure (En+Math)`
- Reduces vertical height from ~280px to ~72px, eliminating UI bloat.

---

### Component 4: Processing Cockpit & iPhone Download / Save
#### [MODIFY] [ProgressCard.jsx](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/frontend/src/components/progress/ProgressCard.jsx)
- **Freeze Prevention**:
  - Cap active progress at 92% while `status !== 'COMPLETED'`. Never display 100% while still processing.
  - Smooth micro-stepping ticker (advances 0.12% every 60ms when progress slows down) so the UI is visibly alive.
  - Active pulsating shimmer on progress bar during typesetting.
- **iPhone "Save to Files" Fix**:
  - Direct iOS detection (`/iPad|iPhone|iPod/` or Mac with touch points).
  - Prominent `📱 Save to iPhone / Share` button using Web Share API.
  - Direct download via `window.location.assign(downloadUrl)` to invoke iOS Safari's native download dialog that saves into Files.
  - Secondary fallback link: `👁️ View in Safari (to Save to Files)`.
- **Visual Polish**:
  - Wrap in `.processing-cockpit-wrapper` with centered max-width 640px, ambient radial background glow, and document metadata header bar.

---

### Component 5: Backend & Latency Optimization (15 AI Latency Drivers)
#### [MODIFY] [documorph/worker/pipeline.py](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/documorph/worker/pipeline.py)
- **TTFT & Prefill Latency**: Downscale images in memory to max 1600px width before passing to Gemini Vision API, saving 40% payload size and prefill latency.
- **Queue Time & Orchestration Overhead**: Emit granular intermediate progress events during Playwright compilation (72% -> 78% -> 85% -> 92% -> 100%) so the client is updated continuously.
- **P99 Latency Guard**: 25-second per-batch timeout with automatic fallback to native selectable text extraction to prevent stalled jobs.

#### [MODIFY] [documorph/api/main.py](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/documorph/api/main.py)
- In `/api/download/{job_id}`, clean up duplicate `Content-Disposition` headers so Starlette emits a single, RFC-6266 compliant header that iOS Safari parses cleanly without "unknown sources".

---

### Component 6: UX Production Audit Execution
- **Loading & Skeleton**: Verify smooth skeleton/shimmer during upload and processing.
- **Empty States**: Verify clean empty states when no history exists and no file is selected.
- **Error Recovery**: Centralized toast error notifications with retry buttons for dropped connections.
- **Network Resilience**: Auto-failover from local node to Render cloud if local port 8000 drops.
- **Responsive Layouts**: Stress-test across 320px (iPhone SE), 390px (iPhone 14/15/16), 768px (iPad), and 1200px (Desktop).
- **Duplicate Prevention**: Buttons disabled immediately on click (`isSubmitting` guard).

---

## Verification Plan

### Automated Build & Lint
```bash
cd frontend && npm run build
```
Verify zero syntax errors and clean bundle output.

### Functional Verification
1. **Tool Pages**:
   - Open `Clean & Format`, `Compress`, `Extract Text`, `Translate`.
   - Verify single-page layout: DropZone + Options + CTA + Proof Viewer all on one screen.
   - Verify Language & Context mode is compact (2x2 grid).
   - Verify no redundant bottom button.
2. **Processing Flow**:
   - Upload test PDF and click "Clean PDF Notes Now".
   - Verify progress bar moves smoothly from 0% to 92% without freezing.
   - Verify stages advance (`Reading` → `Layout` → `AI Reading` → `Formatting` → `Done`).
   - Verify completion screen displays download, iPhone share, and Safari view options.
3. **iPhone Download & Save**:
   - Test download endpoint headers with curl to verify `Content-Disposition: attachment; filename="...pdf"`.
   - Verify Web Share API triggers properly.
