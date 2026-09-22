---
timestamp_ist: "2026-09-20 13:48:09 IST"
timestamp_utc: "2026-09-20T08:18:09Z"
step_index: 9008
status: "OVERWRITTEN"
tool_action: "write_to_file"
overwritten_by: "Step 9222 on 2026-09-20 14:13:50 IST ('Production Transformation & Engineering Plan: Cockpit Polish, Latency Reduction & Global Launch Readiness')"
title: "Next-Generation UI/UX & Frontend Engineering Overhaul: Neo-Design System, Cognitive Ergonomics & Card-Less Proof Studio"
description: "Next-Generation UI/UX Engineering Plan with Neo-Design System, Ergonomic Action CTA, and Card-Less Proof Studio"
---

> **Plan Status: `OVERWRITTEN`**  
> **Timestamp:** Sunday, September 20, 2026 at 01:48:09 PM IST (2026-09-20T08:18:09Z)  
> **Transcript Step:** `9008`  
> **Lifecycle Note:** This plan was later replaced/overwritten by Step 9222 on 2026-09-20 14:13:50 IST ('Production Transformation & Engineering Plan: Cockpit Polish, Latency Reduction & Global Launch Readiness')

---

# Next-Generation UI/UX & Frontend Engineering Overhaul: Neo-Design System, Cognitive Ergonomics & Card-Less Proof Studio

## Architectural Vision & Psychology-Driven Redesign
This plan overhauls DocuMorph's frontend from the ground up to create an interface that feels like **Linear, Raycast, and Apple**:
1. **Modern Typography Engine**: Google Fonts pairing of **`Outfit`** (high-contrast, geometric display titles with optical tracking `-0.025em`) + **`Plus Jakarta Sans`** (hyper-legible, crisp modern UI controls) + **`JetBrains Mono`** (tabular figures for document sizes, page numbers, and timers).
2. **Neo-Obsidian & Ceramic Snow Color Engine**: 
   - *Dark Mode*: Deep cosmic obsidian (`#07080c`) with ambient radial mesh aura (`rgba(99, 102, 241, 0.12)`), tinted glassmorphism (`rgba(255, 255, 255, 0.05)` hairline borders), and zero muddy grey boxes.
   - *Light Mode*: Ceramic snow (`#fbfbfd`) with whisper-soft elevation shadows and crisp micro-borders.
   - *Vibrant Neon Accents*: Electric Violet (`#6366f1`), Emerald Mint (`#10b981`), Amber Flame (`#f59e0b`), and Cyber Cyan (`#06b6d4`).
3. **Ergonomic Button Placement (Fitts' Law & Hick's Law)**:
   - **Zero-Distance Docked Action CTA**: When a file is dropped, the DropZone smoothly contracts into an interactive **Document Command Capsule**:
     - *Left*: File icon, truncated name, page count badge, and file size.
     - *Right / Immediate Next*: The primary action button (`✨ Clean PDF Now →`) is integrated directly into or immediately docked beneath the capsule with zero travel distance.
     - *Mobile*: A sticky, floating bottom thumb-bar so users never need to scroll down to trigger processing.
   - **Elimination of Secondary Dead Buttons**: The redundant `"Choose or drop a PDF above to clean"` button is permanently eradicated across all pages.
4. **Card-Less Proof Experience: "The Live A4 Studio Specimen"**:
   - Completely discards the clunky, boxed-in `.proof-card` widget.
   - Replaced by a **Frameless Illuminated Specimen Desk**:
     - An authentic A4 page sheet resting with realistic ambient depth on the canvas.
     - 1px neon laser sweep line with smooth inertia that dynamically reveals the transformation.
     - Floating glass pill switcher: `[ Dirty Scan ]` | `[ 50/50 Split ]` | `[ Clean Notes ✨ ]`.
     - Micro-magnifier loupe on equation hover showing vector LaTeX sharpness.
