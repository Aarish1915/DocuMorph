---
timestamp_ist: "2026-09-22 10:56:49 IST"
timestamp_utc: "2026-09-22T05:26:49Z"
step_index: 11711
status: "OVERWRITTEN"
tool_action: "write_to_file"
overwritten_by: "Step 11778 on 2026-09-22 11:09:52 IST ('DocuMorph → CleanNotes: Ground-Up UI Redesign (V2 — Final Approved)')"
title: "DocuMorph → CleanNotes: Ground-Up UI Redesign (V2)"
description: "V2 plan covering all gaps: before/after samples, per-tool result metrics, donation banner mobile strategy, backers page at 10K scale, reviews integration, and full component tree."
---

> **Plan Status: `OVERWRITTEN`**  
> **Timestamp:** Tuesday, September 22, 2026 at 10:56:49 AM IST (2026-09-22T05:26:49Z)  
> **Transcript Step:** `11711`  
> **Lifecycle Note:** This plan was later replaced/overwritten by Step 11778 on 2026-09-22 11:09:52 IST ('DocuMorph → CleanNotes: Ground-Up UI Redesign (V2 — Final Approved)')

---

# DocuMorph → CleanNotes: Ground-Up UI Redesign (V2)

## The Core Problem

The user uploads a messy PDF → wants it cleaned/compressed/extracted/translated → downloads the result. Everything else on the page is noise that competes with this task.

| What's broken | Why |
|---|---|
| 5+ marketing sections between user and their task | User scrolls past scoreboard, proof viewer, metrics, testimonials, footer links before seeing their own notes |
| 4 duplicate tool pages (same layout, different emoji) | Code bloat, inconsistent UX |
| Admin Console link in consumer header | Violates segregation |
| "Engine Active • < 25ms FastPath", "AI Transformation Cockpit" | Students don't care about DevOps jargon |
| Banner ticker on mobile takes ~36px of viewport | Useless on small screens, blocks content |
| Same indigo/cyan/emerald palette as every AI tool | Generic |

---

## 1. New Visual Identity — "Ink & Paper"

### Colors

| Token | Light | Dark | Purpose |
|---|---|---|---|
| `--bg-app` | `#FAFAF9` | `#0C0A09` | Page background |
| `--bg-surface` | `#FFFFFF` | `#1C1917` | Cards |
| `--bg-surface-2` | `#F5F5F4` | `#292524` | Nested panels |
| `--bg-hover` | `#E7E5E4` | `#44403C` | Hover |
| `--border` | `#D6D3D1` | `#44403C` | Borders |
| `--border-subtle` | `#E7E5E4` | `#292524` | Faint lines |
| `--text-1` | `#1C1917` | `#FAFAF9` | Primary |
| `--text-2` | `#57534E` | `#A8A29E` | Secondary |
| `--text-3` | `#A8A29E` | `#78716C` | Muted |
| `--accent` | `#DC2626` | `#EF4444` | CTA / active state |
| `--accent-soft` | `#FEF2F2` | `rgba(239,68,68,0.12)` | Accent bg |
| `--success` | `#16A34A` | `#22C55E` | Complete |
| `--warning` | `#D97706` | `#F59E0B` | Warnings |

### Typography

| Use | Font | Why |
|---|---|---|
| Headings | **Geist** (self-hosted, MIT) | Geometric, modern, tight |
| Body + UI | **Inter** (Google Fonts) | Industry standard UI font |
| Metrics / code | **Geist Mono** | Monospace for file sizes, %, IDs |

### Layout Constraints

- Max content width: **720px** (reading column)
- Card padding: 20px (desktop), 16px (mobile)
- Section gap: 48px
- Cards use **1px borders only** — no box-shadows except modals
- Radius: `8px` cards, `6px` buttons, `4px` inputs, `9999px` pills

---

## 2. What Each Tool Tab Shows

