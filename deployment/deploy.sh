#!/bin/bash
# ============================================================
#  ONE-CLICK DEPLOY — NIT Trichy Library ID Card System
#  Run this on your EC2:  bash ~/Library/deployment/deploy.sh
# ============================================================
set -e  # Stop immediately on any error

# ── Paths ────────────────────────────────────────────────────
PROJECT_ROOT="$HOME/Library"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
EC2_IP="[IP_ADDRESS]"

echo ""
echo "=========================================="
echo "  NIT Library — Deploying latest build"
echo "=========================================="
echo ""

# ── 1. Pull latest code ───────────────────────────────────────
echo "▶ [1/5] Pulling latest code from GitHub..."
cd "$PROJECT_ROOT"
git pull origin main
echo "   ✓ Code updated"

# ── 2. Backend dependencies ───────────────────────────────────
echo ""
echo "▶ [2/5] Installing backend dependencies..."
cd "$BACKEND_DIR"
npm install --omit=dev
echo "   ✓ Backend dependencies ready"

# ── 3. Restart backend with PM2 ───────────────────────────────
echo ""
echo "▶ [3/5] Restarting backend (PM2)..."
pm2 restart library-backend --update-env 2>/dev/null \
  || pm2 start "$BACKEND_DIR/server.js" \
       --name "library-backend" \
       --env production
pm2 save
echo "   ✓ Backend running on port 5000"

# ── 4. Build frontend ─────────────────────────────────────────
echo ""
echo "▶ [4/5] Building frontend..."
cd "$FRONTEND_DIR"
npm install
# VITE_API_URL is read automatically from frontend/.env
npm run build
echo "   ✓ Frontend built → $FRONTEND_DIR/dist"

# ── 5. Permissions + Nginx ────────────────────────────────────
echo ""
echo "▶ [5/5] Setting permissions & restarting Nginx..."
sudo chown -R ubuntu:www-data "$FRONTEND_DIR/dist"
sudo chmod -R 755 "$FRONTEND_DIR/dist"
sudo systemctl restart nginx
echo "   ✓ Nginx restarted"

# ── Done ──────────────────────────────────────────────────────
echo ""
echo "=========================================="
echo "  ✅ Deployment complete!"
echo "  🌐 http://$EC2_IP"
echo "=========================================="
echo ""
pm2 status