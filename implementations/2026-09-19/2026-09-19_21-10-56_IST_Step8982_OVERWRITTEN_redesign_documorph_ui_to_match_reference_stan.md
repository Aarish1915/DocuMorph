---
timestamp_ist: "2026-09-19 21:10:56 IST"
timestamp_utc: "2026-09-19T15:40:56Z"
step_index: 8982
status: "OVERWRITTEN"
tool_action: "write_to_file"
overwritten_by: "Step 9310 on 2026-09-20 13:36:00 IST ('Unified Tool Workspace, UI Polish, iPhone Save Fix & UX Production Audit')"
title: "Redesign DocuMorph UI to Match Reference Standard"
description: "Create comprehensive implementation plan to redesign DocuMorph UI according to user's reference screenshots"
---

> **Plan Status: `OVERWRITTEN`**  
> **Timestamp:** Saturday, September 19, 2026 at 09:10:56 PM IST (2026-09-19T15:40:56Z)  
> **Transcript Step:** `8982`  
> **Lifecycle Note:** This plan was later replaced/overwritten by Step 9310 on 2026-09-20 13:36:00 IST ('Unified Tool Workspace, UI Polish, iPhone Save Fix & UX Production Audit')

---

# Redesign DocuMorph UI to Match Reference Standard

Transform DocuMorph from cramped, single-screen cards into an executive, multi-step SaaS tool flow directly modeled on the reference screenshots provided by the user.

## User Review Required

