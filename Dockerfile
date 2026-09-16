FROM python:3.10-slim

# Install system dependencies including Node.js
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Configure shared Playwright browser cache accessible by any user
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Copy requirements and install Python dependencies + Playwright system libraries
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
    && python -m playwright install --with-deps chromium \
    && chmod -R 777 /ms-playwright

# Set up user for HuggingFace / non-root environments (must run as non-root on port 7860)
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    PYTHONUNBUFFERED=1

WORKDIR $HOME/app

# Copy frontend code and build it
COPY --chown=user:user frontend/package*.json ./frontend/
RUN cd frontend && npm install
COPY --chown=user:user frontend/ ./frontend/
RUN cd frontend && npm run build

# Copy the rest of the backend code
COPY --chown=user:user . .

# Ensure the startup script is executable
RUN chmod +x start.sh

# Expose HuggingFace Space port
EXPOSE 7860

CMD ["./start.sh"]
