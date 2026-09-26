#!/bin/bash
set -e
export PYTHONUNBUFFERED=1

# Initialize directory structure
mkdir -p data data/uploads data/output data/output/needs_review

# Note: Worker and database migrations are auto-spawned by FastAPI lifespan hook

# Start FastAPI gateway on Render ($PORT defaults to 10000 on Render) or specified port
PORT="${PORT:-10000}"
echo "Starting DocuMorph FastAPI Gateway on port $PORT..."
exec uvicorn documorph.api.main:app --host 0.0.0.0 --port "$PORT"
