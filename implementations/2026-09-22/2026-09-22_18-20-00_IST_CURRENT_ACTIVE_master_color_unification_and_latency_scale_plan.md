---
timestamp_ist: "2026-09-22 18:20:00 IST"
timestamp_utc: "2026-09-22T12:50:00Z"
step_index: "Active_Planning_Unified"
status: "CURRENT_ACTIVE"
tool_action: "master_color_unification_and_latency_scale_plan"
overwritten_by: "None (Currently Active)"
title: "Master Plan: Color System Unification, Sub-30s PDF Pipeline, Table/Math Integrity & 100k Concurrency Scale"
description: "Comprehensive unified master plan consolidating: 1. Diagnosis and fix for 50-page 10-minute latency regression down to sub-30s via PyMuPDF native extraction; 2. Restoring Silicon Valley Midnight Sapphire (dark) & Editorial Slate (light) palettes, eliminating crimson red clashes; 3. Synchronizing all JSX-CSS component selectors in workspace.css; 4. 100k concurrency hardening."
---

# Master Plan: Color System Unification, Sub-30s PDF Pipeline, Table/Math Integrity & 100k Concurrency Scale

**Date:** September 22, 2026 (18:20 IST)  
**Status:** `CURRENT_ACTIVE`  
**Governing Standard:** Global Agent Rules, Senior Reviewer 5-Question Checklist, Usability Heuristics & GSD Protocol

---

## 1. Problem Diagnosis & Root Causes

### A. The 10-Minute vs 30-Second PDF Latency Regression
1. **False-Positive Classification in `crop_sweeper.py`**:
   `re.search(r'[-:]{3,}|...', text)` ran before the digital fast-path. It matched standard markdown rules `---`, section lines, and table separators `|---|`, falsely classifying digital native pages as `corrupted`.
2. **Gemini Vision AI Rate-Limit Backoff**:
   50 pages were rendered as full-page JPEGs and sent across `Semaphore(3)` to Gemini Vision AI, hitting the 15 RPM free tier limit and triggering exponential backoffs up to 8–10 minutes.
3. **The Fix**:
   - Prioritize Digital Fast-Path in `crop_sweeper.py` (`total_chars >= 80`, `readable_ratio >= 0.65`).
   - PyMuPDF C++ table parser (`tab.to_markdown()`) for instant <0.1ms extraction.
   - Siphon digital math formulas directly into LaTeX `$$ ... $$` blocks without rasterization.
   - Eliminate blocking `asyncio.run()` calls in async functions in `pipeline.py`.

### B. The Color System & Visual Chaos Regression
1. **Accidental Crimson Red Palette**:
   `DesignTokens.css` had `--accent: #DC2626` (Red-600) and dark red gradients (`#991B1B`), turning primary execution buttons, brand logos, active tabs, scoreboard headers, and progress bars into an alarming, harsh red.
2. **Muddy Brown Stone Dark Mode**:
   `[data-theme="dark"]` was set to warm stone (`#0C0A09` / `#1C1917` / `#292524`), which clashed with high-tech slate/indigo components.
3. **JSX-CSS Selector Disconnect in `workspace.css`**:
   - `ProcessButton.jsx` used `.btn-process`, but CSS defined `.btn-primary-process`. The button fell back to unstyled browser defaults!
   - `DropZone.jsx` used `.selected-file-capsule`, `.selected-doc-icon`, `.dropzone-graphic-box`, `.dropzone-main-title`, `.dropzone-capability-row`, etc., which had no rules in `workspace.css`.
   - `SettingsPanel.jsx` used `.settings-accordion`, `.settings-toggle-btn`, `.mini-pill`.
   - `ProgressTracker.jsx` used `.progress-tracker-card`, `.progress-bar-track`, etc.
   - `ResultCard.jsx` used `.result-card`, `.result-header-row`, `.metric-tile`, `.btn-download-primary`, `.btn-result-secondary`, `.donor-appreciation-strip`.
4. **Homogeneous Warning Colors on Homepage**:
   Scoreboard pills, "How It Works" step badges, and metric icons were all forced to use the red accent instead of their distinct functional and thematic palettes.

---

## 2. Technical Implementation Architecture

### Component 1: Design Tokens & Harmonious Color Palettes (`DesignTokens.css`)
- **Dark Mode (Silicon Valley Midnight Sapphire / Carbon Slate)**:
  - `--bg-app: #0B0F19;`
  - `--bg-surface: #111827;`
  - `--bg-surface-2: #1E293B;` (nested panels)
  - `--bg-hover: #1F2937;`
  - `--border: rgba(255, 255, 255, 0.08);`
  - `--border-subtle: rgba(255, 255, 255, 0.04);`
  - `--border-hover: rgba(99, 102, 241, 0.35);`
  - `--text-1: #F8FAFC;` (Crisp White)
  - `--text-2: #CBD5E1;` (Slate-300 Secondary)
  - `--text-3: #94A3B8;` (Slate-400 Muted)
  - `--accent: #6366F1;` (Electric Indigo-500)
  - `--accent-hover: #818CF8;`
  - `--accent-soft: rgba(99, 102, 241, 0.14);`
  - `--accent-border: rgba(99, 102, 241, 0.35);`
  - `--accent-glow: rgba(99, 102, 241, 0.3);`
