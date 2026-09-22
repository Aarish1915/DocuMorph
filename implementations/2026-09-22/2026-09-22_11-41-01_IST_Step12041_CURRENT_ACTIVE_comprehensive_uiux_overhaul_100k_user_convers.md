---
timestamp_ist: "2026-09-22 11:41:01 IST"
timestamp_utc: "2026-09-22T06:11:01Z"
step_index: 12041
status: "CURRENT_ACTIVE"
tool_action: "write_to_file"
overwritten_by: "None (Currently Active)"
title: "Comprehensive UI/UX Overhaul & 100k-User Conversion Restoration"
description: "Implementation plan for full UI/UX overhaul and social proof restoration"
---

> **Plan Status: `CURRENT_ACTIVE`**  
> **Timestamp:** Tuesday, September 22, 2026 at 11:41:01 AM IST (2026-09-22T06:11:01Z)  
> **Transcript Step:** `12041`  
> **Lifecycle Note:** Active current plan.

---

# Comprehensive UI/UX Overhaul & 100k-User Conversion Restoration

## Overview
Transform DocuMorph AI (`https://documorph-v1.vercel.app/#`) from an unadorned single dropzone prototype into a high-authority, high-converting $100M-tier academic document platform. Re-integrate the 6 psychological proof sections, restore the rich academic settings (paper brightness, coaching stamp eraser, 12mm binding margin, language context), fix modal/ticker styling defects shown in screenshots, and ensure full responsiveness in dark and light modes.

## User Review Required
> [!IMPORTANT]
> - All work is done directly in the repository code (no external Stitch MCP calls).
> - The consumer homepage will combine the **CleanNotes Document Studio** with the **Empirical Proof Scoreboard**, **Interactive Quality Preview Slider**, **Metrics Stat Grid**, **3-Pass Engine Breakdown**, **Verified Student Wall** (Kota to Mukherjee Nagar testimonials), and **Popular Academic Transformation Tools** (4 pillars).
> - Modals and ticker headers will have zero unstyled buttons or text-wrap glitches.

## Proposed Changes

### 1. Style Integration & Bug Fixes
#### [MODIFY] [index.css](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/frontend/src/index.css)
- Import `styles/homeComponents.css` so all classes for the Scoreboard, Testimonials, Metrics Grid, Interactive Proof Viewer, Popular Tools, and UPI Payment Card are loaded.

#### [MODIFY] [app.css](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/frontend/src/styles/app.css)
- Allow `.main-content` to expand to `max-width: 1180px` while keeping `.workspace-container` centered at `max-width: 820px`.
- Fix `.donor-ticker-inner`: set `flex-shrink: 0; white-space: nowrap;` on the right action buttons and `min-width: 0; flex: 1; text-overflow: ellipsis;` on text content to eliminate vertical text wrapping (fixing Screenshot 2).
- Fix `.community-back-btn`: add sleek border, pill radius, and background to remove raw browser button border.
- Fix `.btn-link-utr` and modal buttons so raw HTML links with browser red underlines are replaced with refined UI pills.

---

### 2. Rich Academic Settings Panel
#### [MODIFY] [SettingsPanel.jsx](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/frontend/src/components/workspace/SettingsPanel.jsx)
- Restore the exact academic settings requested:
  - **Clean & Format**:
    - Paper Brightness: `Natural` | `Bright White` | `Deep Clean`
    - Toggles: `Erase coaching stamps & ads` (with optional custom keyword input: "e.g. ALLEN, FIITJEE"), `Protect math formulas`, `Add 12mm binding margin`
    - Language & Context segmented pills: `⚡ Auto (All / STEM)`, `📐 Hindi + Math`, `⚖️ English Only`, `🔬 STEM (En + Math)`
  - **Compact PDF**:
    - Compaction Mode: `⚡ Smart Fit A4 (~48% paper saved)`, `📑 2 Pages / Sheet`, `🗜️ Ultra Small MB`
    - Image Resolution: `150 DPI (Fast)`, `200 DPI (Balanced)`, `300 DPI (Print HD)`
  - **Extract Text**:
    - Output format: `Markdown (.md with LaTeX & Tables)`, `Plain Text (.txt)`
    - Watermark cleaner & structure preserver toggles
  - **Translate**:
    - Target Language selector
    - Formula Shield (`Lock LaTeX Math`) & Code/Chemistry block protection

---

### 3. Home View Assembly & Social Proof
#### [MODIFY] [App.jsx](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/frontend/src/App.jsx)
- In `activeView === 'home'`, render:
  1. `<Workspace />` (Studio Cockpit)
  2. `<AcademicScoreboard />` ("Not a Claim — A Scoreboard")
  3. `<InteractiveProofViewer beforeImg="/samples/doc_1_before.jpg" afterImg="/samples/doc_1_after.jpg" />`
  4. `<MetricsStatGrid />` (50,000+ Pages, 99.8% LaTeX Math, ₹450 Saved, 0.0s Retention)
  5. `<HowItWorksThreePass />` (3-Pass Engine)
  6. `<AspirantTestimonials />` (Verified Student Wall)
  7. `<PopularToolsFooter onNavigateView={...} />` (4 Pillars)

#### [MODIFY] [AspirantTestimonials.jsx](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/frontend/src/components/home/AspirantTestimonials.jsx)
- Ensure the 5 curated testimonials (Kota, Delhi, Surat, Hyderabad) are active as default fallbacks so the wall is never blank if the API is offline or cold.

---

### 4. UPI Payment Card & Donation Flow
#### [MODIFY] [UpiPaymentCard.jsx](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/frontend/src/components/common/UpiPaymentCard.jsx) & [DonationModal.jsx](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/frontend/src/components/common/DonationModal.jsx)
- Ensure all QR card elements, amount chips, custom rupee input, and copy buttons are styled with the Obsidian & Paper design tokens.
- Replace raw links with styled action buttons.

## Verification Plan

### Automated Tests
- Run `npm run build` in `frontend/` to confirm 0 compilation errors and clean bundling.

### Browser Visual Inspection
- Launch browser subagent or inspect DOM to verify:
  - Homepage displays Workspace Studio, Scoreboard, Interactive Slider, Metrics, Testimonials, and Popular Tools.
  - Donation modal opens with polished QR card, amount pills, and copy button (Screenshot 1 issue resolved).
  - Ticker displays single-line text without wrapping or stacking (Screenshot 2 issue resolved).
  - Back button in Community page has pill styling without default browser border.