The home page has ONE workspace canvas with a **segmented control** tab switcher at the top. Each tab reveals tool-specific content in 3 states: **Upload**, **Processing**, **Result**.

### 2A. Tool Tab — Sub-Features (Upload State)

Each tab has a **brief 1-line descriptor** and a **collapsible settings panel** with its unique config:

| Tool | Tab Label | 1-Line Descriptor | Settings Panel |
|---|---|---|---|
| **Clean & Format** | `✨ Clean` | Whiten scans, remove stamps & beautify notes | Doc type (Auto/Handwritten/Printed), Images (keep/strip), Fix formulas toggle, Page range |
| **Compact PDF** | `📐 Compact` | Squeeze margins, compress images, save 50%+ pages | Quality (Fast/Balanced/Max), Image handling, Remove duplicates, Strip metadata |
| **Extract Text** | `📋 Extract` | Convert tables & text to editable Markdown | Output format (Markdown/Plain), Preserve structure, Clean watermarks, Fix spacing |
| **Translate** | `🌐 Translate` | Translate while preserving formulas & diagrams | From language (Auto-detect), To language (dropdown: Hindi, Tamil, Telugu, etc.), Protect math, Protect code |

**Settings default to collapsed.** Defaults are smart enough for 90% of use cases. A "⚙ Settings" link expands the panel.

### 2B. Processing State — What We Show

During processing, the workspace morphs into a progress tracker:

```
┌────────────────────────────────────────────────┐
│  📄 Chemistry_Unit5.pdf (4.2 MB)               │
│                                                │
│  ████████████████░░░░░░░░░  67%                │
│                                                │
│  Stage 3 of 5: AI Reading                      │
│  Extracting text from page 12 of 18            │
│                                                │
│  ⏱ 42s elapsed                                 │
│                                                │
│  ┌─── Pipeline ───────────────────────────┐    │
│  │ ✅ Reading  ✅ Layout  🔄 AI  ○ Format │    │
│  │ ○ Done                                 │    │
│  └────────────────────────────────────────┘    │
└────────────────────────────────────────────────┘
```

**Key rules:**
- File name is always visible at the top
- Single progress bar with % number
- Current stage label + descriptive message
- Elapsed timer (not ETA — ETA lies)
- 5-step horizontal pipeline dots at the bottom (filled/active/empty)
- No marketing noise during processing

### 2C. Result State — What We Show (Per Tool)

When done, show a **Result Card** with savings metrics specific to the tool:

#### Clean & Format — Result

| Metric | Example |
|---|---|
| Original → Clean | `4.2 MB → 2.1 MB` |
| Size saved | `−50%` (shown in green badge) |
| Pages processed | `18 pages` |
| Time taken | `67s` |
| Actions | **[ ⬇ Download PDF ]** **[ 📋 Copy Markdown ]** |
| Secondary | `[ 🔄 Re-process ]` `[ ✨ New Document ]` |

#### Compact PDF — Result

| Metric | Example |
|---|---|
| Original pages → Compact pages | `18 → 9 pages` |
| Page savings | `−50% fewer pages` (green badge) |
| File size | `4.2 MB → 1.8 MB (−57%)` |
| Actions | **[ ⬇ Download Compact PDF ]** |

#### Extract Text — Result

| Metric | Example |
|---|---|
| Extracted | `14 tables, 2,340 words` |
| Output format | `Markdown` |
| Actions | **[ 📋 Copy to Clipboard ]** **[ ⬇ Download .md ]** |
| Preview | Inline preview of extracted markdown (first 500 chars, expandable) |

#### Translate — Result

| Metric | Example |
|---|---|
| From → To | `English → Hindi` |
| Translated pages | `18 pages` |
| Formulas preserved | `✅ 23 equations intact` |
| Actions | **[ ⬇ Download Translated PDF ]** |

### 2D. Before/After Samples

> [!IMPORTANT]
> **Verdict: Keep sample images, but integrate them directly into the DropZone as "1-click demos" — NOT as a separate marketing section.**