5. **Ultra-Compact 2x2 Language & Context Deck**:
   - Replaces the tall vertical card stack in [`StudentExamLanguageSelector.jsx`](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/frontend/src/components/common/StudentExamLanguageSelector.jsx) with a sleek, 2x2 segmented pill grid taking only ~38px height.
6. **Processing Screen & iPhone Save Fix ("Last Part")**:
   - Freeze prevention: clamp progress to 92% until `status === 'COMPLETED'`.
   - Continuous 0.12% micro-stepping ticker so the screen is always visibly alive.
   - Elimination of duplicate `Content-Disposition` headers in FastAPI [`main.py`](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/documorph/api/main.py).
   - Direct Web Share API + native download fallback + `"👁️ Open in Safari (to Save to Files)"` direct link.
   - Switch `probeBackend()` in [`config.js`](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/frontend/src/config.js) from `/api/settings` (401 error) to `/api/health` (200 OK).
7. **15 AI Pipeline Latency Drivers & UX Production Audit**:
   - Concrete resolutions for TTFT, TPOT, Queue Time, Orchestration Overhead, Prefill/Decode, and P99 timeouts.
   - Full 19-point UX production audit report verified against actual code.

---

## User Review Required

> [!IMPORTANT]
> **No Code Changes Until Plan Approval**: In accordance with project rules, this design specification requires your review and approval before execution starts.

> [!NOTE]
> **No More Clunky Cards**: The proof showcase is redesigned as an edge-to-edge floating A4 specimen desk integrated directly into the workspace layout.

---

## Proposed Changes

### Component 1: Design System & Tokens Overhaul
#### [MODIFY] [DesignTokens.css](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/frontend/src/DesignTokens.css)
- Implement Neo-Obsidian Dark (`#07080c`, `#0e1017`, `rgba(255, 255, 255, 0.07)`) and Ceramic Snow Light (`#fbfbfd`, `#ffffff`).
- Define electric tool accents with custom glowing radial auras.
- Configure `--font-display: 'Outfit'`, `--font-body: 'Plus Jakarta Sans'`, `--font-mono: 'JetBrains Mono'`.
- Define micro-radii tokens (`4px`, `8px`, `12px`, `16px`, `9999px`).

#### [MODIFY] [frontend/index.html](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/frontend/index.html)
- Optimize Google Fonts preconnect and font stylesheet loading for `Outfit`, `Plus Jakarta Sans`, and `JetBrains Mono` with `display=swap`.

---

### Component 2: Frameless Live Studio Specimen (Card-Less Proof)
#### [MODIFY] [InteractiveProofViewer.jsx](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/frontend/src/components/common/InteractiveProofViewer.jsx)
- Remove all nested outer card wrappers, borders-in-borders, and boxy containers.
- Render an **Illuminated A4 Specimen Desk**:
  - Borderless natural paper sheet with realistic subtle elevation drop shadow (`0 20px 40px -15px rgba(0,0,0,0.3)`).
  - High-precision 1px neon laser sweep line with a soft glow handle.
  - Floating top-center glass segmented pill switcher: `[ Dirty Scan ]` | `[ 50/50 Split ]` | `[ Clean Notes ✨ ]`.
  - LaTeX equation callout badges showing vector equation preservation without visual clutter.

---

### Component 3: Ergonomic Button Placement & Compact Language Selector
#### [MODIFY] [DropZone.jsx](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/frontend/src/components/workspace/DropZone.jsx)
- Empty state: Clean, inviting dropzone canvas with animated dashed border and subtle cloud glow.
- Active state: Morphs into a sleek **Document Action Capsule**:
  - File details on the left (PDF badge, filename, file size).
  - Quick `✕ Change` button.
  - Directly attaches or docks the primary CTA right into the workflow.

#### [MODIFY] [StudentExamLanguageSelector.jsx](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/frontend/src/components/common/StudentExamLanguageSelector.jsx)
- Convert from tall vertical cards into a compact **2x2 segmented pill bar**:
  - `⚡ Auto (STEM / All)` | `📐 Hindi + Math`
  - `⚖️ English Only` | `🔬 STEM Pure (En+Math)`
