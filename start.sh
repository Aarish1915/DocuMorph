#!/bin/bash
set -e

# Initialize directory structure and SQLite database
mkdir -p data data/uploads data/output data/output/needs_review
python -c "from documorph.core.database import init_db; init_db()"

# Start background queue worker in background
echo "Starting DocuMorph Queue Worker..."
python -m documorph.worker.queue_worker &

# Start FastAPI gateway on Render or local port
PORT="${PORT:-8000}"
echo "Starting DocuMorph FastAPI Gateway on port $PORT..."
exec uvicorn documorph.api.main:app --host 0.0.0.0 --port "$PORT"