How it works:
1. Below the drop zone area, show 3 ghost buttons: `[ Chemistry ] [ Physics ] [ Law Notes ]`
2. Clicking one auto-uploads the sample and runs the current tool on it
3. When the result comes back, the Result Card shows a **Before/After toggle**: two thumbnail images side by side with a slider or tab toggle (`Original | Cleaned`)
4. This replaces the old `InteractiveProofViewer` section entirely

**Sample images** (`/samples/doc_1_before.jpg`, `/samples/doc_1_after.jpg`, etc.) stay in `/public/samples/` but are only shown inside the Result Card after processing a sample.

---

## 3. Donation Banner — Redesigned

### Problem with current banner
- On desktop: 36px ticker bar across the top, shows donor name + amount + college + quote — works OK
- On mobile: Same bar, too much text crammed, eats viewport, unreadable
- "LIVE FUEL" badge is jargon

### New approach

| Platform | What to show | Where |
|---|---|---|
| **Desktop (≥768px)** | Slim inline bar below header, same ticker rotation | Below header, `height: 32px`, subtle `--bg-surface-2` background |
| **Mobile (<768px)** | **HIDE the ticker bar entirely.** Instead, show a small floating pill button: `☕ Support` fixed bottom-right | Floating action button, 44×44px, opens DonationModal on tap |

**Desktop banner redesign:**
```
┌────────────────────────────────────────────────────────┐
│ ☕ Rohan S. fueled 50 pages • Kota  │  [Support ₹20 →] │
└────────────────────────────────────────────────────────┘
```
- One line. No "LIVE FUEL" badge. No "Live pulse dot."
- Just: `☕ {name} fueled {amount} • {college}` + a CTA link
- Rotates every 5s with fade transition
- If the API returns no donors, hide the banner entirely (no fallback fake data)

---

## 4. Backers / Hall of Fame Page — Redesigned for Scale (10K+ Donors)

### Current problems
- All donors loaded at once — will crash at 10K
- No virtualization
- Hero section is a wall of text
- Tier filter pills + search + two tabs + load more — too many controls competing

### New design — clean, scalable

```
┌─────────────────────────────────────────────────────┐
│  ← Back                                    [☕ Fuel] │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Community Wall                                     │
│  Every chai counts. ₹{total} raised by              │
│  {donor_count} students this month.                 │
│                                                     │
│  ┌─── Fuel Gauge ──────────────────────────────┐   │
│  │ ████████████████████░░░░░  78%  (₹780/₹1000)│   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌── Cost Breakdown (3 items, compact) ────────┐   │
│  │ Server ₹480 • AI Engine ₹300 • CDN Free     │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  [ ☕ Fuel ₹20 via UPI ]  [ ✍ Already Paid? UTR ]  │
│                                                     │
├── Tabs ─────────────────────────────────────────────┤
│  [ 🏆 Top Patrons ]  [ ☕ Recent ]  [ ⭐ Reviews ]  │
│                                                     │
│  [🔍 Search by name or college...]                  │
│  [All ▾] tier filter dropdown (not pills)           │
│                                                     │
│  ┌────────────────────────────────────────────┐     │
│  │ 💎 IIT Delhi Mech Hostel    ₹500           │     │
│  │    "Saved ₹1,200 on printing"              │     │
│  │    Sep 18 • Verified ✓                      │     │
│  ├────────────────────────────────────────────┤     │
│  │ 🥇 Dr. Priya V.             ₹200           │     │
│  │    AIIMS Bhopal                             │     │
│  │    "Histology diagrams in pristine quality" │     │
│  ├────────────────────────────────────────────┤     │
│  │ ☕ Aman Verma                ₹20            │     │
│  │    SGSITS Indore                            │     │
│  │    "Keep this free!"                        │     │
│  └────────────────────────────────────────────┘     │
│                                                     │
│  [ Load More ↓ ]                                    │
└─────────────────────────────────────────────────────┘
```

