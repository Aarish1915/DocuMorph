#!/bin/bash
set -e

# Initialize directory structure and SQLite database
mkdir -p data data/uploads data/output data/output/needs_review
python -c "from documorph.core.database import init_db; init_db()"

# Ensure Playwright browser binary exists
if ! python -c "from playwright.sync_api import sync_playwright; p = sync_playwright().start(); p.chromium.launch(); p.stop()" 2>/dev/null; then
    echo "Playwright chromium missing. Running pre-flight installation..."
    python -m playwright install chromium || true
fi

# Start background queue worker in background
echo "Starting DocuMorph Queue Worker..."
python -m documorph.worker.queue_worker &

# Start FastAPI gateway on Render or local port
PORT="${PORT:-8000}"
echo "Starting DocuMorph FastAPI Gateway on port $PORT..."
exec uvicorn documorph.api.main:app --host 0.0.0.0 --port "$PORT"
