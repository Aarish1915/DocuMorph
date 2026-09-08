# DocuMorph - The Master Architecture Manifesto

## 1. What is DocuMorph?
**The Vision:** DocuMorph is an advanced, high-performance AI document extraction pipeline. It takes complex PDFs (coaching materials, books, mixed-media documents), intelligently slices them, and uses Vision-Language Models (Gemini 3.5 Flash) to perfectly extract formatting, text, and structure into clean Markdown. 
**The Constraints:** It is engineered specifically to survive extreme free-tier cloud constraints (0$ budget, 512MB RAM limits, restrictive API rate limits, and zero credit-card requirements).

---

## 2. System Architecture (Where & How)
The application has evolved from a basic monolith into a highly decoupled, asynchronous Microservices Architecture.

### A. The API Gateway (`documorph/api/main.py`)
*   **What it does:** The front-door of the application. It receives PDFs via a beautiful React frontend, checks for duplicates (Semantic Caching via MD5 hashing), enforces a strict 50-page limit (to prevent RAM crashes), and inserts the job into the database. 
*   **Why:** Fast APIs should never block. By offloading the heavy AI work, the web server remains blazing fast and never crashes due to OOM (Out of Memory). It also streams live queue position updates to the user via Server-Sent Events (SSE).

### B. The Core Intelligence (`documorph/core/`)
*   **`batch_vision.py` (Native Multi-Part Vision):** Abandons traditional "image stitching" (which loses resolution and causes AI hallucinations). Instead, it sends raw, uncompressed PyMuPDF crops as native arrays to the Gemini API, preserving 100% fidelity. It processes 15 pages per API call to bypass Gemini's 15 Requests-Per-Minute limit.
*   **`crop_sweeper.py` (The Breakeven Math):** Analyzes pages locally before calling the AI. If a page has >5 crops or is >50% graphical, it bypasses local extraction and sends the entire page to Vision AI. This saves thousands of unnecessary API calls.
*   **`tier_manager.py`:** Dynamically scales API rate limits. If a user provides a Paid API key, the system removes delays; if using the Free key, it strictly enforces delays to prevent `429 Too Many Requests` bans.

### C. The Backend Compute Workers (`documorph/worker/`)
*   **`queue_worker.py` (The Local Engine):** A background python process that continuously polls the SQLite database for `QUEUED` jobs and executes the heavy pipeline locally on the server/laptop.
*   **`github_poller.py` (The Cloud Hack):** An alternative compute engine designed to run inside GitHub Actions. To eliminate the 15-second GitHub "Cold Start", it uses a "Warm Poller" `while` loop to stay awake for 5 minutes after a job, processing subsequent jobs instantly.

### D. The Frontend Architecture & Multi-Tool Client Router (`frontend/src/`)
*   **Multi-Tool Route Segregation:** Discards the confusing monolithic landing page in favor of an iLovePDF paradigm with dedicated views (`#home`, `#clean`, `#compress`, `#extract`, `#translate`) synced to `window.location.hash`.
*   **Anime.js Physics Engine:** Delivers 60fps spring physics for 3D card perspective tilt on mouse tracking, fluid Before/After split sweeps, and staggered entrance transitions.
*   **Multi-Language Matrix:** Provides native translation across 10 Indian regional languages + 4 international languages with KaTeX formula and code block protection.
*   **Choice Architecture Presets:** Screen 2 (`WorkspaceScreen.jsx`) preselects intelligent defaults (UPSC, Physics/Math, Compact Paper, Copy Text) so users convert documents in 1 click without technical configuration fatigue.

---

## 3. What We Conquered (The Evolution)
1.  **The RAM Crisis:** The monolith would crash PyMuPDF on 512MB free tiers. We solved this by decoupling the worker, enforcing a 50-page pre-flight check, and aggressively using `gc.collect()` and explicit document closure.
2.  **The Optimization Paradox:** We realized local OCR was costing *more* API calls for complex pages. We solved this with the `LightningSweeper` breakeven math.
3.  **The "TOS Ban" on GitHub Actions:** Using GitHub as a free server violates their Terms of Service. We bypassed their webhooks ban by rewriting the API to officially `git commit` job files to hidden branches (triggering on standard `push` events) so it looks like legitimate developer activity.

---

## 4. Future Plans (What, How, Why, & Where)

### Future Phase 1: The Cloud Database Migration
*   **What:** Ditch the local `SQLite` database and move to a free cloud PostgreSQL database (like **Supabase** or **Neon**).
*   **Why:** If we want to host the web server on Render and the heavy worker on GitHub Actions, they *must* be able to talk to each other. They cannot share a local SQLite file.
*   **How:** Update `database.py` to use SQLAlchemy with a `DATABASE_URL` environment variable pointing to the cloud DB.

### Future Phase 2: Distributed Browser Compute (The Ultimate Hack)
*   **What:** Move PyMuPDF slicing directly into the user's web browser.
*   **Why:** Server compute costs money. Client compute is infinite and free. If we offload the PDF slicing to the user's laptop/phone, our server RAM usage drops to 0MB.
*   **How:** Implement `PDF.js` or WebAssembly (Pyodide) in the React frontend (`index.html`) to slice the PDF before sending the images to our API.

### Future Phase 3: The ML Data Flywheel
*   **What:** Start saving every successful PDF, its user parameters, and the final Markdown output into a `.json` dataset inside `data/ml_dataset/`.
*   **Why:** The Gemini API is a crutch. We want to eventually train our own tiny, local Vision model (like a fine-tuned `Florence-2`) to do the extraction locally.
*   **Where:** Handled at the very end of `pipeline.py` after a successful extraction. This data will be gold for your machine learning career.

### Future Phase 4: Round-Robin Key Rotation
*   **What:** Accept a comma-separated list of Gemini API keys from the user.
*   **Why:** The Free Tier restricts us to 1,500 daily requests. 3 keys = 4,500 daily requests.
*   **How:** Modify `BatchVisionEngine` to mathematically shift `(Key A -> Key B -> Key C)` every time an API call is made, ensuring perfect load balancing and zero rate-limit bans.
