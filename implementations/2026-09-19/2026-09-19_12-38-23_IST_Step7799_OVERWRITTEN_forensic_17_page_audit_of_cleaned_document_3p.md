---
timestamp_ist: "2026-09-19 12:38:23 IST"
timestamp_utc: "2026-09-19T07:08:23Z"
step_index: 7799
status: "OVERWRITTEN"
tool_action: "write_to_file"
overwritten_by: "Step 7830 on 2026-09-19 13:39:43 IST ('Forensic 17-Page Audit of `cleaned_document (3).pdf` & Fix Plan')"
title: "Forensic 17-Page Audit of `cleaned_document (3).pdf` & Fix Plan"
description: "Implementation plan with 17-page bug audit and fix strategy"
---

> **Plan Status: `OVERWRITTEN`**  
> **Timestamp:** Saturday, September 19, 2026 at 12:38:23 PM IST (2026-09-19T07:08:23Z)  
> **Transcript Step:** `7799`  
> **Lifecycle Note:** This plan was later replaced/overwritten by Step 7830 on 2026-09-19 13:39:43 IST ('Forensic 17-Page Audit of `cleaned_document (3).pdf` & Fix Plan')

---

# Forensic 17-Page Audit of `cleaned_document (3).pdf` & Fix Plan

## Problem & Document Forensic Diagnosis

The user audited `cleaned_document (3).pdf` (17 pages, compiled from Chapter 6: Electromagnetic Induction). The document exhibited severe defects across math rendering, markdown tables, typography, and translation.

---

## 1. Page-by-Page Bug Audit of `cleaned_document (3).pdf`

| Page | Defects Found | Visual & Functional Reality |
| :--- | :--- | :--- |
| **Page 1** | • 0% Translation (100% English notes despite Translation tool)<br>• Leaked Markdown table pipes `| :--- | :--- |` | Notes remained in raw English. Intro table rendered as raw text pipes at top of page. |
| **Page 2** | • Leaked Markdown table pipes `| :--- | :--- | | B | B | | A | A |`<br>• Word spacing collapse: `Ifthereare′ ′turns,` | Markdown table failed to compile into HTML table due to missing header and `[^\n]` blank line insertion. Formula line broke onto 6 disconnected rows. |
| **Page 3** | • **Near-Empty Page Void** (only 23 characters: `e = -N \frac{d\phi}{dt}`)<br>• Page break cascade | Formula isolated on empty page due to unclosed `$$` block spanning across pages. |
| **Page 4** | • Prose trapped in `$$`: `$$The negative sign indicates that...`<br>• 2 Leaked Markdown tables: `| Diagram Label (Original) | Translation (English) | | :--- | ...` (10 rows joined on 1 line) | MathJax attempted to render English prose as algebra. Diagram glossaries rendered as raw markdown strings. |
| **Page 5** | • Leaked Markdown glossary table pipes `| :--- | :--- |`<br>• Untranslated narrative | English text about motional emf un-translated. Table rendered as raw unparsed markdown. |
| **Page 6** | • **2 Red "Math input error" Badges**<br>• Prose in math: `$$Therefore the **flux linkage with a coil of 'N' turns ** is N\Phi_B and \text{L}`<br>• Table trapped inside `$$`: `| Diagram Label ... | \sim | \sim |$$`<br>• Word spacing collapse: `uttheMagneticfieldinsidethesolenoid` | Markdown table was embedded inside `$$ ... $$` math delimiters. MathJax choked on table pipes, rendering fatal red error badges. English words without `\text{}` had all spaces removed by LaTeX. |
| **Page 7** | • **1 Red "Math input error" Badge**<br>• Word spacing collapse: `ComparingthiswithNΦB = LI` | Prose `Comparing this with` trapped in math mode, removing spaces and triggering MathJax syntax failure. |
| **Page 8** | • Markdown heading trapped in `$$`: `$$### Problem A plot of magnetic flux(\phi) versus current(I)...`<br>• Leaked Markdown glossary table | Heading `###` was treated as math token, losing heading styling and typography. |
| **Page 9** | • Leaked Markdown glossary table: `| Diagram Label (Original) | Translation (English) | | :--- | :--- | | Coil 2 with N_2 turns | ...` | Concatenated table rows on a single line failed markdown table parser. |
| **Page 10** | • **2 Red "Math input error" Badges**<br>• Prose & headings in `$$`: `$$Where the constant 'M' is called... ### EMF INDUCED...` | MathJax crashed parsing `###` and multiline English definitions inside display math. |
| **Page 11** | • **3 Red "Math input error" Badges**<br>• Broken LaTeX arrows `\Rightarrow` | Bare unshielded formulas without delimiters or with broken brackets triggered 3 MathJax errors. |
| **Page 12** | • **2 Red "Math input error" Badges**<br>• Energy derivation broken math blocks | Work integral derivation `dw = L I dI` collided with unclosed delimiters. |
| **Page 13** | • Heading in `$$`: `$$## AC GENERATOR ### Construction...`<br>• Word spacing collapse: `ccordingtoFaraday`<br>• Leaked Markdown glossary table | Major topic title and construction section lost typography; words squashed together. |
| **Page 14** | • Prose after math: `\Rightarrow \boxed{e = e_0 \sin \omega t}$$ Where i.e., a sinusoidal emf...` | Trailing explanation stuck to boxed equation delimiter. |
| **Page 15** | • Leaked Markdown table: `| B | B | | Stage5 Armature after rotating through | ...` | Stages table rendered as unparsed markdown pipes. |
| **Page 16** | • **Data Loss / Blank Numeric Gaps**: `1.a) Coefficient of mutual inductance of two coils is . Current in one of the coils is increased from to in .`<br>• Blank options: `(a) (b) (c) (d) 1`<br>• Values displaced to bottom stack: `1 H`, `4 A`, `5 A`, `1 ms`, `1000 V`, `2000 V`, `100 V`, `200 V` | Numbers and units were severed from question stems and dumped as orphan strings at the footer. |
| **Page 17** | • **Data Loss / Blank Numeric Gaps**: `4. Current in a circuit falls from to in . If an average emf of is induced...`<br>• Values displaced to bottom stack: `5.0 A`, `0.0 A`, `0.1 s`, `200 V` | Numeric parameters and units severed from question stem. |

