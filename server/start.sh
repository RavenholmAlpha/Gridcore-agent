#!/bin/bash

# Exit on error
set -e

echo "[1/2] Installing dependencies..."
npm install

echo "[2/2] Starting PM2 (Backend + Frontend Dev)..."
npx pm2 start ecosystem.config.js

echo ""
echo "==================================================="
echo "Gridcore started successfully!"
echo "Backend:  http://localhost:3000"
echo "Frontend: http://localhost:5173"
echo "Use 'npx pm2 logs' to view logs."
echo "Use 'npx pm2 status' to view status."
echo "==================================================="
