---
timestamp_ist: "2026-09-18 22:06:05 IST"
timestamp_utc: "2026-09-18T16:36:05Z"
step_index: 6092
status: "OVERWRITTEN"
tool_action: "write_to_file"
overwritten_by: "Step 7118 on 2026-09-18 23:34:09 IST ('Implementation Plan: DocuMorph 4.0 Comprehensive Upgrade & Stability Protocol')"
title: "DocuMorph Production-Grade Master Plan: 4-Tool Distinction, Precision Diagrams, Standalone Admin, Speed, and 20-Point Launch Checklist"
description: "Production-grade master implementation plan covering UI revamp, precision diagram extraction, spam filtering, translated diagram glossaries, standalone admin deployment, speed optimizations, and the 20-point launch checklist."
---

> **Plan Status: `OVERWRITTEN`**  
> **Timestamp:** Friday, September 18, 2026 at 10:06:05 PM IST (2026-09-18T16:36:05Z)  
> **Transcript Step:** `6092`  
> **Lifecycle Note:** This plan was later replaced/overwritten by Step 7118 on 2026-09-18 23:34:09 IST ('Implementation Plan: DocuMorph 4.0 Comprehensive Upgrade & Stability Protocol')

---

# DocuMorph Production-Grade Master Plan: 4-Tool Distinction, Precision Diagrams, Standalone Admin, Speed, and 20-Point Launch Checklist

## Executive Overview
This implementation plan systematically addresses all 8 user requests and integrates the 20-point website launch checklist from the reference image. DocuMorph will be transformed from a single-template design into a distinguished multi-tool suite with precision computer vision diagram cropping, intelligent spam/watermark rejection, multilingual diagram label translation, standalone Vercel admin deployment, sub-30s speed optimizations, and a full production pre-launch compliance suite.

---

## User Review Required

> [!IMPORTANT]
> **Standalone Admin Hub Deployment (Requirement 5)**:
> We will configure DocuMorph to support a dedicated standalone Admin deployment on Vercel using `VITE_ADMIN_ONLY=true`. This allows you to connect the exact same GitHub repository to a second Vercel project (e.g. `documorph-admin.vercel.app`) which boots straight into the password-protected Admin Hub with live telemetry, jobs, and RAM cleaning, while the public student site (`documorph.vercel.app`) keeps the admin interface completely hidden.

> [!IMPORTANT]
> **Diagram Cropping Text Collision Avoidance (Requirement 2 & 3)**:
> Rather than using fixed 36pt padding that slices through adjacent paragraphs, we will integrate PyMuPDF's exact character/word text bounding boxes (`page.get_text("blocks")`) to establish a zero-collision barrier around every diagram, and add heuristic spam rejection (filtering out Telegram stamps, QR codes, phone numbers, and coaching logos).

---

## Proposed Changes

### Component 1: Distinct UI/UX & Specialized Options for All 4 Features (Requirement 1)
Each tool will have its own visual theme, custom hero badge, specialized configuration controls, and tailored before/after demonstration:

| Tool | Visual Theme & Accent | Specialized Configuration Controls | Unique Proof Showcase |
| :--- | :--- | :--- | :--- |
| **1. Clean & Format** | Electric Violet (`#6366f1` / `#8b5cf6`), Sparkle motif `✨` | Note Whitening Intensity (Subtle/Aggressive), Watermark Scrubber (High/Strict), Formula Typesetting (LaTeX MathJax), Margin Optimizer | Scanned handwritten notebook with heavy gray photocopy shadows & ads -> Pure white print-ready paper |
| **2. Compress PDF** | Emerald Mint (`#10b981` / `#059669`), Bolt motif `⚡` | Target DPI (150/200/300), Compression Strategy (Smart Compact vs Strict 2-Up Multi-Grid), Live Printing Cost Savings Calculator | 50-page bloated slide deck -> 18-page compact double-column print layout with file size badge |
| **3. Extract Text** | Cyber Amber (`#f59e0b` / `#d97706`), Data motif `📋` | Output Format Pills (Markdown `.md`, JSON `.json`, Plain Text `.txt`), HTML Table Fidelity Toggle, LaTeX Formula Delimiter Lock | Complex physics test paper with tables & equations -> Clean markdown table + LaTeX equations with live 1-click copy |
| **4. Translate PDF** | Ocean Cyan (`#06b6d4` / `#2563eb`), Globe motif `🌐` | Source Language (Auto-Detect) -> Target Script (14 Indian & Global Languages), Technical Glossary Preservation, Diagram Translated Glossary Key | Hindi handwritten mechanics notes -> Fluent English translation with translated diagram labels |

