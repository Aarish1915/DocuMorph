#!/bin/bash

# Initialize the SQLite Database
mkdir -p data
python -c "from documorph.core.database import init_db; init_db()"

# Start the Background Queue Worker as a background process (&)
echo "Starting Background Queue Worker..."
python -m documorph.worker.queue_worker &

# Start the FastAPI Web Server in the foreground on Port 7860
echo "Starting FastAPI Gateway on Port 7860..."
uvicorn documorph.api.main:app --host 0.0.0.0 --port 7860
