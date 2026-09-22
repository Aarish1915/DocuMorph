---
timestamp_ist: "2026-09-22 00:05:59 IST"
timestamp_utc: "2026-09-21T18:35:59Z"
step_index: 10365
status: "OVERWRITTEN"
tool_action: "write_to_file"
overwritten_by: "Step 11052 on 2026-09-22 01:15:31 IST ('100,000 Concurrent User Production Architecture & Zero-Trust Hardening Plan')"
title: "Full Plan: Repository Audit, Defensive Cyber Resilience & 100k-User Stress Testing Suite"
description: "Implementation plan for repository audit, defensive cyber resilience, and 100k-user stress testing"
---

> **Plan Status: `OVERWRITTEN`**  
> **Timestamp:** Tuesday, September 22, 2026 at 12:05:59 AM IST (2026-09-21T18:35:59Z)  
> **Transcript Step:** `10365`  
> **Lifecycle Note:** This plan was later replaced/overwritten by Step 11052 on 2026-09-22 01:15:31 IST ('100,000 Concurrent User Production Architecture & Zero-Trust Hardening Plan')

---

# Full Plan: Repository Audit, Defensive Cyber Resilience & 100k-User Stress Testing Suite

This plan establishes a comprehensive audit of unpushed critical assets versus unnecessary files, followed by an end-to-end defensive cyber resilience and high-burst stress test across all DocuMorph frontend pages, backend endpoints, and queue systems.

---

## User Review Required

> [!IMPORTANT]
> **Critical Files Audit in `.gitignore`**:
> Currently, `.gitignore` excludes:
> - `CODEBASE_MASTER_GUIDE/` (All 10 in-depth architectural guides)
> - `ARCHITECTURE.md` (System architecture blueprint)
> - `tests/` (The entire automated test suite: unit, integration, load)
>
> In `README.md`, lines 240–252 link directly to `CODEBASE_MASTER_GUIDE/01_HIGH_LEVEL_SYSTEM_ARCHITECTURE.md`, etc. On GitHub, these produce **HTTP 404 broken links**.
>
> **Proposed Fix**: Un-ignore `tests/`, `CODEBASE_MASTER_GUIDE/`, and `ARCHITECTURE.md` in `.gitignore`, stage them, and commit them so the GitHub repository is complete for reviewers and CI/CD.
> Keep `.env`, `*.db`, `data/`, `cloudflared.exe`, `node_modules/`, and `.agents/` strictly ignored.

---

## Proposed Testing Architecture & Cyber Attack Vectors

We will construct a multi-threaded automated test harness (`tests/security_and_stress_runner.py`) that evaluates all 7 attack vectors and simulates 100k-user burst traffic against the local application:

```
┌────────────────────────────────────────────────────────────────────────────┐
│              DOCUMORPH MULTI-VECTOR CYBER RESILIENCE SUITE                 │
├──────────────────────┬─────────────────────────────────────────────────────┤
│ Vector 1: Bomb Shield│ 100,000pt MediaBox PDF Decompression Pixel Bomb     │
│ Vector 2: Stream Cap │ 50MB+ Chunked Upload Stream Overflow (HTTP 413)     │
│ Vector 3: Burst Load │ 100k-User Traffic Simulation (500 req/min burst)    │
│ Vector 4: XSS Defense│ Stored & Reflected Mutation XSS Payload Injection   │
│ Vector 5: Race Lock  │ Concurrent Duplicate UPI UTR Submission Collision   │
│ Vector 6: Auth Wall  │ Admin Route JWT Forgery & Unauthenticated BOLA IDOR │
│ Vector 7: Traversal  │ Directory Traversal & Path Injection (%2e%2e%2f)    │
│ Vector 8: UI Matrix  │ All 9 Pages, 4 Modals, Responsive Layout Bounds     │
└──────────────────────┴─────────────────────────────────────────────────────┘
```

---

## Proposed Changes

### Repository & Git Hygiene

#### [MODIFY] [`.gitignore`](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/.gitignore)
- Remove `tests/`, `CODEBASE_MASTER_GUIDE/`, and `ARCHITECTURE.md` from `.gitignore`.
- Ensure `.env`, `*.db`, `cloudflared.exe`, and local cache files remain strictly protected.