#### [MODIFY] [frontend/src/styles/toolPages.css](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/frontend/src/styles/toolPages.css)
- Implement distinct thematic color tokens for `.tool-theme-clean`, `.tool-theme-compress`, `.tool-theme-extract`, and `.tool-theme-translate`.
- Style specialized configuration cards, format pill pickers, range sliders, and output preview cards.

#### [MODIFY] [frontend/src/components/pages/CleanFormatPage.jsx](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/frontend/src/components/pages/CleanFormatPage.jsx)
- Specialized Clean & Format UI with whitening strength chip selector, watermark scrub level, formula OCR toggle, and tailored before/after proof viewer.

#### [MODIFY] [frontend/src/components/pages/CompressPage.jsx](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/frontend/src/components/pages/CompressPage.jsx)
- Redesigned Compress UI with interactive printing cost calculator, target DPI options, 2-up page grid toggle, and document size compaction preview.

#### [MODIFY] [frontend/src/components/pages/ExtractTextPage.jsx](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/frontend/src/components/pages/ExtractTextPage.jsx)
- Redesigned Extract Text UI with Markdown/JSON/Text pills, Table extraction fidelity toggle, math delimiter selector, and split-screen code/table preview.

#### [MODIFY] [frontend/src/components/pages/TranslatePage.jsx](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/frontend/src/components/pages/TranslatePage.jsx)
- Redesigned Translate UI with dual language picker (Source -> Target), translated diagram glossary toggle, exam terminology guard, and bilingual preview.

---

### Component 2: Precision Diagram Cropping & Text Boundary Barrier (Requirement 2)
#### [MODIFY] [documorph/worker/pipeline.py](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/documorph/worker/pipeline.py)
- Replace static 36pt vertical padding with PyMuPDF text block boundary inspection:
  1. Retrieve all text blocks on the page via `page.get_text("blocks")`.
  2. For any candidate diagram bounding box `[ymin, xmin, ymax, xmax]`, compute vertical and horizontal distance to the nearest text blocks.
  3. Clamp the padding so the bounding box stops at the natural whitespace gutter before the nearest text begins (minimum 4pt safe clearance, zero text overlap).
  4. Perform 2D contour / ink bounding box fitting on the cropped pixmap using NumPy to snap the crop tightly to the genuine drawing contours.

---

### Component 3: Anti-Spam Diagram & Watermark Logo Filter (Requirement 3)
#### [MODIFY] [documorph/core/diagram_extractor.py](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/documorph/core/diagram_extractor.py)
- Implement multi-stage spam diagram detection:
  1. **OCR / Text Regex Scan on Diagram Crops**: Inspect text overlapping the candidate crop for spam signatures (`telegram`, `@`, `whatsapp`, `call:`, 10-digit phone numbers, `coaching`, `institute`, `academy`, `fee:`, `mains`, `pre`).
  2. **Banner Aspect Ratio Filter**: Reject extreme aspect ratios (width/height > 4.5 or height/width > 5.0) which indicate advertisement header/footer ribbons.
  3. **Faint Watermark / Uniform Low-Contrast Filter**: Reject low-contrast washed-out stamps (mean luminance > 242 and standard deviation < 12).
  4. **Corner Contact Stamp Filter**: Reject corner badges with area < 5% of page containing high text density.

#### [MODIFY] [documorph/core/batch_vision.py](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/documorph/core/batch_vision.py)
- Update Vision AI prompt to explicitly forbid generating `[Figure: ...]` tags for coaching institute logos, Telegram banners, watermarks, stamps, QR codes, or phone numbers.

---

### Component 4: Multilingual Diagram Translation & Label Glossary (Requirement 4)
#### [MODIFY] [documorph/core/batch_vision.py](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/documorph/core/batch_vision.py)
- When `service_type == "translate"`, instruct Gemini to detect any source-language text labels inside scientific diagrams and provide a translated figure glossary key:
  ```markdown
  [Figure: <description> | bbox: [ymin, xmin, ymax, xmax]]
  <div class="diagram-label-glossary">
  <strong>図 Translated Diagram Labels ({target_lang}):</strong>
  * Label 1 (Original) -> Translated Label
  * Label 2 (Original) -> Translated Label
  </div>
  ```
#### [MODIFY] [documorph/compilers/pdf_compiler.py](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/documorph/compilers/pdf_compiler.py)
- Add CSS styling for `.diagram-label-glossary` ensuring high-readability chips rendered directly beneath translated diagrams in the exported PDF and markdown.

---

### Component 5: Standalone Admin Hub Deployment on Vercel (Requirement 5)
#### [MODIFY] [frontend/src/App.jsx](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/frontend/src/App.jsx)
- Support `import.meta.env.VITE_ADMIN_ONLY === 'true'`:
  - When enabled, the app directly renders `AdminDashboardModal` as the full-screen standalone application.
  - Public navigation and student tools are disabled on this deployment.
