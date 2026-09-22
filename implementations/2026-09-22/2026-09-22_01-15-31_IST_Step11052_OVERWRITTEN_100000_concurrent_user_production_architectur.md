---
timestamp_ist: "2026-09-22 01:15:31 IST"
timestamp_utc: "2026-09-21T19:45:31Z"
step_index: 11052
status: "OVERWRITTEN"
tool_action: "write_to_file"
overwritten_by: "Step 11216 on 2026-09-22 09:44:08 IST ('DocuMorph Production Overhaul: Stitch UI/UX Redesign, Real-Time Admin, Date-Grouped History, Sub-30s Pipeline & DB Pool Resilience')"
title: "100,000 Concurrent User Production Architecture & Zero-Trust Hardening Plan"
description: "Comprehensive 100k-user production architecture, zero-trust security hardening, presigned upload, and distributed queue plan"
---

> **Plan Status: `OVERWRITTEN`**  
> **Timestamp:** Tuesday, September 22, 2026 at 01:15:31 AM IST (2026-09-21T19:45:31Z)  
> **Transcript Step:** `11052`  
> **Lifecycle Note:** This plan was later replaced/overwritten by Step 11216 on 2026-09-22 09:44:08 IST ('DocuMorph Production Overhaul: Stitch UI/UX Redesign, Real-Time Admin, Date-Grouped History, Sub-30s Pipeline & DB Pool Resilience')

---

# 100,000 Concurrent User Production Architecture & Zero-Trust Hardening Plan

This plan establishes the complete High-Level Design (HLD), Low-Level Design (LLD), Zero-Trust Security Architecture, and Cloud Infrastructure roadmap to scale DocuMorph to handle 100,000 active concurrent students and educational institutions with high availability, zero server memory buffering crashes, and near-zero security vulnerability exposure.

---

## Architecture Audit: Current vs. 100k Production Reality

| Architecture Dimension | Current State (Single Container) | 100k Production Bottleneck | Production 100k Architecture |
| :--- | :--- | :--- | :--- |
| **File Ingestion** | Upload streamed through FastAPI HTTP body into local disk/RAM | 1,000 concurrent 30MB uploads buffer **30GB RAM**, instantly triggering kernel OOM killer (`Exit 137`) | **Direct-to-S3/R2 Presigned Uploads**: Browser streams directly to Cloudflare R2 via presigned PUT URL. API gateway touches only <2KB JSON metadata. |
| **Rate Limiting** | In-process Python `defaultdict` token bucket in `main.py` | Memory is isolated per worker/container. Multi-replica scaling allows attackers 10x-100x quota abuse | **Edge Cloudflare WAF + Redis Token Bucket**: Distributed sliding-window atomic Lua script shared across all gateway replicas. |
| **Job Queueing** | Polling SQLite database table `jobs.db` via `asyncio.sleep(1)` | SQLite allows **1 single writer**. 100k concurrent status updates cause `OperationalError: database is locked` | **Distributed Redis FIFO Queue (Arq/Celery)** + **PostgreSQL with PgBouncer** using `SELECT ... FOR UPDATE SKIP LOCKED`. |
| **Compute Execution** | Python thread pool running inside the API container | CPU-heavy MuPDF/Gemini/Playwright processing starves web server CPU, causing 504 Gateway Timeouts | **Decoupled Autoscaling Worker Fleet** (AWS ECS Fargate Spot / KEDA containers) scaling from 2 to 20 nodes based on queue depth. |
| **File Storage** | Local filesystem `data/` directory | Ephemeral containers wipe disk on restart; local disk fills to 100% capacity | **Cloudflare R2 Object Storage** (Zero egress fees) with 30-minute automated lifecycle shredding. |
| **Database** | SQLite WAL mode (`data/documorph_queue.db`) | Single-file locking prevents horizontal scaling; cannot be accessed across distributed containers | **Neon Serverless PostgreSQL** with connection pooling (PgBouncer port 6543) and auto-suspend when idle. |

---

## User Review Required

