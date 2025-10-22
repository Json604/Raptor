# Raptor Security Scanner - Railway Dockerfile
# Uses native binaries instead of Docker-in-Docker for better performance

FROM node:18-alpine

# Install dependencies for downloading and running security tools
RUN apk add --no-cache \
    git \
    curl \
    wget \
    unzip \
    tar \
    bash

WORKDIR /app

# Install TruffleHog binary
RUN echo "📦 Installing TruffleHog..." && \
    curl -sSfL https://raw.githubusercontent.com/trufflesecurity/trufflehog/main/scripts/install.sh | sh -s -- -b /usr/local/bin && \
    trufflehog --version && \
    echo "✅ TruffleHog installed"

# Install Gitleaks binary
RUN echo "📦 Installing Gitleaks..." && \
    wget https://github.com/gitleaks/gitleaks/releases/download/v8.18.1/gitleaks_8.18.1_linux_x64.tar.gz && \
    tar -xzf gitleaks_8.18.1_linux_x64.tar.gz && \
    mv gitleaks /usr/local/bin/ && \
    rm gitleaks_8.18.1_linux_x64.tar.gz && \
    gitleaks version && \
    echo "✅ Gitleaks installed"

# Install Nuclei binary (v3.4.10 - latest stable)
RUN echo "📦 Installing Nuclei..." && \
    wget https://github.com/projectdiscovery/nuclei/releases/download/v3.4.10/nuclei_3.4.10_linux_amd64.zip && \
    unzip nuclei_3.4.10_linux_amd64.zip && \
    chmod +x nuclei && \
    mv nuclei /usr/local/bin/ && \
    rm -f nuclei_3.4.10_linux_amd64.zip README.md LICENSE.md && \
    nuclei -version && \
    echo "✅ Nuclei installed"

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/health || exit 1

# Start the application
CMD ["npm", "start"]

