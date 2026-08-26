# DocuFlow AI - Production High-Fidelity Conversion Worker Dockerfile
FROM node:20-bullseye-slim

# Install LibreOffice Headless, Poppler, and Essential TrueType/OpenType Fonts
RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice \
    libreoffice-writer \
    libreoffice-calc \
    libreoffice-impress \
    fonts-liberation \
    fonts-dejavu \
    fonts-freefont-ttf \
    poppler-utils \
    ghostscript \
    ca-certificates \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set Working Directory
WORKDIR /usr/src/app

# Copy dependency manifests
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy source code and build
COPY . .
RUN npm run build

# Create necessary runtime directories
RUN mkdir -p uploads storage /tmp/docuflow

# Expose API port
EXPOSE 5000

# Set Environment Variables
ENV NODE_ENV=production
ENV PORT=5000
ENV LIBREOFFICE_PATH=/usr/bin/libreoffice

# Start the API server & conversion worker
CMD ["node", "dist/app.js"]