### Scaling decisions for 10K+ donors

| Problem | Solution |
|---|---|
| Loading 10K donor cards kills performance | **Server-side pagination** (already exists: `?page=N&limit=12`). Never load more than 1 page at a time. |
| Search across 10K needs server-side | **Backend search endpoint**: `GET /api/donations/recent?q=rohan&page=1`. Debounce 300ms on input. |
| Tier filter pills take too much horizontal space at mobile | Replace pills with a **single dropdown** `<select>`: All / 💎 Diamond / 🥇 Gold / ☕ Chai |
| Summary stats need to reflect real scale | Show `₹{total_raised}` and `{donor_count} students` at the top. These are already available from `/api/donations/stats`. |
| Tab between leaderboard and recent feed | Keep 2 tabs, **add a 3rd tab: ⭐ Reviews** (move reviews into backers page instead of home) |

### Reviews → Moved Into Backers Page

Instead of a standalone `AspirantTestimonials` section on the home page (marketing clutter), reviews become a **3rd tab** on the Backers page:

```
[ 🏆 Top Patrons ]  [ ☕ Recent ]  [ ⭐ Reviews ]
```

The **Reviews tab** shows:
- Average rating badge: `⭐ 4.9 / 5 (47 verified reviews)`
- Exam filter dropdown (All / JEE / NEET / UPSC / College / GATE)
- Review cards: name, college, exam, star rating, review text, date
- "Write a Review" button opens the existing `WriteReviewModal`
- Paginated, same pattern as donations

This means:
- Home page has ZERO marketing sections — just the workspace
- Social proof (donations + reviews) lives in one dedicated page: **Community Wall**
- The page earns its own URL: `/#community` (rename from `/#backers`)

---

## 5. Architecture — What Goes Where

### Page Map (6 views, down from 10+)

```
/              → Home workspace (upload/process/result + note vault)
/#community    → Community Wall (donations + reviews, the old "backers")
/#faq          → FAQ
/#privacy      → Privacy
/#terms        → Terms
/admin         → Admin (separate render tree, never in consumer)
```

### Home Layout — The Single Workspace

```
┌── HEADER (48px, sticky) ──────────────────────────────┐
│  [CN logo]                    [🌙] [📂 Vault] [☕]    │
├── DONATION TICKER (32px, desktop only) ───────────────┤
│  ☕ Rohan S. fueled 50 pages • Kota    [Support ₹20 →]│
├── WORKSPACE ──────────────────────────────────────────┤
│                                                       │
│  [✨ Clean] [📐 Compact] [📋 Extract] [🌐 Translate]  │
│                                                       │
│  ┌── State: Upload ──────────────────────────────┐   │
│  │  📄 Drop your PDF here, or click to browse    │   │
│  │  [ Chemistry ] [ Physics ] [ Law Notes ]      │   │
│  └───────────────────────────────────────────────┘   │
│                                                       │
│  ⚙ Settings (collapsed by default)                    │
│  [ ▶ Process Document ]                               │
│                                                       │
│  ── or State: Processing ──                           │
│  ██████░░░░ 67% • AI Reading • 42s                    │
│                                                       │
│  ── or State: Result ──                               │
│  ✅ Chemistry_Unit5.pdf → Cleaned                     │
│  4.2 MB → 2.1 MB (−50%) • 18 pages • 67s             │
│  [⬇ Download] [📋 Copy] [🔄 Redo] [✨ New]           │
│                                                       │
├── NOTE VAULT (inline, scrollable) ────────────────────┤
│  🗄 Note Vault              [🔍 Search...] [Date ▾]   │
│  Today: [note] [note] [note]                          │
│  Yesterday: [note] [note]                             │
│  [Load More]                                          │
│                                                       │
├── FOOTER (1 line) ────────────────────────────────────┤
│  CleanNotes • Free & Private  [FAQ] [Privacy] [Terms] │
│  [🏆 Community Wall]                                  │
└───────────────────────────────────────────────────────┘
```

