# DocuMorph — Enterprise Admin Hub Deployment & Security Manual
**Last Updated:** 2026-09-21T23:13:00+05:30 | **Status:** Phase 35 Security Specification

This manual governs the isolated deployment, cryptographic access control, and operational monitoring of the DocuMorph Admin Dashboard.

---

## 1. Dual Deployment Architecture

To ensure 100% security segregation between public student users and administrative controls, DocuMorph supports **Dual Deployment Isolation**:

```
                              [ Public Domain: documorph.in ]
                                      │
                                      ▼
                        [ Vercel Deployment 1: Student App ]
                         • VITE_ADMIN_ONLY=false
                         • Serves 4 Tools: Clean, Compress, Extract, Translate
                         • Zero Admin routes or state exposed in DOM
                                      │
                                      │ (REST / SSE)
                                      ▼
                        [ Backend Gateway: api.documorph.in ]
                         • /api/process, /api/progress, /api/feedback
                         • /api/internal/admin/* (Bcrypt + JWT Guarded)
                                      ▲
                                      │ (Authenticated JWT Requests Only)
                                      │
                        [ Vercel Deployment 2: Admin Hub ]
                         • VITE_ADMIN_ONLY=true
                         • Mounted on private subdomain (e.g. admin.documorph.in)
                         • Restricted to authenticated operators
```

---

## 2. Setting Up the Isolated Admin Deployment on Vercel

### Step 1: Create a New Vercel Project
1. Log into your Vercel Dashboard (`vercel.com`).
2. Click **Add New Project** and select the same Git repository (`documorph`).
3. Set the Project Name to `documorph-admin`.
4. Set the Root Directory to `frontend`.

### Step 2: Configure Environment Variables
In the `documorph-admin` project settings, add the following environment variables:

| Variable Name | Production Value | Purpose |
| :--- | :--- | :--- |
| `VITE_ADMIN_ONLY` | `true` | Forces the React application to render only the Admin Hub |
| `VITE_API_URL` | `https://api.documorph.in` | Points to your active backend API gateway |
| `VITE_ADMIN_INACTIVITY_TIMEOUT` | `900000` | 15 minutes (in milliseconds) before automatic session lock |

### Step 3: Deploy & Assign Domain
1. Deploy the project.
2. In **Project Settings -> Domains**, assign your private administrative domain:
   - `admin.documorph.in` or a password-protected staging URL.
3. Enable Vercel Password Protection or Cloudflare Zero Trust Access for additional perimeter defense.

---

## 3. Cryptographic Authentication & Role-Based Access Control

### Master Admin Password Hashing
The backend validates operator credentials using constant-time bcrypt hashing:

```python
# documorph/core/auth.py
import bcrypt
import jwt
from datetime import datetime, timedelta

ADMIN_PASSWORD_HASH = os.getenv("ADMIN_PASSWORD_HASH") # Stored as bcrypt hash
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = "HS256"

def verify_admin_password(plain_password: str) -> bool:
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        ADMIN_PASSWORD_HASH.encode("utf-8")
    )

def create_admin_jwt(operator_id: str) -> str:
    payload = {
        "sub": operator_id,
        "role": "superadmin",
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(hours=8)
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
```

### Rate Limiting & Brute-Force Lockout
- Administrative login attempts are rate limited to **5 attempts per 60 seconds per IP**.
- Exceeding 5 failed attempts triggers a mandatory 15-minute IP ban on `/api/internal/admin/login`.

---

## 4. Operational Telemetry & Administrative Controls

The Admin Hub provides real-time access to the following operational controls:

1. **Live Queue Inspector**:
   - View active jobs (`QUEUED`, `PROCESSING`, `COMPLETED`, `FAILED`).
   - Re-queue stalled jobs or terminate hung background tasks.
2. **System Memory & Heap Reclaimer**:
   - Trigger `POST /api/admin/clear-memory` to invoke Python `gc.collect()` and Linux glibc `malloc_trim(0)`.
   - Forces uncompressed image buffers to immediately release memory back to the host operating system.
3. **Student Reviews & Satisfaction Feed**:
   - Inspect incoming anonymous student satisfaction ratings (1–5 stars) and feedback notes recorded from the processing cockpit.
4. **API Key & Model Quota Status**:
   - Live telemetry on Gemini API key rotation, request counts, quota consumption, and active fallback tiers.

---

## 5. Security Checklist for Administrators

- [x] Ensure `ADMIN_PASSWORD_HASH` in backend environment variables is a valid bcrypt hash, never plaintext.
- [x] Set a cryptographically random `JWT_SECRET_KEY` (minimum 32 characters, generated via `openssl rand -hex 32`).
- [x] Restrict `admin.documorph.in` DNS records behind Cloudflare WAF with IP allowlisting if possible.
- [x] Verify that public users accessing `documorph.in` cannot navigate to the Admin Hub by setting `VITE_ADMIN_ONLY=false` on the main deployment.
- [x] Confirm that all administrative endpoints (`/api/internal/admin/*`) require a valid `Authorization: Bearer <token>` header.