---

## 2. Root Cause Analysis

1. **Line 307 of `pdf_compiler.py` Destroyed Every Table in the System**:
   - Code: `markdown_text = re.sub(r'([^\n])\n(\|)', r'\1\n\n\2', markdown_text)`
   - Because `[^\n]` matches the trailing pipe `|` of table rows, this regex matched `|\n|` and inserted `\n\n` between **every single row** of every table! In Python Markdown (`extensions=['tables']`), any blank line between header and rows immediately aborts table parsing and dumps raw `<p>| ... |</p>` tags into HTML.
2. **Devanagari-Only Math Siphoning Trapped English Prose & Tables in `$$`**:
   - In both `format_fixer.py` and `pdf_compiler.py`, `_clean_math_block` had:
     `if not has_devanagari: return f"\n\n$${block_clean.strip()}$$\n\n"`
   - If the block contained English prose ("Therefore the flux linkage..."), headings (`###`), figures, or diagram glossary tables, it left the entire content inside `$$ ... $$`.
   - MathJax cannot parse Markdown tables or headings in TeX mode, throwing the **"Math input error"** badges seen on pages 6, 7, 10, 11, and 12.
3. **LaTeX Math Mode Word Collapse**:
   - In LaTeX math mode, spaces are ignored and letters are treated as variables multiplied together ($C \cdot o \cdot m \cdot p \dots$). Trapped English sentences collapsed into `ComparingthiswithNΦB = LI`, `uttheMagneticfieldinsidethesolenoid`, and `ccordingtoFaraday`.
4. **Single-Line Concatenated Table Rows**:
   - When Gemini outputs diagram glossary tables with multiple rows joined with `| |` on a single line (`| col1 | col2 | | col3 | col4 |`), Python Markdown cannot parse them without row newlines.
5. **Missing Table Headers**:
   - Tables starting directly with `| :--- | :--- |` without a header row are rejected by standard markdown table parsers.
