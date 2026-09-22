---
timestamp_ist: "2026-09-22 11:09:52 IST"
timestamp_utc: "2026-09-22T05:39:52Z"
step_index: 11778
status: "USER_APPROVED_SUPERSEDED_BY_CONVERSION_PLAN"
tool_action: "replace_file_content"
overwritten_by: "Step 12041 on 2026-09-22 11:41:01 IST ('Comprehensive UI/UX Overhaul & 100k-User Conversion Restoration')"
title: "DocuMorph → CleanNotes: Ground-Up UI Redesign (V2 — Final Approved)"
description: "Update implementation plan with user comments (remove NoteVault, top donors banner only, donor geo-location flex & taglines, community wall reviews tab)"
---

> **Plan Status: `USER_APPROVED_SUPERSEDED_BY_CONVERSION_PLAN`**  
> **Timestamp:** Tuesday, September 22, 2026 at 11:09:52 AM IST (2026-09-22T05:39:52Z)  
> **Transcript Step:** `11778`  
> **Lifecycle Note:** This plan was later replaced/overwritten by Step 12041 on 2026-09-22 11:41:01 IST ('Comprehensive UI/UX Overhaul & 100k-User Conversion Restoration')

---

# DocuMorph → CleanNotes: Ground-Up UI Redesign (V2 — Final Approved)

## The Core Problem & Philosophy

The user uploads a messy PDF → wants it cleaned/compressed/extracted/translated → downloads the result. Everything else on the page is noise that competes with this task.

### Key Decisions Incorporated From User Feedback
1. **Note Vault is Admin-Only**: Removed completely from the consumer interface. The user emphasized: main application is for students to clean and transform documents; job history management is strictly segregated in the admin panel (`/#admin`).
2. **Donation Ticker**: Desktop ticker displays **top weekly/monthly donors only** (from leaderboard), avoiding random unverified noise. Hidden entirely on mobile screens (<768px).
3. **Donor Geo-Location & Social Flex**: Donors can flex their city/state with a 1-tap geo-location button (`📍 Flex My City/State`) without entering tedious address forms. Donor cards highlight their name, amount, 📍 city/state, tier badge, and custom tagline/shoutout.
4. **Appreciation & Social Proof on Result Card**: When document processing completes, a micro-appreciation strip appears displaying real donor inspiration, highlighting how community fuel keeps CleanNotes free, inviting a ₹20 chai contribution.
5. **Community Wall (`/#community`)**: Scalable up to 10K+ donors with server-side pagination, search, tier filters, fuel gauge, and an integrated **Reviews Tab** (moving reviews out of the home page into the community hub).
6. **Ink & Paper Design System**: Editorial Stone neutrals (`#FAFAF9` / `#0C0A09`), sharp 1px borders, and Crimson Red CTA (`#DC2626` / `#EF4444`).

---

## 1. New Visual Identity — "Ink & Paper"

### Colors

| Token | Light | Dark | Purpose |
|---|---|---|---|
| `--bg-app` | `#FAFAF9` | `#0C0A09` | Page background |
| `--bg-surface` | `#FFFFFF` | `#1C1917` | Cards & containers |
| `--bg-surface-2` | `#F5F5F4` | `#292524` | Nested panels & hover chips |
| `--bg-hover` | `#E7E5E4` | `#44403C` | Hover states |
| `--border` | `#D6D3D1` | `#44403C` | Default 1px borders |
| `--border-subtle` | `#E7E5E4` | `#292524` | Faint dividers |
| `--text-1` | `#1C1917` | `#FAFAF9` | Primary headings & body |
| `--text-2` | `#57534E` | `#A8A29E` | Secondary descriptions |
| `--text-3` | `#A8A29E` | `#78716C` | Muted timestamps & hints |
| `--accent` | `#DC2626` | `#EF4444` | Crimson Red CTA & active tab |
| `--accent-soft` | `#FEF2F2` | `rgba(239,68,68,0.12)` | Subtle accent backgrounds |
| `--success` | `#16A34A` | `#22C55E` | Savings & complete badges |
| `--warning` | `#D97706` | `#F59E0B` | Chai & alert highlights |

### Typography & Layout Constraints

- **Headings & Body**: Plus Jakarta Sans / Inter (`system-ui` fallback)
- **Monospace & Numbers**: JetBrains Mono for percentages, sizes, timers, UTRs
- **Max Content Width**: `760px` (reading & focus column)
- **Radius**: `8px` cards, `6px` buttons, `4px` inputs, `9999px` pills
- **Shadows**: Clean 1px borders by default; subtle soft elevation only on modals