### Component Tree

```
App.jsx
├── Header.jsx             (logo + 3 icon buttons)
├── DonorTicker.jsx         (desktop-only inline bar, replaces HeaderBanner)
├── <main>
│   ├── Workspace.jsx       (single canvas: upload/process/result)
│   │   ├── ToolTabs.jsx
│   │   ├── DropZone.jsx        (drag/drop + sample buttons)
│   │   ├── SettingsPanel.jsx   (collapsible per-tool config)
│   │   ├── ProcessButton.jsx
│   │   ├── ProgressTracker.jsx
│   │   └── ResultCard.jsx      (per-tool metrics + before/after toggle)
│   │
│   ├── NoteVault.jsx       (history grid below workspace)
│   │   └── NoteCard.jsx
│   │
│   ├── CommunityWall.jsx   (donations + reviews, replaces BackersPage)
│   │   ├── FuelGauge.jsx       (progress bar + cost breakdown)
│   │   ├── DonorList.jsx       (paginated donor cards)
│   │   └── ReviewList.jsx      (paginated review cards)
│   │
│   ├── FAQPage.jsx         (keep, restyle)
│   ├── PrivacyPage.jsx     (keep, restyle)
│   └── TermsPage.jsx       (keep, restyle)
│
├── Footer.jsx              (slim 1-line)
├── MobileSupportFab.jsx    (☕ floating button, mobile only)
├── ToastContainer.jsx      (keep)
├── DonationModal.jsx       (keep, restyle)
├── SubmitUtrModal.jsx      (keep, restyle)
├── WriteReviewModal.jsx    (keep, restyle — now triggered from CommunityWall)
└── CookieConsent.jsx       (keep)
```

---

## 6. Files — Delete / Create / Modify

### DELETE (25 files)

| File | Reason |
|---|---|
| `components/home/AcademicScoreboard.jsx` | Marketing clutter |
| `components/home/MetricsStatGrid.jsx` | Marketing clutter |
| `components/home/HowItWorksThreePass.jsx` | Marketing clutter |
| `components/home/AspirantTestimonials.jsx` | Reviews moved to CommunityWall tab |
| `components/common/PopularToolsFooter.jsx` | Link dump |
| `components/common/InteractiveProofViewer.jsx` | Before/after now in ResultCard |
| `components/common/HeaderBanner.jsx` | Replaced by DonorTicker |
| `components/common/Sidebar.jsx` | History is now inline NoteVault |
| `components/hero/HeroSection.jsx` | No hero section |
| `components/pages/CleanFormatPage.jsx` | Merged into Workspace tabs |
| `components/pages/CompressPage.jsx` | Merged into Workspace tabs |
| `components/pages/ExtractTextPage.jsx` | Merged into Workspace tabs |
| `components/pages/TranslatePage.jsx` | Merged into Workspace tabs |
| `components/pages/ToolDirectory.jsx` | Not needed |
| `components/pages/BackersPage.jsx` | Replaced by CommunityWall |
| `components/workspace/CleanNotesStudio.jsx` | Replaced by Workspace |
| `components/workspace/HomeWorkspace.jsx` | Replaced |
| `components/workspace/WorkspaceScreen.jsx` | Replaced |
| `components/workspace/ServiceTabs.jsx` | Replaced by ToolTabs |
| `components/workspace/DocumentPresetPicker.jsx` | Merged into DropZone |
| `components/workspace/QuickSettingsToggles.jsx` | Merged into SettingsPanel |
| `styles/hero.css` | No hero |
| `styles/homeComponents.css` | No home marketing |
| `styles/toolPages.css` | No separate tool pages |
| `styles/workspace.css` | Rewritten from scratch |

### CREATE (12 files)

