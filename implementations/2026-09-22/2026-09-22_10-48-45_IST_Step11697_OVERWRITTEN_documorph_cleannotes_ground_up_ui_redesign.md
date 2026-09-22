---
timestamp_ist: "2026-09-22 10:48:45 IST"
timestamp_utc: "2026-09-22T05:18:45Z"
step_index: 11697
status: "OVERWRITTEN"
tool_action: "write_to_file"
overwritten_by: "Step 11711 on 2026-09-22 10:56:49 IST ('DocuMorph → CleanNotes: Ground-Up UI Redesign (V2)')"
title: "DocuMorph → CleanNotes: Ground-Up UI Redesign"
description: "Complete ground-up UI/UX redesign plan for DocuMorph. New visual identity, new architecture, new component tree. Every screen wireframed."
---

> **Plan Status: `OVERWRITTEN`**  
> **Timestamp:** Tuesday, September 22, 2026 at 10:48:45 AM IST (2026-09-22T05:18:45Z)  
> **Transcript Step:** `11697`  
> **Lifecycle Note:** This plan was later replaced/overwritten by Step 11711 on 2026-09-22 10:56:49 IST ('DocuMorph → CleanNotes: Ground-Up UI Redesign (V2)')

---

# DocuMorph → CleanNotes: Ground-Up UI Redesign

## The Problem (Why the current UI fails)

| What's broken | Why it hurts |
|---|---|
| 5200+ lines of homepage (Hero → Studio → Scoreboard → ProofViewer → Metrics → HowItWorks → Testimonials → Footer) | User scrolls past 4 marketing sections before seeing their own notes |
| 4 duplicate tool pages (`CleanFormatPage`, `CompressPage`, `ExtractTextPage`, `TranslatePage`) that are the same layout with different emoji | Wasted code, inconsistent UX, user confusion |
| Header has Admin Console link in consumer nav | Violates segregation rule |
| Indigo `#6366f1` / Cyan `#06b6d4` / Emerald `#10b981` — the same palette every AI tool uses | Looks generic, not premium |
| "Engine Active • < 25ms FastPath" badge, "AI Transformation Cockpit" — jargon | Users are students, not DevOps engineers |
| Wizard steps (1→2→3→4) with page jumps | Interrupts flow; modern tools are single-canvas |

---

## New Visual Identity

### Color System — "Ink & Paper"

No indigo. No cyan. No emerald. A neutral-warm palette with one sharp accent.

| Token | Light | Dark | Purpose |
|---|---|---|---|
| `--bg-app` | `#FAFAF9` (Stone-50) | `#0C0A09` (Stone-950) | App background |
| `--bg-surface` | `#FFFFFF` | `#1C1917` (Stone-900) | Cards, panels |
| `--bg-surface-2` | `#F5F5F4` (Stone-100) | `#292524` (Stone-800) | Nested surfaces |
| `--bg-surface-hover` | `#E7E5E4` (Stone-200) | `#44403C` (Stone-700) | Hover states |
| `--border` | `#D6D3D1` (Stone-300) | `#44403C` (Stone-700) | Default borders |
| `--border-subtle` | `#E7E5E4` (Stone-200) | `#292524` (Stone-800) | Faint dividers |
| `--text-1` | `#1C1917` (Stone-900) | `#FAFAF9` (Stone-50) | Primary text |
| `--text-2` | `#57534E` (Stone-600) | `#A8A29E` (Stone-400) | Secondary text |
| `--text-3` | `#A8A29E` (Stone-400) | `#78716C` (Stone-500) | Muted text |
| `--accent` | `#DC2626` (Red-600) | `#EF4444` (Red-500) | Primary accent (CTA, active) |
| `--accent-soft` | `#FEF2F2` (Red-50) | `rgba(239,68,68,0.12)` | Accent background |
| `--success` | `#16A34A` (Green-600) | `#22C55E` (Green-500) | Completed states |
| `--warning` | `#D97706` (Amber-600) | `#F59E0B` (Amber-500) | Warnings |

> [!IMPORTANT]
> **Why red accent?** It's bold, high-contrast, instantly scannable as the "do this" action. Think YouTube's red play button, Netflix's red CTA, Notion's red accent. It's the anti-indigo.

### Typography — "Geist Mono meets Newsreader"