> [!IMPORTANT]
> **Zero-Egress Direct Upload Architecture**: To prevent server crashes during viral student traffic bursts, the client browser must upload large PDFs directly to Cloudflare R2 using presigned URLs. The backend will never buffer binary PDF files in web server RAM.
>
> **Dual-Mode Compatibility**: The implementation will support **both local development** (zero-config local SQLite + local disk storage) and **cloud production** (PostgreSQL + Cloudflare R2 + Redis) driven automatically by environment variables (`R2_ACCOUNT_ID`, `DATABASE_URL`, `REDIS_URL`).

---

## High-Level Design (HLD): 100k Topology

```
                                      100,000 ACTIVE STUDENTS
                                                  │
                                   [Cloudflare Enterprise Edge]
                                   ├── WAF (SQLi / XSS / Bot Protection)
                                   ├── Edge Rate Limiting: 15 req/min on write routes
                                   └── Global CDN: Cache public reviews & leaderboards
                                                  │
                      ┌───────────────────────────┴───────────────────────────┐
                      ▼                                                       ▼
          [Direct Presigned S3/R2 Upload]                           [Stateless API Gateway Replicas]
          (Cloudflare R2 Storage)                                   (FastAPI on Render / App Runner)
          - Student browser uploads PDF directly                    - Receives metadata only (< 2KB)
          - Zero RAM buffering on backend                           - Issues presigned PUT/GET URLs
                      │                                                       │
                      │                                            [Upstash Redis Task Queue]
                      │                                            (Distributed FIFO Message Queue)
                      │                                                       │
                      └───────────────────────────┬───────────────────────────┘
                                                  ▼
                                    [Autoscaling Worker Fleet]
                                    (KEDA / ECS Fargate Spot Nodes)
                                    ├── Pulls job ID & R2 storage key
                                    ├── PyMuPDF Lightning Sweep
                                    ├── Gemini 3.5 Flash Vision Batching
                                    ├── Playwright / WeasyPrint PDF Typesetting
                                    ├── Memory Trim: malloc_trim(0) & gc.collect()
                                    └── Uploads Output PDF to R2
                                                  │
                                    [Neon Serverless PostgreSQL]
                                    (PgBouncer Connection Pooling)
                                    - ACID Row Locks (SKIP LOCKED)
                                    - Zero write contention
```

---

## Proposed Changes

### Phase 1: Direct-to-Storage Presigned Upload Subsystem

Eliminates upload buffering from the web server. When a user drops a file, the frontend requests a presigned PUT URL and streams the binary payload directly to Cloudflare R2 / S3.

#### [MODIFY] [documorph/core/storage.py](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/documorph/core/storage.py)
- Add `generate_presigned_upload_url(key, content_type, file_size, expires_in=900)` to `StorageBackend` and `CloudflareR2StorageBackend`.
- For `LocalStorageBackend`, implement an atomic direct-streaming local endpoint to preserve 100% offline development compatibility.

#### [MODIFY] [documorph/api/main.py](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/documorph/api/main.py)
- Add endpoint `POST /api/upload/presign`:
  - Input: `{ filename: str, file_size: int, content_type: str }`
  - Validates file size ceiling (<= 50MB) and extension (`.pdf`).
  - Generates secure random key `uploads/{uuid4}_{safe_filename}`.
  - Returns `{ upload_url: str, storage_key: str }`.
- Update `POST /api/process` to accept `{ storage_key: str, ... }` in addition to direct `UploadFile` (backward-compatible).

#### [MODIFY] [frontend/src/App.jsx](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/frontend/src/App.jsx)
- In `uploadWithProgress`, check if presigned upload is available:
  - Step 1: Request presigned URL from `/api/upload/presign`.
  - Step 2: Stream PDF directly to R2/S3 using `XMLHttpRequest.upload.onprogress` for accurate live bandwidth metering.
  - Step 3: Dispatch job metadata to `/api/process` with `{ storage_key }`.

---

### Phase 2: Distributed Redis Token Bucket Rate Limiting

Replaces the in-process Python `defaultdict` with a distributed sliding-window token bucket in Redis, preventing quota abuse across multiple container replicas.