---

## 2. Workspace Engine (4 Tools, 3 States)

### 2A. Segmented Control & 4 Tools
1. `✨ Clean & Format`: Whiten scans, remove stains & stamps, sharpen handwriting.
2. `📐 Compact PDF`: Shrink margins, compress images, save 50%+ pages for printing.
3. `📋 Extract Text`: Convert diagrams, tables, and handwritten notes to Markdown.
4. `🌐 Translate`: Translate Hindi/English while protecting LaTeX equations and code.

### 2B. Three Discrete States
- **State 1: Upload**: Clean dropzone + 3 instant sample buttons (`[ Chemistry ] [ Physics ] [ Law Notes ]`) + collapsible tool settings + big `▶ Process Document` CTA.
- **State 2: Processing**: 5-step animated pipeline dots (`Reading → Layout → AI OCR → Format → Done`), live %, elapsed timer, animated status messages.
- **State 3: Result**:
  - Per-tool savings metrics (Original vs Clean MB, % saved, page count).
  - Primary action: `[ ⬇ Download File ]` + `[ 📋 Copy Markdown ]`.
  - Sample comparison toggle (Original vs Cleaned) if sample was run.
  - **Inspiration & Appreciation Strip**: "Saved ₹1,200 on printing? Keep CleanNotes free for the next student" with top donor quotes & quick fuel button.

---

## 3. Top Donors Banner & Mobile FAB

- **Desktop (≥768px)**: Slim 32px bar below header. Displays only **top weekly/monthly donors** (from `/api/donations/leaderboard`):
  `☕ Rohan S. (Kota) fueled ₹50 • "Saved ₹1,200 on printing"  [Support ₹20 →]`
  Cycles every 5 seconds. If empty, hidden cleanly.
- **Mobile (<768px)**: Ticker is hidden to preserve screen real estate. Instead, a sleek bottom-right floating button `☕ Support` is shown.

---

## 4. Community Wall (`/#community`) & Gen-Z Geo Flex

### 4A. Community Wall Features
- **Fuel Gauge**: ₹{total} raised of ₹1,000 monthly server goal with real-time progress bar.
- **Cost Transparency**: Server hosting, Vision AI API, CDN breakdown.
- **3 Tab Views**:
  1. `[ 👑 Top Patrons ]`: Leaderboard of Diamond (₹500+) and Gold (₹100+) donors.
  2. `[ ☕ Recent Donors ]`: Searchable, paginated list of all contributions with tier filter dropdown (`All`, `Chai`, `Gold`, `Diamond`).
  3. `[ ⭐ Student Reviews ]`: Verified exam reviews with star ratings, exam filters (JEE, NEET, UPSC), and "Write Review" modal.

### 4B. Gen-Z Geo Flex & Taglines
- When fueling or submitting UTR:
  - 1-click `[ 📍 Auto-detect My City/State ]` button uses lightweight browser geolocation / IP fallback to populate "Kota, Rajasthan" or "Delhi, IN" without annoying address forms.
  - Custom Tagline / Shoutout field ("Tagline / Flex on the Wall"): lets students flex to neighbours ("AIR 1 Loading 🚀", "Saved ₹1,200 printing in Mukherjee Nagar").
- Donor cards prominently display avatar badge, verified checkmark, amount, 📍 city/state, and their custom tagline.

---

## 5. Architectural Cleanliness & Segregation

- **Admin Panel**: Strictly accessible via `/#admin` or `/admin`. Never rendered or referenced in the consumer app. Note Vault is completely removed from the consumer app.
- **Views**:
  - `/` (Home workspace: upload, process, result)
  - `/#community` (Community Wall: donors, fuel gauge, reviews)
  - `/#faq` (FAQ knowledge base)
  - `/#privacy` (Privacy Policy)
  - `/#terms` (Terms of Service)
  - `/#admin` (Standalone Admin Dashboard Modal)

---

## 6. Verification Plan

1. Run `npm run build` in `frontend/` — ensure 0 warnings, 0 syntax errors.
2. Test local dev server (`http://localhost:5173`).
3. Verify all 4 tools switch smoothly and persist correct configurations.
4. Verify sample file upload & mock processing states.
5. Verify dark/light mode toggle with CSS tokens.
6. Verify Community Wall tabs, search, pagination, and UTR submission with geo-flex.
7. Verify mobile responsiveness down to 320px.
