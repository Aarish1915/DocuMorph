# DocuMorph (Hybrid Vision Extraction Engine)

DocuMorph is a highly optimized, decoupled Microservices pipeline for extracting highly complex dual-language (Hindi + English) competitive exam PDFs into clean Markdown. 

Engineered to run under extreme constraints (512MB RAM, zero GPU, 15 API Requests-Per-Minute), it dynamically routes pages between cost-free local text extraction and Google Gemini Vision-Language Models using a proprietary geometric sweeping algorithm ("Lightning Sweeper").

## 📁 Directory Structure
```
DocuMorph/
├── documorph/               # Core Python Backend
│   ├── api/                 # FastAPI Gateway (main.py)
│   ├── core/                # Intelligence (LightningSweeper, Batch Vision)
│   ├── worker/              # Background Process (queue_worker.py, pipeline.py)
│   └── postprocessing/      # Spam Hash-Set, Hindi Regex, Format Polisher
├── frontend/                # React UI (Psychology-driven design, SSE telemetry)
├── archive/                 # Historical scripts & dead code
├── docs/presentation/       # Project synopsis and PPTX materials
├── jobs.db                  # SQLite Task Queue (Git ignored)
└── uploads/                 # Ephemeral file storage (Git ignored)
```

## 🚀 Features
- **Decoupled Architecture:** A non-blocking FastAPI gateway writes to an SQLite queue, while a background daemon executes heavy PyMuPDF/Gemini compute.
- **Dedicated Multi-Tool Pages (iLovePDF Paradigm):** Distinct views with dedicated dropzones and specialized controls for `#clean`, `#compress`, `#extract`, and `#translate`.
- **Anime.js 3D Physics:** Smooth 60fps spring-based Before/After split sliders, interactive 3D perspective tilt on hover, and staggered card entrances.
- **10+ Multi-Language Matrix:** Comprehensive translation support across 10 Indian languages (*Hindi, Marathi, Gujarati, Bengali, Tamil, Telugu, Kannada, Malayalam, Punjabi, Urdu*) + international languages with strict LaTeX formula & code-block preservation.
- **True Page & Whitespace Compaction:** Condenses loose 50-page coaching booklets into 18 dense 2-column A4 sheets, saving 60% printing costs without deleting content.
- **Lightning Sweeper:** Geometrically scans pages in milliseconds to decide if local extraction (XY-Cut) is sufficient or if AI Vision is required.
- **Two-Pass Spam Filtering:** Uses O(1) Hash-Set lookups to instantly destroy repeating coaching center watermarks, falling back to Regex.
- **Psychology-Driven UI:** Choice Architecture presets, Progressive Disclosure settings, and live 5-stage SVG progress rings with SSE telemetry.

## 🛠️ Installation & Usage

1. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   cd frontend && npm install
   ```

2. **Set Environment Variables:**
   Create a `.env` file in the root:
   ```env
   GEMINI_API_KEY="your_api_key_here"
   ```

3. **Start the Microservices:**
   Use the unified start script to launch the API, the Background Worker, and the React Frontend simultaneously:
   ```bash
   ./start.sh
   # Or run individually:
   # python -m uvicorn documorph.api.main:app --port 8000
   # python -m documorph.worker.queue_worker
   # cd frontend && npm run dev
   ```

## 🛡️ Architecture & Deep Knowledge
For deep architectural decisions, historical mistakes, and dataset math, read the Markdown files in the root (`ARCHITECTURE.md`, `STATE.md`, `MISTAKES.md`). For a full academic synopsis, refer to `docs/presentation/DocuMorph_Synopsis.pdf`.
