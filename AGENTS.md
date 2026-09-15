# AGENTS.md — DocuMorph Engineering & Autonomous Agent Operating Protocol
# This file governs all AI coding agents (Antigravity, Cursor, Claude Code, Roo Code, Gemini CLI) working on DocuMorph.

## 0. Project Overview & Architecture
DocuMorph AI converts messy, handwritten, photographed, or scanned educational and legal PDFs (UPSC, JEE/NEET, CLAT, Coaching Notes) into pristine Markdown, LaTeX formulas, and clean printable PDFs.
- **Frontend**: React 18, Vite, Vanilla CSS design system, Anime.js interactive proof slider.
- **Backend**: FastAPI (Python 3.11+), PyMuPDF (fitz), Google GenAI / OmniRoute vision pipeline, SQLite job store.
- **AI Gateway**: OmniRoute (`http://localhost:20128/v1`) multi-provider quota-aware failover + Caveman token compression.

---

## 1. Active Plugins & Autonomous Protocols
The following 4 plugins are installed in `.agents/plugins/` and MUST be loaded and adhered to on every task:

### 1.1 `gsd` (Git, Ship, Done)
- **Workflow**: Context Init → Spec-Driven Development (`spec.md`) → Atomic Micro-Slices → Kill-Gate Empirical Verification → Multi-commit Git Shipping.
- **Rules**: Never write code before understanding architectural contracts. Enforce atomic commits per feature slice.

### 1.2 `roo-code-nightly` (Cognitive Multi-Mode Engineering)
- **Modes**:
  - `ARCHITECT`: System design, interface definitions, HLD/LLD diagrams, schema migration.
  - `CODE`: Production-grade implementation, zero bloat, adhering to strict typing.
  - `TEST`: Automated unit, integration, and fuzz testing against boundary cases.
  - `REVIEW`: Multi-axis sanity check against regressions and performance traps.
  - `DEBUG`: Systematic root-cause isolation and minimal non-breaking fixes.
- **Contract**: Explicit transitions between modes; never code while in architect mode.

### 1.3 `ralph-loop` (Recursive Self-Healing Verification)
- **Workflow**: Recursive execution loop where any command failure or test regression triggers automated traceback analysis, isolated patch generation, and empirical re-verification before reporting.
- **Checklist**: Mandatory evaluation of the **Senior Reviewer 5 Questions** before presenting any solution.

### 1.4 `coderabbit` (Multi-Axis Automated Code Review)
- **Standards**: Multi-axis review across Security, Performance, Concurrency/Race conditions, WCAG Accessibility, and Edge-Case Stress Testing before marking any task as complete.

---

## 2. OmniRoute AI Gateway Protocol (Vision Rate Limit & Cost Avoidance)
- **Local Endpoint**: `http://localhost:20128/v1/chat/completions`
- **Fallback Hierarchy**:
  1. Local OmniRoute gateway (`http://localhost:20128/v1`) with quota-aware routing across 352 providers / 150+ free tiers.
  2. Direct Native `google.genai` SDK (`gemini-2.5-flash` / `gemini-2.5-pro`) with exponential jitter backoff.
  3. Cloud failover node (Render / Cloudflare Worker).
- **Compression Rule**: Always apply RTK & Caveman prompt compression to remove conversational filler from OCR/LaTeX prompts, saving 15–40% in vision tokens.

---

## 3. Frontend Usability Heuristics & Design System Standards
Every UI modification MUST strictly satisfy the 13 Usability Heuristics established in the September 2026 Audit:
1. **Corner Radii (Max 4 Tokens)**:
   - `--radius-xs: 4px` (tooltips, micro tags)
   - `--radius-sm: 8px` (buttons, inputs, select chips)
   - `--radius-md: 12px` (inner cards, dropzones, stages)
   - `--radius-lg: 16px` (outer modal cards, hero banners)
   - `--radius-full: 9999px` (circular dots, rounded pill badges)
2. **Button Archetypes (Max 4 Styles)**:
   - Primary Action (`.btn-primary` / `.tool-execute-btn`)
   - Secondary / Outlined (`.btn-secondary`)
   - Ghost / Icon Utility (`.btn-ghost` / `.header-icon-btn`)
   - Segmented / Selection Chip (`.btn-chip` / `.compact-exam-chip`)
3. **Typography Scale**: Minimum body/label copy is `12px` (`0.75rem`). Never render functional labels at `10px` or `11px`.
4. **Strict Heading Hierarchy**: Never skip heading levels (`h1` → `h2` → `h3`). DropZone prompt is `h2.dropzone-main-text`.
5. **Proximity & Form Controls**: Checkboxes and radio buttons MUST precede their text labels with an 8–12px gap inside clickable `<label className="tool-setting-row">` elements. Never right-align checkboxes across wide containers.
6. **Hero Action Hierarchy**: Primary preview states ("Clean") must feature high-contrast accent styling (`.proof-preset-chip--highlight`) distinct from neutral framing controls ("50/50").
7. **Icon Semantics**: Maintain consistent visual vocabulary. "Clean & Format" consistently uses the Sparkle icon (`✨` / SVG sparkle), never a raw status dot.
8. **Navigation Cleanliness**: Avoid redundant back/breadcrumb buttons within 40px of each other. Use semantic `<nav aria-label="Breadcrumb">` trails.
9. **Interactive Affordances**: Never style whole-container dropzones with underlined anchor text (`.browse-link`) that implies false precision. The entire dropzone must visually invite drops and clicks.
10. **Information Density**: Maximum 1 primary icon/emoji per compact button. Avoid dense composite badges (`🌐+📐`).
11. **Selection State Consistency**: Both exam chips and language pills must use the identical solid primary fill (`background: var(--color-primary); color: #fff;`) when selected.
12. **Contextual Grouping**: Informational triggers ("💡 Tip") must be visually and functionally separated from actionable filter chips.
13. **WCAG Compliance**: All interactive elements must have `aria-label`, visible keyboard `:focus-visible` rings, and 4.5:1 minimum contrast ratios.

---

## 4. Testing & Verification Protocol
Before presenting ANY code as complete, run empirical verifications:
```bash
# Frontend validation
cd frontend
npm run build
npm test --if-present

# Backend validation
pytest tests/ -v
python -m py_compile $(git ls-files '*.py')
```
- A test description is NOT a result. Only claim tests passed if executed and confirmed in the active session.
- Output ending statement MUST adhere to the mandatory verification protocol:
  - `"Verified: ran successfully, output was X"`
  - `"Verified: matches [doc URL] as of [date checked]"`
  - `"NOT verified — I did not run this or check current docs. Treat as a draft."`

---

## 5. Checkpointing & State Discipline
- Before ending or switching tasks, update:
  - `STATE.md`: Active feature status, test results, blockers.
  - `DECISIONS.md`: Architectural choices with a one-line rationale.
  - `MISTAKES.md`: Bugs encountered, root causes, and permanent preventions.