> [!IMPORTANT]
> **Key Architecture Decisions:**
> 1. **Multi-Step Flow (Step 1: Configure → Step 2: Upload → Step 3/4: Process & Download)**:
>    - Step 1 presents a clean, centered column (~600px) with question-based headings, category groups, and selectable cards with radio/checkbox indicators (matching the user's screenshots).
>    - Clicking **"Continue to upload"** smoothly advances to Step 2 ("Upload your PDF") with an uncluttered DropZone.
>    - Clicking the back arrow in the header returns to Step 1 at any time so the user can adjust settings.
> 2. **Complete Elimination of Raw HTML `<select>` Elements**:
>    - `TranslatePage` and `CleanFormatPage` (and `StudentExamLanguageSelector`) will use custom-styled interactive cards with native script badges, radio checkmarks, and zero browser-default dropdowns.
> 3. **Separation of Proofs from Tool Workspace**:
>    - Removes static cramped proof boxes from tool pages.
>    - Places a dedicated, interactive "Real Transformation Results" showcase on the Homepage with a 4-sample switcher (`Engineering Math`, `Dark Photocopy`, `Coaching Watermarks`, `Multi-Column Paper`).
>    - Adds an optional `👁️ View sample result` lightbox trigger on Step 1 for instant proof verification without cluttering the workflow.
> 4. **Executive Front Page (`#home`) Redesign**:
>    - Modern typography (`Outfit` / `Plus Jakarta Sans`), sleek minimalist badges, unified 2x2 tool directory cards matching the reference card design language, and generous whitespace.

---

## Proposed Changes

### Design System & Global Styles

#### [MODIFY] [toolPages.css](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/frontend/src/styles/toolPages.css)
- Implement reference wizard CSS tokens and components:
  - `.wizard-layout`: Centered 600px column with clean vertical rhythm.
  - `.wizard-title` & `.wizard-subtitle`: Sleek modern dark typography and slate description.
  - `.wizard-group-title`: Small 13px semi-bold category headings (`Quality level`, `Images`, `Additional cleanup`, etc.).
  - `.wizard-card`: Rounded 14px cards with 1.5px borders (`#e2e8f0`), hover states, and active blue border (`#2563eb`).
  - `.card-radio-circle` & `.card-checkbox`: Custom SVG checkmark indicators in vibrant blue circles/squares.
  - `.card-title` & `.card-desc`: Two-tier hierarchy with bold titles and light descriptions.
  - `.btn-wizard-continue`: Prominent vibrant blue CTA button (`Continue to upload` / `Start Processing Now`).
  - `.sample-proof-modal`: Sleek backdrop and dialog for on-demand before/after preview.

---

### Navigation & Header

#### [MODIFY] [Header.jsx](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/frontend/src/components/common/Header.jsx)
- Update header to mirror the reference screenshots:
  - When in any tool (`activeView !== 'home'`):
    - Left: Circular back button `(←)` with hover ring.
    - Title group: Tool name (e.g. `Compress`, `Extract Text`, `Clean & Format`, `Translate PDF`) with `Step X of 4` underneath.
    - Right: 4-segment progress bar (`.step-dash-bar`), theme toggle, and history drawer trigger.
  - When on Home (`activeView === 'home'`):
    - Left: DocuMorph AI brand logo.
    - Center: Clean navigation links (`All Tools`, `Clean`, `Compress`, `Extract`, `Translate`).
    - Right: Theme toggle and history drawer trigger.

---

### Tool Pages (Multi-Step Wizard Implementations)

#### [MODIFY] [CompressPage.jsx](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/frontend/src/components/pages/CompressPage.jsx)
- **Step 1 (Screenshot 1 Reference)**:
  - Title: `How much should we compress?`
  - Subtitle: `Balance between file size and quality. Typical reduction: 60–80%.`
  - Group 1: `Quality level` (`Balanced (recommended)`, `High quality`, `Maximum compression`).
  - Group 2: `Images` (`Compress images`, `Remove images`).
  - Group 3: `Additional cleanup` (`Remove duplicate objects`, `Strip metadata & hidden data`).
  - Bottom CTA: `Continue to upload` (advances to Step 2).
- **Step 2**:
  - Title: `Upload your PDF`
  - Clean DropZone + File capsule card.
  - Primary button: `Compress PDF Now →` (advances to Step 4 processing).

#### [MODIFY] [ExtractTextPage.jsx](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/frontend/src/components/pages/ExtractTextPage.jsx)
- **Step 1 (Screenshot 2 Reference)**:
  - Title: `What format do you need?`
  - Subtitle: `Choose how the text should be formatted.`
  - Group 1: `Output format` (`Raw text`, `Markdown`, `Structured JSON`).
  - Group 2: `Preserve structure` (`Keep headings & lists`).
  - Group 3: `Clean up text` (`Remove watermarks & headers`, `Fix spacing & line breaks`).
  - Group 4: `Math equations` (`Preserve LaTeX math ($...$)`).
  - Bottom CTA: `Continue to upload` (advances to Step 2).
- **Step 2**:
  - Title: `Upload your PDF`
  - Clean DropZone + File capsule card.
  - Primary button: `Extract Text Now →` (advances to Step 4 processing).

#### [MODIFY] [CleanFormatPage.jsx](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/frontend/src/components/pages/CleanFormatPage.jsx)
- **Step 1**:
  - Title: `How should we clean your notes?`
  - Subtitle: `Whiten dark scans, erase stamps, and prepare for printing.`
  - Group 1: `Paper brightness` (`Bright white (recommended)`, `Natural clean`, `Deep clean`).
  - Group 2: `Document scope` (`Full document`, `Quick test (Pages 1–3)`).
  - Group 3: `Cleanup & protection` (`Erase coaching ads & watermarks` with keyword field, `Protect math & science equations`, `Add binding margin`).
  - Group 4: `Subject & exam context` (Custom cards replacing raw HTML `<select>`: `Bilingual`, `English + Math`, `Hindi + Math`, `English Only`).
  - Bottom CTA: `Continue to upload` (advances to Step 2).
- **Step 2**:
  - Title: `Upload your PDF`
  - Clean DropZone + File capsule card.
  - Primary button: `Clean Notes Now →` (advances to Step 4 processing).

#### [MODIFY] [TranslatePage.jsx](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/frontend/src/components/pages/TranslatePage.jsx)
- **Step 1**:
  - Title: `Which language do you need?`
  - Subtitle: `Translate your study notes while keeping math formulas and diagrams intact.`
  - Group 1: `Target language` (Grid of custom selectable cards with native scripts — ZERO raw HTML `<select>`):
    - `Hindi (हिन्दी)`, `Marathi (मराठी)`, `Gujarati (ગુજરાતી)`, `Tamil (தமிழ்)`, `Telugu (తెలుగు)`, `Bengali (বাংলা)`, `Kannada (ಕನ್ನಡ)`, `Malayalam (മലയാളം)`, `Punjabi (ਪੰਜਾਬੀ)`, `Urdu (اردو)`, `English`, etc.
  - Group 2: `Formula & diagram preservation` (`Protect math & physics formulas`, `Translate scientific diagram labels`).
  - Group 3: `Output format` (`PDF Document (.pdf)`, `Markdown Document (.md)`).
  - Bottom CTA: `Continue to upload` (advances to Step 2).
- **Step 2**:
  - Title: `Upload your PDF`
  - Clean DropZone + File capsule card.
  - Primary button: `Translate PDF Now →` (advances to Step 4 processing).

---

### Home Page & Proof Showcase

#### [MODIFY] [HeroSection.jsx](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/frontend/src/components/hero/HeroSection.jsx)
- Redesign with Stripe/Linear-grade executive minimalism:
  - Clean pill badge: `DocuMorph AI • Free Academic PDF Studio`
  - Punchy headline: `Transform messy study notes into clean, compact PDFs`
  - Direct value subtitle and 3 trust badges (100% private, no file storage, LaTeX math safe).

#### [MODIFY] [ToolDirectory.jsx](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/frontend/src/components/pages/ToolDirectory.jsx)
- Redesign the 4 tool cards to share the reference card aesthetic (clean white canvas, 1.5px border, subtle hover elevation, clear value tags, crisp `Configure & Start →` CTA).

#### [MODIFY] [App.jsx](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/frontend/src/App.jsx)
- Wire `step` state between pages (Step 1: Configuration, Step 2: Upload, Step 4: Processing/Results).
- Handle back navigation smoothly (`step = 2` back goes to `step = 1`; `step = 1` back goes to `home`).
- Upgrade Homepage "Real Transformation Results" section with a 4-sample tab switcher (`doc_1`, `doc_2`, `doc_3`, `doc_4`).

#### [NEW] [SampleProofModal.jsx](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/frontend/src/components/common/SampleProofModal.jsx)
- Reusable modal component for tool pages allowing users to click `👁️ View sample before & after results` to inspect real transformations on demand.

---

## Verification Plan

### Automated Tests & Build Verification
1. Run `npm run build` in `c:\Users\Aarish ali\pdfs\DocuMorph\frontend` to confirm TypeScript/JSX syntax validity and zero bundle errors.
2. Verify all component imports and props.

### Manual Verification
1. Open `http://localhost:5173/#compress`:
   - Verify Step 1 question cards (`How much should we compress?`), 3 quality levels, image options, cleanup checkboxes.
   - Click "Continue to upload" → verify transition to Step 2 (`Step 2 of 4`, DropZone visible).
   - Click header back arrow `←` → verify return to Step 1.
2. Open `http://localhost:5173/#extract`:
   - Verify Step 1 question cards (`What format do you need?`), output format radio cards, structure checkboxes.
   - Click "Continue to upload" → verify transition to Step 2.
3. Open `http://localhost:5173/#translate`:
   - Verify target language cards with native scripts (confirm NO raw `<select>` exists in DOM).
4. Open `http://localhost:5173/#clean`:
   - Verify paper brightness cards, scope pills, and custom exam context cards (confirm NO raw `<select>`).
5. Open `http://localhost:5173`:
   - Verify executive hero, 2x2 tool cards, and interactive real results comparison slider.
