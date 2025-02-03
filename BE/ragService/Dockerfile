# syntax=docker/dockerfile:1
FROM python:3.10.16-slim

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libssl-dev \
    libffi-dev \
    curl \
    git \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
RUN python3 -m pip install --upgrade pip setuptools wheel

WORKDIR /embeddingService
COPY requirements.txt requirements.txt

# Upgrade pip and install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 8080
COPY . .
CMD ["python3", "server/app.py", "--debug"]