#### [NEW] [ADMIN_DEPLOYMENT_GUIDE.md](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/ADMIN_DEPLOYMENT_GUIDE.md)
- Provide step-by-step instructions on:
  1. Selecting the `frontend` folder in Vercel.
  2. Setting `VITE_ADMIN_ONLY=true` and `VITE_API_BASE_URL`.
  3. Getting your dedicated admin link (`https://documorph-admin.vercel.app`).

---

### Component 6: Speed & Latency Optimization (Requirement 6 & 7)
#### [MODIFY] [documorph/worker/queue_worker.py](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/documorph/worker/queue_worker.py)
- **Throttled Progress Commits**: Throttle database progress updates to at most once every 1.5 seconds, saving 20+ round-trip network transactions to Neon PostgreSQL.
#### [MODIFY] [documorph/worker/pipeline.py](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/documorph/worker/pipeline.py)
- **Bulk Insert Page Results**: Replace the per-page sequential loop with a single bulk query/commit to Neon PostgreSQL for `PageResult` and `PageResultVersion`.
#### [MODIFY] [documorph/core/format_polisher.py](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/documorph/core/format_polisher.py)
- Lower retry backoff from 15s down to 3s with jitter, preventing 45s idle stalls on Gemini rate-limit checks.

---

### Component 7: 20-Point Website Launch Checklist Integration (Requirement 8 & Reference Image)

| # | Item from Reference Image | Implementation in DocuMorph |
| :-: | :--- | :--- |
| **1** | **Add a privacy policy page** | `PrivacyModal.jsx`: 100% private, zero file retention, no telemetry PII. |
| **2** | **Add a terms and conditions page** | `TermsModal.jsx`: Educational fair use, personal study notes processing. |
| **3** | **Get secrets off frontend** | Verify zero backend master keys or DB credentials exposed in `frontend/src`. |
| **4** | **Force HTTPS** | Configured in `vercel.json` and `render.yaml` security headers (`HSTS`). |
| **5** | **Add a cookie consent banner** | `CookieConsent.jsx`: Clean, non-intrusive cookie/localStorage consent pill. |
| **6** | **Add meta titles and descriptions** | Dynamic document title and SEO description tags per active tool. |
| **7** | **Add a social preview image** | OpenGraph (`og:image`, `og:title`) & Twitter card preview tags in `index.html`. |
| **8** | **Add a favicon** | Modern SVG favicon with high-contrast DocuMorph glyph in `public/favicon.svg`. |
| **9** | **Generate sitemap and robots.txt** | Created in `frontend/public/robots.txt` and `frontend/public/sitemap.xml`. |
| **10** | **Add alt text to your images** | Audit every `<img>` tag across components to ensure meaningful `alt` attributes. |
| **11** | **Compress your images** | Compress and optimize sample demonstration assets in `frontend/public/samples/`. |
| **12** | **Check your page load speed** | Vite chunk splitting & lazy imports for fast `< 300ms` DOM ready. |
| **13** | **Fix your color contrast** | Ensure all text and badges pass WCAG AA (minimum 4.5:1 contrast ratio). |
| **14** | **Make it mobile friendly** | 100% responsive flexbox/grid layouts with touch targets `>= 44px`. |
| **15** | **Add a custom 404 page** | `NotFoundView.jsx`: Friendly error recovery view with 1-click home button. |
| **16** | **Fix any broken links** | Audit all navigation anchors and modal triggers. |
| **17** | **Add form validation** | Client-side validation: file size limit (50MB), PDF mime-type check, page range validation. |
| **18** | **Add spam/bot protection** | Backend client IP rate limiting middleware on `/api/process`. |
| **19** | **Set up analytics** | Privacy-first local telemetry hook tracking processing counts without external trackers. |
| **20** | **Add one clear call to action** | Prominent, high-contrast action button on every tool view (`Clean & Download`, `Compress Now`, `Extract Data`, `Translate Document`). |

---

## Verification Plan

### Automated Tests
- Run `npx oxlint` on frontend: verify 0 warnings, 0 errors.
- Run `npm run build` in `frontend`: verify production build builds cleanly under 500ms.
- Run `pytest tests/unit/test_diagram_snapping.py tests/unit/test_crop_sweeper.py`: verify boundary clipping and diagram extraction unit tests pass.

### Manual & Visual Verification
- Verify each of the 4 tool pages has distinct color branding, specialized options, and unique proof viewers.
- Verify diagram cropping cleanly avoids overlapping text lines.
- Verify spam watermarks/Telegram logos are rejected from extracted diagrams.
- Verify translation view renders translated diagram label glossaries.
- Verify Privacy Policy, Terms, Cookie Consent, Favicon, robots.txt, and sitemap work properly.
