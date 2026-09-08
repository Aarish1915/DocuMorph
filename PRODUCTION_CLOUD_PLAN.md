# DocuMorph - Production-Grade Cloud Architecture & Deployment Plan

A blueprint for scaling DocuMorph from local workstation development to a production-grade, highly available cloud system serving thousands of concurrent mobile and desktop users.

---

## 1. System Topology Overview

```
 [ Mobile / Web Users ]
          │
          ▼
 [ Vercel Global Edge CDN ]  ──► (React 19 + Vite + Anime.js + KaTeX)
          │
          │ HTTPS (REST + SSE)
          ▼
 [ Cloudflare WAF / API Gateway ] (DDoS protection, Rate Limiting, SSL Termination)
          │
          ▼
 [ FastAPI Compute Nodes ] (AWS App Runner / Railway / Render / Fly.io)
          │
          ├─────────────────────────┬─────────────────────────┐
          ▼                         ▼                         ▼
 [ Cloudflare R2 / AWS S3 ]   [ Neon / Supabase DB ]    [ Upstash / Redis Queue ]
 (Presigned PDF Storage)      (PostgreSQL + Pooling)    (Job Broker & Pub/Sub)
          │                         ▲                         │
          │                         │                         ▼
          └─────────────────────────┴─────────────► [ Python Worker Fleet ]
                                                    (Celery / ARQ Workers + GenAI)
```

---

## 2. Component-by-Component Production Breakdown

### A. Frontend Layer (Client & Edge)
- **Host**: **Vercel** (or Cloudflare Pages).
- **Configuration**:
  - `vercel.json` configured at root and in `frontend/`.
  - Environment Variable: `VITE_API_URL` pointing to the public backend domain (e.g. `https://api.documorph.com`).
- **Edge Security Headers**:
  - `X-Frame-Options: DENY` (Clickjacking prevention).
  - `X-Content-Type-Options: nosniff` (MIME sniffing prevention).
  - `Referrer-Policy: strict-origin-when-cross-origin`.
- **Static Asset Optimization**:
  - Vector KaTeX fonts and Google Fonts (`Inter`, `Noto Sans Devanagari`) cached with `Cache-Control: public, max-age=31536000, immutable`.

---

### B. Backend Layer (API Gateway)
- **Host**: **AWS App Runner**, **Railway**, or **Render**.
- **Server Engine**: `uvicorn` with `gunicorn` process supervisor (`-w 4 -k uvicorn.workers.UvicornWorker`).
- **Zero Heavy I/O on Gateway**:
  - The API Gateway does **not** process PDFs in-process.
  - Generates an S3/R2 presigned upload URL $\rightarrow$ client uploads directly to storage $\rightarrow$ Gateway creates a database record with `status: "QUEUED"`.
  - Push job ID into Redis queue $\rightarrow$ returns `{ "job_id": "...", "status": "QUEUED" }` in $< 120\text{ms}$.
- **Rate Limiting**: Redis-backed token bucket (15 req/min per IP, burst up to 25).

---

### C. Database Layer (State & Telemetry)
- **Engine**: **Serverless PostgreSQL** (Neon.tech or Supabase).
- **Connection Management**: Transaction connection pooling via **PgBouncer** (max 10,000 pooled connections).
- **Schema Evolution (Migrating from SQLite to Postgres)**:
  ```sql
  CREATE TABLE jobs (
      id VARCHAR(32) PRIMARY KEY,
      file_hash VARCHAR(64) NOT NULL,
      storage_input_key VARCHAR(255) NOT NULL,
      storage_output_key VARCHAR(255),
      service_type VARCHAR(32) NOT NULL DEFAULT 'clean_format',
      status VARCHAR(32) NOT NULL DEFAULT 'QUEUED',
      config_options JSONB NOT NULL DEFAULT '{}'::jsonb,
      language_mode VARCHAR(64) DEFAULT 'auto',
      original_file_size BIGINT NOT NULL,
      compressed_file_size BIGINT DEFAULT 0,
      progress_pct INT DEFAULT 0,
      progress_msg VARCHAR(255) DEFAULT 'Waiting in queue...',
      error_msg TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE INDEX idx_jobs_hash_service ON jobs(file_hash, service_type, status);
  CREATE INDEX idx_jobs_status_created ON jobs(status, created_at);
  ```
- **ACID Transactions**:
  - Use row-level locking (`SELECT ... FOR UPDATE SKIP LOCKED`) when workers pop jobs from the queue to prevent double-processing.

---

### D. Object Storage Layer (S3 / Cloudflare R2)
- **Storage Provider**: **Cloudflare R2** (Zero egress fees, full S3 API compatibility).
- **Buckets**:
  - `documorph-raw-uploads/` (Auto-lifecycle delete after 24 hours).
  - `documorph-processed-outputs/` (Auto-lifecycle delete after 48 hours for privacy).
- **Security & Privacy**:
  - Public access blocked completely.
  - Access granted solely via **Presigned URLs** with 15-minute expiration:
    - Client requests upload $\rightarrow$ Backend generates `PUT` presigned URL $\rightarrow$ Client uploads directly.
    - Worker completes compilation $\rightarrow$ Uploads result to R2 $\rightarrow$ Backend generates `GET` presigned download URL.

---

### E. Worker Fleet & Asynchronous Queue
- **Broker**: **Upstash Redis** or AWS ElastiCache.
- **Worker Framework**: `Celery` or `ARQ` (asyncio-native Python queue).
- **Worker Pod Autoscaling (HPA)**:
  - Scale from 1 to 10 worker pods based on queue length:
    - If `queue_depth > 5`: spawn +2 workers.
    - If `queue_depth == 0` for 10 minutes: scale down to baseline.
- **Circuit Breakers & Key Rotation**:
  - Centralized key rotation manager distributing Gemini API calls across pooled enterprise keys with automatic exponential backoff on HTTP 429.

---

## 3. Deployment Steps for Vercel (Immediate Setup)

### Step 1: Connect GitHub to Vercel
1. Open [Vercel Dashboard](https://vercel.com/new).
2. Click **Import Repository** and select `Aarish1915/DocuMorph`.
3. Select your branch: `feat/batch-vision` (or `main`).

### Step 2: Configure Project Settings in Vercel
- **Framework Preset**: `Vite`
- **Root Directory**: Select `frontend` (or leave as `./` — our root [`vercel.json`](file:///c:/Users/Aarish%20ali/pdfs/DocuMorph/vercel.json) handles both automatically!)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### Step 3: Configure Environment Variables
In the Vercel project settings under **Environment Variables**, add:
```
VITE_API_URL = https://your-backend-api-url.com
```
*(For testing before cloud backend deployment, use a free Cloudflare Tunnel URL: `cloudflared tunnel --url http://localhost:8000`)*.

### Step 4: Click Deploy
Vercel will build and assign an instant public URL (e.g., `https://documorph.vercel.app`), accessible on any smartphone, iPad, or laptop worldwide.
