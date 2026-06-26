# Use node 20 bookworm slim as a base for building/running
FROM node:20-bookworm-slim

# Install system dependencies for Electron, Chromium, X11, Openbox, and noVNC
RUN apt-get update && apt-get install -y --no-install-recommends \
    xvfb \
    x11vnc \
    websockify \
    openbox \
    dbus-x11 \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libgtk-3-0 \
    libgbm1 \
    libasound2 \
    libxshmfence1 \
    libx11-xcb1 \
    libxcb-dri3-0 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxtst6 \
    libpango-1.0-0 \
    libcairo2 \
    curl \
    ca-certificates \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install noVNC client files and websockify proxy
RUN mkdir -p /opt/novnc && \
    curl -sSL https://github.com/novnc/noVNC/archive/v1.4.0.tar.gz | tar -xzf - --strip-components=1 -C /opt/novnc && \
    mkdir -p /opt/novnc/utils/websockify && \
    curl -sSL https://github.com/novnc/websockify/archive/v0.11.0.tar.gz | tar -xzf - --strip-components=1 -C /opt/novnc/utils/websockify

# Expose VNC port (5900) and noVNC web port (8080)
EXPOSE 8080 5900

WORKDIR /app

# Copy package files and install dependencies
# Note: npm install will trigger g++ compilation of better-sqlite3 for Linux
COPY package*.json ./
RUN npm install && npx electron-builder install-app-deps

# Copy the rest of the application files
COPY . .

# Set display parameters
ENV DISPLAY=:99
ENV RESOLUTION=1280x800

# Copy start script
COPY start.sh /start.sh
RUN chmod +x /start.sh

CMD ["/start.sh"]
