FROM python:3.10-slim

# Install system dependencies including Node.js
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Set up user for HuggingFace (must run as non-root on port 7860)
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

WORKDIR $HOME/app

# Copy requirements and install Python dependencies
COPY --chown=user:user requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

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