| File | What |
|---|---|
| `styles/app.css` | Single unified stylesheet |
| `components/workspace/Workspace.jsx` | Single canvas (3 states) |
| `components/workspace/ToolTabs.jsx` | Segmented control |
| `components/workspace/SettingsPanel.jsx` | Collapsible per-tool config |
| `components/workspace/ProcessButton.jsx` | CTA with loading state |
| `components/workspace/ProgressTracker.jsx` | Pipeline progress |
| `components/workspace/ResultCard.jsx` | Per-tool result with metrics + before/after |
| `components/vault/NoteVault.jsx` | History grid |
| `components/vault/NoteCard.jsx` | Individual history card |
| `components/community/CommunityWall.jsx` | Donations + Reviews page |
| `components/common/DonorTicker.jsx` | Desktop-only donation ticker |
| `components/common/MobileSupportFab.jsx` | Mobile ☕ floating button |
| `components/common/Footer.jsx` | Slim footer |

### MODIFY (5 files)

| File | Changes |
|---|---|
| `App.jsx` | Strip all marketing imports, simplify to 6 views |
| `DesignTokens.css` | Complete rewrite with Ink & Paper palette |
| `components/common/Header.jsx` | Simplify to logo + vault + theme + support |
| `components/progress/ProgressCard.jsx` | Restyle with new tokens |
| `index.html` | Update font imports |

---

## 7. Implementation Phases

| # | Phase | Files | ~LOC |
|---|---|---|---|
| 1 | **Foundation** — DesignTokens.css rewrite, font swap, new `app.css` shell | 3 | 400 |
| 2 | **Header** — Rebuild Header.jsx, add DonorTicker, MobileSupportFab | 3 | 250 |
| 3 | **Workspace shell** — Workspace.jsx + ToolTabs + DropZone (with samples) | 3 | 350 |
| 4 | **Settings** — SettingsPanel.jsx (4 tool configs, collapsible) | 1 | 200 |
| 5 | **Pipeline** — ProcessButton + ProgressTracker + ResultCard (per-tool metrics) | 3 | 400 |
| 6 | **Vault** — NoteVault + NoteCard | 2 | 250 |
| 7 | **Community** — CommunityWall (fuel gauge + donors + reviews tabs) | 1 | 350 |
| 8 | **App Shell** — Rewrite App.jsx routing, delete old files, wire everything | 1 | 200 |
| 9 | **Polish** — Footer, dark mode QA, mobile responsive, animations | 3 | 200 |

---

## 8. User Review Required

> [!WARNING]
> **25 component files + 4 CSS files deleted.** Irreversible. Marketing sections (Scoreboard, Testimonials, HowItWorks, Metrics, ProofViewer, HeaderBanner, Sidebar) are permanently gone from the home page.

> [!IMPORTANT]
> **Reviews moved into Community Wall page** — they're no longer on the home page at all. Social proof lives in `/#community`. If you want even a tiny "Trusted by X students" badge on the home page, flag it now.

> [!IMPORTANT]
> **`/#backers` → `/#community`** — URL rename. Old bookmarks break unless we add a redirect.

## Open Questions

1. **Accent color Red `#DC2626`** — confirmed or different preference?
2. **Geist font** — self-host in `/public/fonts/` or use Inter everywhere (simpler)?
3. **Sample PDFs** — Are the current 3 samples (Chemistry, Physics, Law) sufficient, or do you want to add more categories?
4. **Mobile ☕ FAB** — should it be permanently visible or only appear after the user scrolls past the workspace?

## Verification Plan

### Automated
- `npm run build` — zero errors
- Lighthouse: target 90+ Performance, 90+ Accessibility

### Manual
- Toggle dark/light — every token must change
- Upload real PDF → pipeline → download → verify
- All 4 tool tabs → correct config per tab
- Mobile (375px) — no horizontal scroll, FAB visible
- Community Wall: search, filter, load more at scale
- Donation flow: banner CTA → modal → UTR → appears on wall