---

### Defensive Cyber Resilience & Load Test Suite

#### [NEW] [`tests/security_and_stress_runner.py`](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/tests/security_and_stress_runner.py)
A self-contained, multi-threaded stress and penetration runner testing:
1. **Pixel Bomb Defense**:
   - Constructs a synthetic 15KB PDF with `/MediaBox [0 0 100000 100000]`.
   - Submits to `/api/process`.
   - Asserts immediate `HTTP 400 Bad Request` with zero worker memory spike.
2. **50MB Memory Ceiling Defense**:
   - Streams an uncompressed binary payload exceeding 52MB.
   - Asserts immediate `HTTP 413 Payload Too Large` disconnection within the first 1MB of overflow.
3. **High-Burst Concurrency & Rate Limiting (100k User Simulation)**:
   - Spawns 50 concurrent worker threads executing 500 requests across `/api/health`, `/api/donations/stats`, `/api/reviews`, and `/api/process`.
   - Tests both valid and spoofed `CF-Connecting-IP` and `X-Forwarded-For` headers.
   - Asserts `HTTP 429 Too Many Requests` accurately triggers after 15 requests/min per IP, while non-abusive clients receive `HTTP 200`.
4. **Mutation XSS & Fuzz Injection**:
   - Injects `<script>alert('xss')</script>`, `<img src=x onerror=alert(1)>`, and SQL injection syntax (`' OR '1'='1`) into `/api/reviews` and `/api/donations/submit-utr`.
   - Verifies stored records in database are strictly escaped via `html.escape()`.
5. **Concurrent UTR Collision & ACID Race Condition**:
   - Launches 20 simultaneous threads attempting to claim the same 12-digit UTR `998877665544`.
   - Asserts exactly 1 thread receives `HTTP 200` and the remaining 19 receive `HTTP 400 UTR already recorded`.
6. **Administrative Route JWT Security**:
   - Fires unauthenticated and tampered JWT requests to `/api/internal/admin/jobs`, `/api/admin/status`, `/api/settings`, and `/api/internal/admin/telemetry`.
   - Asserts constant-time `HTTP 401 Unauthorized` without data leakage.
7. **Directory Traversal Defense**:
   - Injects path traversal sequences (`../../etc/passwd`, `..\..\windows\win.ini`, `%2e%2e%2f`) into `/api/progress/{job_id}`, `/api/download/{job_id}`, and `/api/reprocess/{job_id}`.
   - Asserts safe validation failure without filesystem exposure.

---

### Frontend Production & Interaction Verification

#### [VERIFY] Frontend Pages, Modals & Button Affordances
- Run automated frontend build verification: `npm run build` (assert 0 errors).
- Audit all pages (`Home`, `Clean`, `Compress`, `Extract`, `Translate`, `Backers`, `Privacy`, `Terms`, `FAQ`, `Admin`).
- Verify idle execution buttons (`.tool-execute-btn-idle`) trigger file pickers on all 4 tool pages.
- Verify modal lifecycles (`WriteReviewModal`, `SubmitUtrModal`, `DonationModal`, `SettingsModal`).

---

## Verification Plan

### Automated Tests
1. **Cyber & Stress Suite**:
   ```powershell
   python tests/security_and_stress_runner.py
   ```
   - Target: 7/7 attack vectors neutralized, 0 server crashes, 0 memory leaks.

2. **Existing Unit & Integration Tests**:
   ```powershell
   python -m pytest tests/unit tests/integration -v
   ```
   - Target: 100% passing tests.

3. **Frontend Production Build**:
   ```powershell
   cd frontend; npm run build
   ```
   - Target: Clean compilation in < 600ms, 0 errors, 0 warnings.

### Manual / Live Telemetry Verification
- Check FastAPI logs and memory RSS under stress to confirm RAM stays bounded below 1.5GB during 500 RPM burst.
- Verify that Wall of Fame and Student Reviews show verified clean entries with zero unescaped tags.