#### [NEW] [documorph/core/rate_limiter.py](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/documorph/core/rate_limiter.py)
- Encapsulates rate limiting with an atomic Redis Lua script (token bucket algorithm).
- Evaluates `CF-Connecting-IP` -> `X-Forwarded-For[0]` -> socket IP.
- Gracefully falls back to local in-memory token bucket if `REDIS_URL` is not provided.

#### [MODIFY] [documorph/api/main.py](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/documorph/api/main.py)
- Replace inline `check_rate_limit` with the unified `DistributedRateLimiter` dependency.

---

### Phase 3: PostgreSQL ACID Concurrency & PgBouncer Optimization

Eliminates database write contention and connection exhaustion.

#### [MODIFY] [documorph/core/database.py](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/documorph/core/database.py)
- Configure PostgreSQL connection engine for PgBouncer compatibility (`pool_pre_ping=True`, `pool_recycle=300`, `max_overflow=20`).
- Implement row-level lock query `get_next_queued_job_atomic()`:
  - Under PostgreSQL: `SELECT ... FOR UPDATE SKIP LOCKED LIMIT 1`.
  - Under SQLite: Immediate status transition to `PROCESSING` within a WAL write transaction.
- Add compound indices for ultra-fast query execution:
  - `CREATE INDEX idx_jobs_status_created ON jobs(status, created_at);`
  - `CREATE INDEX idx_jobs_hash ON jobs(file_hash);`
  - `CREATE INDEX idx_donations_tier_created ON donation_records(tier, created_at);`

---

### Phase 4: Autoscaling Worker Separation & Ephemeral Shredder

Decouples compute-heavy PDF transformations from the web server.

#### [MODIFY] [documorph/worker/queue_worker.py](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/documorph/worker/queue_worker.py)
- Decouple worker into a standalone, independently scalable process (`python -m documorph.worker.queue_worker`).
- Add active memory reclamation after each processed document:
  ```python
  gc.collect()
  if hasattr(ctypes.CDLL("libc.so.6"), "malloc_trim"):
      ctypes.CDLL("libc.so.6").malloc_trim(0)
  ```
- Support distributed multi-worker concurrency without collisions via atomic job leasing.

#### [NEW] [documorph/worker/cleanup_daemon.py](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/documorph/worker/cleanup_daemon.py)
- Standalone background cron / daemon:
  - Enforces DPDP Act 2023 zero-retention compliance.
  - Automatically deletes storage artifacts older than 30 minutes from R2 and local temp folders.
  - Purges completed ephemeral job records older than 60 minutes from PostgreSQL/SQLite.

---

### Phase 5: Verification & Load Testing Protocol

#### [MODIFY] [tests/security_and_stress_runner.py](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/tests/security_and_stress_runner.py)
- Add Vector 8: Presigned upload URL generation, validation, and direct-to-storage stream verification.
- Add Vector 9: Distributed Redis token bucket concurrency test simulating 100 parallel bot requests across 5 distinct subnets.
- Add Vector 10: Ephemeral 30-minute storage lifecycle shredding verification.
- Scale stress simulation from 5,000 to 10,000 multi-threaded requests across 50 concurrent workers.

---

## Verification Plan

### Automated Tests
1. **Multi-Vector Cyber Resilience Suite**:
   ```bash
   python tests/security_and_stress_runner.py
   ```
   Asserts 100% pass across all 10 security vectors + 10k stress queries.
2. **Full Pytest Suite**:
   ```bash
   python -m pytest tests/unit tests/integration -v
   ```
   Asserts 100% pass across all 34 unit and integration test cases.
3. **Frontend Production Build**:
   ```bash
   cd frontend && npm run build
   ```
   Asserts 0 warnings, 0 errors, and bundle size <= 150KB gzip.

### Manual Verification
- Verify presigned upload flow in browser: drop a 30MB sample PDF, verify `XMLHttpRequest` live bandwidth meter, and confirm zero server RAM spike.
- Verify Redis rate limiting across multiple simulated worker IPs.
