# DocuMorph Comprehensive Visual Comparison Images Audit Report
**Date:** 2026-09-09 | **Status:** Complete Diagnostic & Root Cause Analysis  
**Audited Datasets:**  
1. `data/output/features/` (Phase 22 Matrix Sample: 50 Comparison Images)  
2. `data/output/feature2.0/` (Phase 23 Full-Page Benchmark: Active Stream, 19+ Comparison Images)  
**Total Images Inspected:** 69 Images analyzed programmatically and visually.

---

## Executive Summary & Key Findings

Direct forensic analysis of the comparison images (`*_comparison_p1.png` and `*_comparison_p2.png`) confirms that the current visual comparison generation engine suffers from **6 distinct defects**. 

These defects degrade the visual credibility of the before/after comparisons, causing well-processed PDFs to appear lopsided, empty, or unreadable, and in some cases masking pipeline behavior on scanned graphics and title slides.

| # | Defect Category | Severity | Prevalence | Root Cause |
|---|---|---|---|---|
| **1** | **Geometric Aspect Ratio Warping** | 🔴 Critical | **38 / 69 (55.1%)** | Height-matching landscape slides to portrait A4 makes scans 2.33x wider than output. |
| **2** | **Unicode Emoji Tofu (`??+??`)** | 🔴 Critical | **69 / 69 (100%)** | PIL default bitmap font cannot render UTF-8 emoji badges (`🌐+📐`, `🇬🇧+📐`, etc.). |
| **3** | **Microscopic Header Typography** | 🟡 High | **69 / 69 (100%)** | 10px default font rendered on a 3,866px wide canvas (font height is <0.3% of canvas). |
| **4** | **Diagram Linearization / Graphic Loss** | 🔴 Critical | **High on Scanned PDFs** | Pure scans bypass vector crop detection; Gemini transcribes diagrams into orphan text/arrows. |
| **5** | **Sparse A4 Layouts & 95%+ Whitespace** | 🟡 High | **62 / 69 (89.8%)** | 3-bullet slides rendered onto single-column A4 leave the lower 80% of the page blank. |
| **6** | **Blank Output Artifacts on Title Slides** | 🟠 Medium | **Isolated Cases** | Stripping watermarks on title slides leaves 0 text; compiler emits an empty page with only footer. |

---

## Detailed Defect Breakdown

### 1. Geometric Aspect Ratio Warping (Landscape 16:9 vs Portrait A4)
- **Symptoms:** The left image (raw scan) occupies 70% to 75% of the horizontal canvas width, while the right image (DocuMorph A4) is squashed into a narrow sliver on the right edge.
- **Measured Data:**
  - `1786936006_comparison_p1.png`: Total width `3,866px`, Left width `2,699px`, Right width `1,159px` (**Balance Ratio: 2.33:1**). Left aspect ratio is `1.65` (16:10 / 16:9 landscape slide), Right aspect ratio is `0.71` (standard A4 portrait `1 / 1.414`).
  - `1786936355_comparison_p1.png`: Total width `3,487px`, Left width `2,320px`, Right width `1,159px` (**Balance Ratio: 2.00:1**).
  - `1786937359_comparison_p1.png`: Total width `3,866px`, Left width `2,699px`, Right width `1,159px` (**Balance Ratio: 2.33:1**).
  - Across the entire benchmark, **38 out of 69 images** suffer from this distortion.
- **Root Cause Code (`scripts/run_comprehensive_benchmark.py:139-145`):**
  ```python
  target_height = max(img_left.height, img_right.height)
  if img_left.height != target_height:
      scale = target_height / img_left.height
      img_left = img_left.resize((int(img_left.width * scale), target_height), Image.Resampling.LANCZOS)
  ```
  When the raw scan is a horizontal slide (e.g. 1920x1080) and the compiled output is vertical A4 (1240x1754), matching the height scales the horizontal slide up until its height equals 1,754px. Its width explodes to $1920 \times (1754/1080) \approx 3,118\text{ px}$. Stitched side-by-side with a 1,159px A4 page, the left side dominates the canvas.
