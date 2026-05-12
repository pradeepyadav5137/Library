#!/bin/bash
# Deployment script for AWS EC2 - Fixed for 3-folder structure

# Exit on any error
set -e

# Define Absolute Paths based on your Home directory
PROJECT_ROOT="$HOME/Library_NITT"
BACKEND_ROOT="$PROJECT_ROOT/backend"
FRONTEND_ROOT="$PROJECT_ROOT/frontend"

echo "🚀 Pulling latest code..."
cd "$PROJECT_ROOT"
git pull origin main

echo "📦 Installing backend dependencies..."
# Check if package.json exists before installing
if [ -f "$BACKEND_ROOT/package.json" ]; then
    cd "$BACKEND_ROOT"
    npm install --production
else
    echo "❌ Error: package.json not found in $BACKEND_ROOT"
    exit 1
fi

echo "🔄 Restarting backend..."
# Tries to restart; if it doesn't exist, it starts a new process
pm2 restart backend --update-env || pm2 start "$BACKEND_ROOT/index.js" --name "backend"

echo "🏗️ Building frontend..."
cd "$FRONTEND_ROOT"
npm install

# Set the environment variable for the build
export VITE_API_URL="http://15.206.74.151/api"
npm run build

echo "🔐 Setting permissions..."
sudo chown -R ubuntu:www-data "$FRONTEND_ROOT/dist"
sudo chmod -R 755 "$FRONTEND_ROOT/dist"

echo "🧹 Restarting Nginx..."
sudo systemctl restart nginx

echo "✅ Deployment complete!"
pm2 status