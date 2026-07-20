#!/bin/bash

# Clean up existing X server lock files
rm -f /tmp/.X99-lock

# Start Xvfb (Virtual Frame Buffer) in background
Xvfb :99 -screen 0 ${RESOLUTION}x24 &
sleep 2

# Start Openbox Window Manager (so window borders and controls are visible)
openbox-session &

# Start VNC server (without password for simplicity in local dev environment)
x11vnc -display :99 -forever -shared -nopw -rfbport 5900 &
sleep 2

# Symlink vnc.html to index.html so noVNC loads automatically at http://localhost:8080/
ln -sf /opt/novnc/vnc.html /opt/novnc/index.html

# Start noVNC proxy (automatically manages and starts websockify)
/opt/novnc/utils/novnc_proxy --vnc localhost:5900 --listen 8080 &
sleep 2

# Start Electron application in development mode
# Note: --no-sandbox is required when running Electron as root inside Docker
npm run dev -- --no-sandbox