6. **Numeric Severing on Pages 16 & 17**:
   - When `NativeExtractor` extracted text from pages with multi-column exam questions, overlapping math/table bounding boxes separated inline numerical parameters (`1 H`, `4 A`, `5 A`, `1 ms`) from question stems and appended them at the bottom of the page.

---

## 3. Proposed Changes

### Component 1: `documorph/compilers/pdf_compiler.py`

#### [MODIFY] [pdf_compiler.py](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/documorph/compilers/pdf_compiler.py)
- Fix table newline injection regex from `([^\n])\n(\|)` to `([^\n|])\n(\|)` so blank lines are never inserted between table rows.
- Upgrade `_clean_math_block` to a Universal Math Siphon that extracts:
  - Markdown headings (`#`, `##`, `###`)
  - Markdown table rows (`| ... |`)
  - Figure references (`[Figure: ...]`, `Figure: ...`)
  - Bullet/number list items
  - Devanagari sentences (>3 Devanagari chars)
  - English prose sentences (>=3 natural English words without LaTeX commands)
- Implement `split_table_rows`: splits concatenated rows joined with `| |` onto separate lines.
- Implement `ensure_table_headers`: automatically prepends `| Symbol / Item | Description / Translation |` if a table starts with a separator row (`| :--- |`).
- Add CSS styling for `.diagram-glossary-table` and standard tables with border-collapse, light headers, and alternating row backgrounds.

---

### Component 2: `documorph/postprocessing/format_fixer.py`

#### [MODIFY] [format_fixer.py](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/documorph/postprocessing/format_fixer.py)
- Fix line 217 `([^\n\s])\n(\|)` to `([^\n|])\n(\|)` to preserve table row continuity.
- Replace Devanagari-only `_clean_display_math` with the Universal Math Siphon.
- Add split concatenated table rows logic.
- Auto-extract prose lead-in phrases (`Comparing this with`, `Therefore the`, `Where the`, `We know`, `According to`) outside math blocks so letters are not squashed together.

---

### Component 3: `documorph/core/batch_vision.py` & `documorph/worker/pipeline.py`

#### [MODIFY] [batch_vision.py](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/documorph/core/batch_vision.py)
- Clarify diagram glossary prompt so Gemini explicitly places glossary tables outside math blocks with proper newlines between rows.

#### [MODIFY] [pipeline.py](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/documorph/worker/pipeline.py)
- Ensure all pages for `service_type == "translate"` route through translation without fallback to untranslated English.
- Protect inline units and question parameters from bounding box overlap severance.

---

### Component 4: `frontend/src/components/pages/TranslatePage.jsx` & `App.jsx`

#### [MODIFY] [TranslatePage.jsx](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/frontend/src/components/pages/TranslatePage.jsx)
- Ensure default `to_language: 'Hindi'` is initialized in config on first load.
- Ensure all user selections (Protect Math, Translate Diagrams, Target Language, Output Format) are immediately reactive and passed to the backend.

---

## 4. Verification Plan

### Automated Tests
1. Run unit and reproduction tests:
   `python scratch/test_pipeline_repro.py` — verifies that all 6 problematic samples render valid HTML tables and isolated math expressions.
2. Run backend test suite:
   `python -m pytest tests/unit/ -v` — verify all unit tests pass with zero regressions.
3. Run frontend linter and build:
   `npx oxlint` and `npm run build` — verify zero linter warnings and zero build errors.

### Manual / Visual Verification
1. Re-compile the exact 17-page `physics_ch_6` document with the Translate feature enabled.
2. Inspect every page of the newly generated PDF:
   - Verify **0** occurrences of "Math input error".
   - Verify **0** raw markdown table pipes (`| :--- |`) leaking onto pages.
   - Verify all prose and headings are styled outside `$$`.
   - Verify zero word collapses (`Comparing this with` has proper spaces).
   - Verify questions on pages 16 & 17 contain all numbers (`1 H`, `4 A`, `5 A`, `1 ms`, etc.) directly inside question sentences.
   - Verify fluent Hindi translation throughout narrative sections.