- **Fix:** Normalize both sides into standardized, equal-width visual viewing frames (e.g. 1200px width each) with aspect-ratio-preserving letterboxing (white padding) so both pages appear as natural documents in a dual-page reader.

---

### 2. Unicode Emoji Tofu (`??+??`) & Microscopic Typography
- **Symptoms:**
  - The right-side header displays `AFTER (??+?? En + Math Clean A4)` or `AFTER (??+?? Dual + Math Clean A4)`.
  - The header text is tiny and unreadable unless zoomed in to 300%–400%.
- **Measured Data:**
  - Canvas height: `1,684px`. Header height: `45px` (only 2.6% of canvas).
  - Rendered text height: ~10 pixels.
  - On a 4K or 1080p display, 10px text on a 3,866px image appears as a microscopic blur.
- **Root Cause Code (`scripts/run_comprehensive_benchmark.py:159-160`):**
  ```python
  draw.text((20, 14), label_left, fill=(51, 65, 85))
  draw.text((img_left.width + divider_width + 20, 14), label_right, fill=(30, 64, 175))
  ```
  Calling `draw.text()` without specifying a `font` parameter forces PIL to use its built-in bitmap default font (`load_default()`). This default font:
  1. Has a fixed size of ~10px.
  2. Does not contain glyphs for Unicode code points outside ASCII / Latin-1.
  3. When encountering emojis (`🌐`, `📐`, `🇬🇧`, `🇮🇳`), PIL replaces them with double question marks `??`.
- **Fix:**
  1. Load a high-resolution TrueType font (e.g. `Arial.ttf`, `SegoeUI.ttf`, or `Roboto` at `size=28`).
  2. Expand header banner height from `45px` to `70px`.
  3. Sanitize badge strings to clean ASCII labels (e.g. `[Dual + Math]`, `[En + Math]`, `[Hi + Math]`) so PIL never attempts to render multi-byte emoji sequences into a bitmap font.

---

### 3. Diagram Linearization & Graphic Loss on Scanned PDFs
- **Symptoms:**
  - Rich educational diagrams on the left (e.g. sound wave compression/rarefaction, tuning forks, speed hierarchy flowcharts, circuit schematics, geometric angles) disappear on the right.
  - In their place, the right side contains orphan text and emojis:
    - `(Sound) 🔊 ⚡ • →→ (Speed) • →→ • Solid → fast`
    - In `1786936082_comparison_p1.png`, the wave nature diagram and "VACUUM > GAS > LIQUID > SOLID" speed boxes are wiped out.
    - In `1786936166_comparison_p1.png`, coordinate vectors and triangle geometry are omitted.
- **Root Cause:**
  - In scanned documents (`COMPLEX: Scanned document: 1.40 image ratio`), `NativeExtractor` finds no vector drawings (`doc.get_drawings()` is empty).
  - The entire page is routed to `BatchVisionEngine` with Gemini Vision.
  - Gemini Vision tries to represent diagrams through ASCII flowcharts or text summaries because it is prompted to output Markdown.
  - The raster graphic regions are never cropped or preserved as embedded images.
- **Fix:**
  - For scanned pages containing visual diagrams (bounding boxes with high contour density / non-text pixel clusters $>4000\text{ px}^2$), crop the diagram bounding box directly from the page pixmap.
  - Save the cropped image to `data/intermediate/crops/` and embed it into the markdown stream as `![Figure](crops/crop_pX_figY.png)`.
  - The compiler will then render the clean cropped diagram directly inside the compiled A4 page.

---

### 4. Sparse A4 Layouts & 95%+ Whitespace
- **Symptoms:**
  - In **62 out of 69 comparison images**, the right half consists of over **94% pure white pixels**, with the bottom 75%–85% of the page being a giant empty void.