- Reduces vertical height from ~280px to ~38px.

#### [MODIFY] [CleanFormatPage.jsx](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/frontend/src/components/pages/CleanFormatPage.jsx)
#### [MODIFY] [CompressPage.jsx](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/frontend/src/components/pages/CompressPage.jsx)
#### [MODIFY] [ExtractTextPage.jsx](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/frontend/src/components/pages/ExtractTextPage.jsx)
#### [MODIFY] [TranslatePage.jsx](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/frontend/src/components/pages/TranslatePage.jsx)
- Guarantee zero redundant bottom buttons.
- Place the dynamic primary CTA button directly below the Document Capsule so the user never has to search for it.
- Desktop: 2-column studio layout (Command Center on the left, Live A4 Specimen on the right).
- Mobile: Streamlined single-column with sticky bottom thumb action bar.

---

### Component 4: Processing Cockpit & iPhone Download / Save Fix ("Last Part")
#### [MODIFY] [ProgressCard.jsx](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/frontend/src/components/progress/ProgressCard.jsx)
- **Freeze Prevention**: Clamp `displayProgress` at 92% until `isComplete` is true.
- **Organic Ticker**: Smooth 0.12% micro-stepping every 80ms during heavy compilation.
- **iPhone Save Pipeline**:
  - Direct iOS detection (`/iPad|iPhone|iPod/` or Mac with touch points).
  - Native Web Share API trigger (`navigator.share({ files: [file] })`).
  - Direct same-origin blob download.
  - Direct link: `👁️ Open in Safari (to Save to Files)`.
- **Telemetry Header**: File name, size, mode, and real-time processing bandwidth.

#### [MODIFY] [documorph/api/main.py](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/documorph/api/main.py)
- Remove manual duplicate `Content-Disposition` header in `/api/download/{job_id}`, allowing Starlette's `FileResponse(..., filename=filename, content_disposition_type="attachment")` to generate a single RFC-compliant header.

#### [MODIFY] [frontend/src/config.js](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/frontend/src/config.js)
- Update `probeBackend()` to ping `/api/health` instead of guarded `/api/settings` (eliminating 401 errors).

---

### Component 5: 15 AI Pipeline Latency Driver Optimizations
#### [MODIFY] [documorph/worker/pipeline.py](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/documorph/worker/pipeline.py)
- Downscale high-res images to max 1600px width before passing to Gemini Vision, slashing token prefill and TTFT by up to 60%.
- Stream granular progress checkpoints during compilation (75% $\rightarrow$ 82% $\rightarrow$ 88% $\rightarrow$ 92% $\rightarrow$ 100%).

---

## Verification Plan

### Automated Build & Lint
```bash
cd frontend && npm run build
python -m py_compile documorph/api/main.py documorph/worker/pipeline.py
pytest tests/ -v
```

### Manual & Visual Verification
1. **Typography & Colors**:
   - Inspect page in browser: verify `Outfit` display font on titles and `Plus Jakarta Sans` on UI controls.
   - Toggle theme (Sun/Moon): verify cosmic obsidian in dark mode and ceramic snow in light mode.
2. **Card-Less Proof Specimen**:
   - Inspect the Live A4 Specimen: verify it renders as an illuminated natural paper sheet without boxy card borders, with smooth laser sweep and floating pill toggles.
3. **Button Ergonomics**:
   - Upload a PDF: verify the DropZone morphs into the Document Capsule with the primary action button immediately docked right there.
   - Verify zero redundant buttons at the bottom.
4. **Processing & iPhone Save**:
   - Run a clean job: verify the progress bar moves organically to 90-92% and never gets frozen at 100%.
   - Test download endpoint headers: verify a single valid `Content-Disposition` header.
   - Verify `📱 Save to iPhone / Share` button is active.