| Use | Font | Weight | Why |
|---|---|---|---|
| Display headings | **Geist** (Vercel's font) | 600 | Geometric, modern, tight. Free. |
| Body + UI | **Inter** | 400, 500, 600 | The industry standard for UI. Readable at every size. |
| Code / metrics | **Geist Mono** | 400 | Monospace for file sizes, percentages, IDs |

Load via `<link>` from Google Fonts (Inter) + self-host Geist (it's MIT licensed, served from `/fonts/`).

### Spacing & Layout

- **Max content width**: `720px` (reading width, not a wide dashboard)
- **Card padding**: `20px` (desktop), `16px` (mobile)
- **Section gap**: `48px`
- **Border radius**: `8px` cards, `6px` buttons, `4px` inputs, `9999px` pills
- **No box shadows on cards** — use `1px` solid borders only. Shadows are used sparingly on modals/dropdowns.

---

## New Architecture — What Goes Where

### Page Map (5 views total, down from 10+)

```
/           → Home (the one-and-only workspace)
/#vault     → Note Vault (history) — scrolls to vault section
/#backers   → Backers page (standalone)
/#faq       → FAQ (standalone)
/#privacy   → Privacy (standalone)
/#terms     → Terms (standalone)
/admin      → Admin (completely separate render tree)
```

> [!IMPORTANT]
> **Killing 4 separate tool pages** (`CleanFormatPage`, `CompressPage`, `ExtractTextPage`, `TranslatePage`). All 4 tools now live inside the single home workspace as a tab switcher. One canvas. Zero page jumps.

### Home Layout — The Only Screen That Matters

```
┌────────────────────────────────────────────────────────┐
│  HEADER BAR (48px, sticky)                             │
│  [CN logo]          [Vault] [Theme ☀] [☕ Support]    │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌────────────────────────────────────────────────┐    │
│  │  TOOL TABS  (segmented control, 4 tools)       │    │
│  │  [ ✨ Clean ]  [ 📐 Compact ]  [ 📋 Extract ] │    │
│  │  [ 🌐 Translate ]                              │    │
│  └────────────────────────────────────────────────┘    │
│                                                        │
│  ┌────────────────────────────────────────────────┐    │
│  │                                                │    │
│  │  DROP ZONE (dashed border, 200px tall)          │    │
│  │                                                │    │
│  │  📄  Drop your PDF here, or click to browse    │    │
│  │                                                │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐     │    │
│  │  │ Chemistry │  │ Physics  │  │ Law Notes│     │    │
│  │  │  Sample   │  │  Sample  │  │  Sample  │     │    │
│  │  └──────────┘  └──────────┘  └──────────┘     │    │
│  └────────────────────────────────────────────────┘    │
│                                                        │
│  ┌── SETTINGS PANEL (collapsible, only if needed) ┐    │
│  │  Doc Type: [Auto ▾]  Pages: [All ▾]            │    │
│  │  ☑ Fix formulas   ☑ Keep images                │    │
│  └────────────────────────────────────────────────┘    │
│                                                        │
│  ┌────────────────────────────────────────────────┐    │
│  │ [ ▶ Process Document ]  (full-width red CTA)   │    │
│  └────────────────────────────────────────────────┘    │
│                                                        │
│  ─── or, when processing: ──────────────────────────   │
│                                                        │
│  ┌────────────────────────────────────────────────┐    │
│  │  PIPELINE PROGRESS                              │    │
│  │  ████████████░░░░░░░░░░  67%                   │    │
│  │  Stage 3/5: AI Reading • 42s elapsed            │    │
│  └────────────────────────────────────────────────┘    │
│                                                        │
│  ─── or, when done: ────────────────────────────────   │
│                                                        │
│  ┌────────────────────────────────────────────────┐    │
│  │  ✅ RESULT CARD                                 │    │
│  │  Chemistry_Unit5.pdf → Cleaned                  │    │
│  │  18 pages • 4.2 MB → 2.1 MB (−50%)            │    │
│  │                                                 │    │
│  │  [ ⬇ Download PDF ]  [ 📋 Copy Markdown ]     │    │
│  │  [ 🔄 Re-process ]   [ ✨ New Document ]       │    │
│  └────────────────────────────────────────────────┘    │
│                                                        │
├── NOTE VAULT ──────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────┐    │
│  │  🗄 Note Vault           [🔍 Search...] [All ▾]│    │
│  ├────────────────────────────────────────────────┤    │
│  │  Today                                          │    │
│  │  ┌──────┐ ┌──────┐ ┌──────┐                    │    │
│  │  │ Note │ │ Note │ │ Note │   (compact cards)  │    │
│  │  │ −50% │ │ −32% │ │ −61% │                    │    │
│  │  └──────┘ └──────┘ └──────┘                    │    │
│  │                                                 │    │
│  │  Yesterday                                      │    │
│  │  ┌──────┐ ┌──────┐                              │    │
│  │  │ Note │ │ Note │                              │    │
│  │  └──────┘ └──────┘                              │    │
│  │                                                 │    │
│  │  [ Load More ]                                  │    │
│  └────────────────────────────────────────────────┘    │
│                                                        │
├── FOOTER ──────────────────────────────────────────────┤
│  CleanNotes • Free & Private   [FAQ] [Privacy] [Terms] │
└────────────────────────────────────────────────────────┘
```

### Key UX Decisions

1. **Single canvas, 3 states**: Upload → Processing → Result. The same `<main>` container morphs between states. No page transitions, no router changes, no "Step 2 of 4" wizard.

2. **Tool tabs are a segmented control** at the top of the workspace — not navigation links. Switching a tab changes the config panel, not the page.

3. **Settings panel defaults to collapsed** — the defaults are smart enough. Only power users expand it.

4. **Note Vault is below the workspace** on the same page, not a sidebar drawer. On mobile, it's accessible via a vault button in the header that smooth-scrolls down.

5. **No marketing sections on home.** No scoreboard, no testimonials, no "how it works 3-pass", no metrics grid, no proof viewer, no popular tools footer. The tool IS the landing page. Trust is earned by letting people try a sample instantly.

6. **Sample documents** are in the drop zone itself as ghost buttons. One click = instant demo. No separate "Interactive Quality Preview" section.

---

## Component Tree (New)

```
App.jsx
├── Header.jsx           (minimal: logo + vault + theme + support)
├── <main>
│   ├── Workspace.jsx     (the single canvas)
│   │   ├── ToolTabs.jsx          (segmented control: 4 tools)
│   │   ├── DropZone.jsx          (drag/drop + samples)
│   │   ├── SettingsPanel.jsx     (collapsible per-tool config)
│   │   ├── ProcessButton.jsx     (CTA)
│   │   ├── ProgressTracker.jsx   (pipeline stages)
│   │   └── ResultCard.jsx        (download/copy/reprocess)
│   │
│   ├── NoteVault.jsx     (history grid, search, date filter)
│   │   └── NoteCard.jsx          (individual history item)
│   │
│   ├── BackersPage.jsx   (standalone, when hash=#backers)
│   ├── FAQPage.jsx       (standalone)
│   ├── PrivacyPage.jsx   (standalone)
│   └── TermsPage.jsx     (standalone)
│
├── Footer.jsx            (slim 1-line)
├── ToastContainer.jsx
├── DonationModal.jsx
├── SubmitUtrModal.jsx
└── CookieConsent.jsx
```

### Files to DELETE (purge)

| File | Reason |
|---|---|
| `components/home/AcademicScoreboard.jsx` | Marketing clutter |
| `components/home/MetricsStatGrid.jsx` | Marketing clutter |
| `components/home/HowItWorksThreePass.jsx` | Marketing clutter |
| `components/home/AspirantTestimonials.jsx` | Marketing clutter |
| `components/home/WriteReviewModal.jsx` | Coupled to testimonials |
| `components/common/PopularToolsFooter.jsx` | Link dump |
| `components/common/InteractiveProofViewer.jsx` | Replaced by sample-in-dropzone |
| `components/common/HeaderBanner.jsx` | Ticker banner noise |
| `components/hero/HeroSection.jsx` | Hero is dead; workspace IS the hero |
| `components/pages/CleanFormatPage.jsx` | Merged into Workspace tabs |
| `components/pages/CompressPage.jsx` | Merged into Workspace tabs |
| `components/pages/ExtractTextPage.jsx` | Merged into Workspace tabs |
| `components/pages/TranslatePage.jsx` | Merged into Workspace tabs |
| `components/pages/ToolDirectory.jsx` | No longer needed |
| `components/workspace/CleanNotesStudio.jsx` | Replaced by new Workspace |
| `components/workspace/HomeWorkspace.jsx` | Replaced |
| `components/workspace/WorkspaceScreen.jsx` | Replaced |
| `components/workspace/ServiceTabs.jsx` | Replaced by ToolTabs |
| `components/workspace/DocumentPresetPicker.jsx` | Merged into DropZone |
| `components/workspace/QuickSettingsToggles.jsx` | Merged into SettingsPanel |
| `components/common/Sidebar.jsx` | History is now inline NoteVault |
| `styles/hero.css` | No hero section |
| `styles/homeComponents.css` | No home marketing components |
| `styles/toolPages.css` | No separate tool pages |
| `styles/workspace.css` | Rewritten from scratch |

### Files to CREATE

| File | Content |
|---|---|
| `styles/app.css` | Single unified stylesheet (replaces 6 CSS files) |
| `components/workspace/Workspace.jsx` | The single canvas (upload/process/result) |
| `components/workspace/ToolTabs.jsx` | Segmented control for 4 tools |
| `components/workspace/SettingsPanel.jsx` | Collapsible per-tool config |
| `components/workspace/ProcessButton.jsx` | CTA button with loading state |
| `components/workspace/ProgressTracker.jsx` | Pipeline progress bar |
| `components/workspace/ResultCard.jsx` | Download/copy/reprocess |
| `components/vault/NoteVault.jsx` | History grid |
| `components/vault/NoteCard.jsx` | Individual note card |
| `components/common/Footer.jsx` | Slim footer |

### Files to MODIFY

| File | Changes |
|---|---|
| `App.jsx` | Strip all marketing imports, simplify routing to 5 views |
| `DesignTokens.css` | Complete rewrite with Ink & Paper palette |
| `components/common/Header.jsx` | Simplify to logo + 3 icon buttons |
| `components/progress/ProgressCard.jsx` | Restyle with new tokens |
| `index.html` | Update font imports (Geist + Inter) |

---

## Implementation Order

| Phase | What | Files |
|---|---|---|
| **1. Foundation** | DesignTokens.css rewrite + index.html font swap + new `app.css` | 3 files |
| **2. Header** | Rebuild Header.jsx (logo + vault + theme + support) | 1 file |
| **3. Workspace** | Build Workspace.jsx shell + ToolTabs + DropZone | 3 files |
| **4. Settings** | SettingsPanel.jsx (per-tool config, collapsible) | 1 file |
| **5. Pipeline** | ProcessButton + ProgressTracker + ResultCard | 3 files |
| **6. Vault** | NoteVault + NoteCard (history section) | 2 files |
| **7. App Shell** | Rewrite App.jsx routing, delete old files, wire everything | 1 file |
| **8. Footer** | New slim Footer.jsx | 1 file |
| **9. Polish** | Animations, dark mode testing, mobile responsive | CSS tweaks |

---

## User Review Required

> [!WARNING]
> **Breaking changes**: This plan deletes 20+ existing component files and 4 CSS files. The marketing sections (Scoreboard, Testimonials, HowItWorks, MetricsGrid, ProofViewer) are permanently removed. The separate tool pages (`/clean`, `/compress`, `/extract`, `/translate`) become tabs within the single workspace — old bookmarks to those hashes will need a redirect handler.

> [!IMPORTANT]
> **Red accent**: The accent color shifts from Indigo `#6366f1` to Red `#DC2626`. If you have a different accent preference, flag it now.

## Open Questions

1. **Geist font**: It's MIT-licensed but needs to be self-hosted (not on Google Fonts). Should I bundle it in `/public/fonts/` or use Inter for everything?
2. **Before/After sample images**: The current ProofViewer uses `/samples/doc_1_before.jpg` and `/samples/doc_1_after.jpg`. These will be removed from the home page. Should I keep them accessible somewhere (e.g., FAQ page) or remove entirely?

## Verification Plan

### Automated
- `npm run build` — zero errors, zero warnings
- Lighthouse audit via DevTools — target 90+ on Performance and Accessibility

### Manual
- Toggle dark/light theme — every surface, text, and border must change correctly
- Upload a real PDF → watch pipeline → download result
- Try all 4 tool tabs → verify config changes per tool
- Mobile viewport (375px) — everything stacks, no horizontal scroll
- Check Note Vault loads, filters by date, load more works