- **Measured Data:**
  - Average `right_white_pct` across all benchmark images: **96.4%**.
  - Slide inputs (e.g. `1786936006`, `1786936110`, `1786936483`) contain only 40–80 words per slide. When rendered on standard A4 (which fits 400–600 words), the content finishes in the top 3 inches, leaving the rest completely blank.
- **Impact:**
  - The user compares a slide packed with colors and graphics on the left against a nearly blank sheet of paper on the right, creating the impression that content was lost or truncated.
- **Fix:**
  - For slide-deck inputs (documents with landscape aspect ratio or $<100$ words per page), allow multi-slide aggregation (e.g. 2 slides per A4 page with clear horizontal separator cards) or compact 2-column slide notes layout.

---

### 5. Blank Output Artifacts on Title / Watermark Slides
- **Symptoms:**
  - `1786937072_comparison_p1.png`: Left side has a dark cover slide; Right side is **100% white** (`right_white_pct: 100.0%`).
  - The generated PDF (`1786937072_final.pdf`) has 1 page containing only `Page 1 of 1\n` with zero body text.
- **Root Cause:**
  - In `1786937072.pdf`, Pages 1, 2, and 3 only contain slide numbers (`1`, `2`, `3`) and a watermark string `| FREE :30 PM`.
  - DocuMorph's spam and watermark filters correctly stripped the watermark `| FREE :30 PM`.
  - This left the intermediate markdown for Pages 0 and 1 completely empty.
  - When the benchmark took a sample of Page 1 (index 0), it compiled an empty document.
- **Fix:**
  - If a page has zero substantive text after watermark filtering (or is purely a cover slide), flag the slide as `[Cover / Metadata Slide]` or preserve the original cover image as an embedded graphic rather than generating an empty white page.

---

### 6. Page-to-Page Alignment Skew (1:1 vs 1:N Condensation)
- **Symptoms:**
  - The benchmark compares Input Page $K$ with Output Page $K$.
  - In full-page runs, DocuMorph condenses multi-page slides into fewer A4 pages (e.g. 32 input slides $\to$ 8 output A4 pages in `1786936006`).
  - As a result, Output Page 1 contains the merged content of Input Slides 1, 2, 3, and 4.
  - Comparing Input Slide 2 directly to Output Page 2 shows content from Slide 2 on the left, but content from Slides 5–8 on the right!
- **Fix:**
  - For multi-page condensed documents, include page mapping telemetry in the comparison generator or display multi-slide thumbnail ribbons alongside the resulting A4 page.

---

## Benchmark Comparison Matrix Audit Summary

Below is the verified diagnostic audit across all comparison images generated in `data/output/`:

| Folder / Feature | File | Dimensions | Left AR | Right AR | Balance Ratio | Right Empty % | Primary Defect |
|---|---|---|---|---|---|---|---|
| `01_clean_dual_math` | `1786936006_comparison_p1.png` | 3866x1684 | 1.65 (16:9) | 0.71 (A4) | **2.33:1** | 97.2% | Landscape warping + Tofu + 97% whitespace |
| `01_clean_dual_math` | `1786936355_comparison_p1.png` | 3487x1684 | 1.42 (4:3) | 0.71 (A4) | **2.00:1** | 95.5% | 4:3 slide warping + Tofu |
| `01_clean_dual_math` | `1786936903_comparison_p1.png` | 2324x1684 | 0.71 (A4) | 0.71 (A4) | 1.00:1 | 96.7% | Balanced AR; Microscopic font + Tofu |
| `02_clean_en_math` | `1786936060_comparison_p1.png` | 2324x1684 | 0.71 (A4) | 0.71 (A4) | 1.00:1 | 98.1% | Diagrams replaced by orphan arrows + Tofu |
| `02_clean_en_math` | `1786937383_comparison_p1.png` | 3866x1684 | 1.65 (16:9) | 0.71 (A4) | **2.33:1** | 97.8% | Landscape warping + 98% whitespace |
| `03_clean_hi_math` | `1786936082_comparison_p1.png` | 3487x1684 | 1.42 (4:3) | 0.71 (A4) | **2.00:1** | 96.8% | 4:3 warping + wave diagram destroyed |
| `03_clean_hi_math` | `1786937421_comparison_p1.png` | 3866x1684 | 1.65 (16:9) | 0.71 (A4) | **2.33:1** | 98.9% | Landscape warping + 99% whitespace |
| `04_clean_only_english`| `1786936110_comparison_p1.png` | 3866x1684 | 1.65 (16:9) | 0.71 (A4) | **2.33:1** | 98.4% | Landscape warping + Tofu |
| `04_clean_only_english`| `1786937072_comparison_p1.png` | 3866x1684 | 1.65 (16:9) | 0.71 (A4) | **2.33:1** | **100.0%** | **Blank right side (watermark-only slide 1)** |
| `05_clean_only_hindi` | `1786936125_comparison_p1.png` | 3866x1684 | 1.65 (16:9) | 0.71 (A4) | **2.33:1** | 98.9% | Landscape warping + Tofu |
| `05_clean_only_hindi` | `1786937088_comparison_p1.png` | 3866x1684 | 1.65 (16:9) | 0.71 (A4) | **2.33:1** | 99.4% | Landscape warping + 99% whitespace |
| `06_clean_only_math` | `1786936166_comparison_p1.png` | 3866x1684 | 1.65 (16:9) | 0.71 (A4) | **2.33:1** | 97.7% | Landscape warping + geometry diagrams lost |
| `06_clean_only_math` | `1786941264_comparison_p1.png` | 3866x1684 | 1.65 (16:9) | 0.71 (A4) | **2.33:1** | 99.9% | Extreme sparse page + 2.33x width warp |
| `07_compress_resizer` | `1786936241_comparison_p1.png` | 3866x1684 | 1.65 (16:9) | 0.71 (A4) | **2.33:1** | 98.3% | Landscape warping + Tofu |
| `07_compress_resizer` | `1786937240_comparison_p1.png` | 3866x1684 | 1.65 (16:9) | 0.71 (A4) | **2.33:1** | 99.2% | Landscape warping + 99% whitespace |
| `09_translate_regional`| `1786936321_comparison_p1.png` | 2326x1684 | 0.71 (A4) | 0.71 (A4) | 1.00:1 | **100.0%** | Blank cover page scan |
| `09_translate_regional`| `1786937324_comparison_p1.png` | 3866x1684 | 1.65 (16:9) | 0.71 (A4) | **2.33:1** | 98.5% | Landscape warping + Tofu |

---

## Recommendations & Action Plan

1. **Implement Frame-Normalized Comparison Generator:**
   - Update `create_side_by_side_comparison()` in `scripts/run_comprehensive_benchmark.py`.
   - Instead of stretching width dynamically to match height, define a fixed dual-page canvas (e.g. `2400 x 1750`).
   - Place each page inside a dedicated `1160 x 1650` container using letterboxed fitting (`ImageOps.pad` with white background).
   - Both sides will occupy exactly 50% of the canvas width, completely eliminating the 2.33x lopsided warping.
2. **Upgrade Typography & Eliminate Unicode Tofu:**
   - Use `ImageFont.truetype("arial.ttf", 26)` (or Segoe UI on Windows) with an expanded `70px` header banner.
   - Clean emoji characters to ASCII bracket badges (e.g. `[Dual + Math]`, `[En + Math]`, `[Hi + Math]`, `[Compress]`).
3. **Diagram Region Preservation Engine:**
   - Add a pre-pass in `crop_sweeper.py` for scanned pages to detect graphic regions using contour bounding boxes.
   - Crop and embed graphics directly into the markdown rather than letting Vision AI attempt to transcribe diagrams into text arrows.
4. **Slide-to-A4 Aggregation Mode:**
   - For sparse slide decks, offer a 2-slide-per-page condensed format to eliminate 95% whitespace voids on compiled A4 sheets.