- **Light Mode (Editorial Snow / Slate)**:
  - `--bg-app: #F8FAFC;`
  - `--bg-surface: #FFFFFF;`
  - `--bg-surface-2: #F1F5F9;`
  - `--bg-hover: #E2E8F0;`
  - `--border: #E2E8F0;`
  - `--border-subtle: #F1F5F9;`
  - `--border-hover: #CBD5E1;`
  - `--text-1: #0F172A;` (Slate-900 High Contrast Ink)
  - `--text-2: #475569;` (Slate-600 Secondary)
  - `--text-3: #64748B;` (Slate-500 Muted)
  - `--accent: #4F46E5;` (Indigo-600)
  - `--accent-hover: #4338CA;`
  - `--accent-soft: #EEF2FF;`
  - `--accent-border: #C7D2FE;`
  - `--accent-glow: rgba(79, 70, 229, 0.2);`
- **Tool-Specific Thematic Accents**:
  - Clean & Format: Indigo (`#4F46E5` / `#6366F1`)
  - Compact PDF: Emerald (`#059669` / `#10B981`)
  - Extract Text: Amber (`#D97706` / `#F59E0B`)
  - Translate: Sky Cyan (`#0284C7` / `#06B6D4`)

### Component 2: Global Lighting & Selection (`base.css`)
- Replace red radial glows on `body` with ambient electric sapphire radial lighting:
  - Light mode: `radial-gradient(ellipse 80% 50% at 50% -20px, rgba(99, 102, 241, 0.04), transparent 70%)`
  - Dark mode: `radial-gradient(ellipse 80% 50% at 50% -20px, rgba(99, 102, 241, 0.08), transparent 70%)`
- Update `::selection` to use sapphire background with white text.

### Component 3: Header & Navigation (`header.css`)
- Update brand logo icon box to use high-tech Indigo gradient: `linear-gradient(135deg, #6366F1 0%, #4338CA 100%)` with indigo glow.
- Active navigation link: primary indigo text with subtle active indicator.
- Maintain warm amber for Fuel Server button (`₹20`) to preserve friendly micro-donation signifier.

### Component 4: Full Workspace & JSX-CSS Selector Alignment (`workspace.css`)
- Synchronize all classes with active JSX components:
  - `.btn-process`: 44px height, high-energy primary Indigo gradient (`linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)`), disabled state (`opacity: 0.55; background: var(--bg-surface-2); color: var(--text-3); border: 1px solid var(--border)`).
  - `.selected-file-capsule`, `.selected-doc-icon`, `.selected-file-meta`, `.selected-file-name`, `.selected-file-size`, `.btn-remove-selected`.
  - `.dropzone-graphic-box`, `.dropzone-main-title`, `.browse-text`, `.dropzone-meta-hint`, `.dropzone-capability-row`, `.dropzone-cap-pill`, `.cap-pill-dot`.
  - `.settings-accordion`, `.settings-toggle-btn`, `.settings-content`, `.settings-row`, `.mini-pill`.
  - `.progress-tracker-card`, `.progress-filename`, `.progress-timer`, `.progress-bar-track`, `.progress-bar-fill`, `.progress-msg-row`, `.progress-pipeline-steps`, `.pipeline-step-item`.
  - `.result-card`, `.result-header-row`, `.result-title-group`, `.result-success-icon`, `.result-filename`, `.result-metrics-grid`, `.metric-tile`, `.metric-val`, `.metric-label`, `.result-actions-row`, `.btn-download-primary`, `.btn-result-secondary`, `.donor-appreciation-strip`, `.btn-quick-fuel`.

### Component 5: Homepage Components & Proof Showcases (`homeComponents.css`)
- **Academic Scoreboard**:
  - `.scoreboard-pill`: Indigo soft background + indigo border + indigo text.
  - `.brand-highlight`: Crisp Indigo.
  - `.badge-verified`: Emerald green with subtle border.
  - `.status-indicator.win`: Emerald checkmark.
  - `.status-indicator.lose`: Slate-400 / subtle danger for competitor loss.
- **Metrics Stat Grid**:
  - 4 cards with distinct, harmonious icon colors:
    - 50,000+ Pages: Indigo
    - 99.8% LaTeX: Emerald
    - ₹450 Saved: Amber
    - 0.0s Retention: Cyan
- **3-Pass Engine Breakdown**:
  - Pass 1: Indigo badge & dot
  - Pass 2: Violet / Purple badge & dot
  - Pass 3: Emerald badge & dot

---

## 3. Verification & Quality Gates
1. **Frontend Production Build**: `npm run build` in `frontend/` (0 errors, 0 warnings).
2. **Backend Unit & Integration Tests**: `pytest tests/unit -q` (100% pass).
3. **50-Page PDF SLA Benchmark**: Verify sub-30s turnaround time on digital native PDFs.
4. **Visual & Browser Verification**: Inspect both Dark Mode and Light Mode across all 4 tools.
