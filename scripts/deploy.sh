#!/usr/bin/env bash
# ==============================================================================
# RailAlert Native Automated Deployment Script
# Target: AWS EC2 (Ubuntu 22.04 / 24.04 LTS - Direct Hosting, No Docker)
# ==============================================================================

set -euo pipefail

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================${NC}"
echo -e "${GREEN}   RailAlert EC2 Native Deployment Pipeline          ${NC}"
echo -e "${BLUE}======================================================${NC}"

# Configuration Variables
APP_DIR="${APP_DIR:-/home/ubuntu/railalert}"
WEB_ROOT="/var/www/railalert"
BACKEND_DIR="${APP_DIR}/backend"
FRONTEND_DIR="${APP_DIR}/frontend"

# Fallback detection if running inside repo root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

if [ ! -d "${APP_DIR}" ] && [ -d "${REPO_ROOT}/backend" ]; then
    APP_DIR="${REPO_ROOT}"
    BACKEND_DIR="${APP_DIR}/backend"
    FRONTEND_DIR="${APP_DIR}/frontend"
fi

cd "${APP_DIR}"

# 1. Pull Latest Source Code
echo -e "\n${BLUE}--> [1/6] Pulling latest code from Git repository...${NC}"
git fetch origin main
git reset --hard origin/main
echo -e "${GREEN}[OK] Git workspace synchronized with origin/main.${NC}"

# 2. Update Backend Virtual Environment & Dependencies
echo -e "\n${BLUE}--> [2/6] Updating Python virtual environment & packages...${NC}"
cd "${BACKEND_DIR}"

if [ ! -d "venv" ]; then
    echo "Creating missing virtual environment at ${BACKEND_DIR}/venv..."
    python3 -m venv venv
fi

# Activate venv
source venv/bin/activate

pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
echo -e "${GREEN}[OK] Backend dependencies updated.${NC}"

# 3. Database Schema Verification
echo -e "\n${BLUE}--> [3/6] Verifying database schema & tables...${NC}"
python3 -c "from app.core.database import Base, engine; import app.models; Base.metadata.create_all(bind=engine); print('Database tables verified.')"
echo -e "${GREEN}[OK] Database schema up to date.${NC}"

# 4. Build React SPA Production Assets
echo -e "\n${BLUE}--> [4/6] Building React frontend SPA bundle...${NC}"
cd "${FRONTEND_DIR}"

npm install --prefer-offline --no-audit
npm run build

echo -e "${YELLOW}Syncing production build to ${WEB_ROOT}...${NC}"
sudo mkdir -p "${WEB_ROOT}"
sudo rm -rf "${WEB_ROOT:?}"/*
sudo cp -r dist/* "${WEB_ROOT}/"
sudo chown -R ubuntu:www-data "${WEB_ROOT}"
sudo chmod -R 755 "${WEB_ROOT}"
echo -e "${GREEN}[OK] Frontend build deployed to ${WEB_ROOT}.${NC}"

# 5. Restart Backend Systemd Service & Reload Nginx
echo -e "\n${BLUE}--> [5/6] Restarting railalert.service and reloading Nginx...${NC}"
sudo systemctl restart railalert.service
sudo nginx -t
sudo systemctl reload nginx

# 6. Service Health Check Verification
echo -e "\n${BLUE}--> [6/6] Verifying system health and API responsiveness...${NC}"
sleep 3

HEALTH_URL="http://127.0.0.1:8000/health"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${HEALTH_URL}" || echo "000")

if [ "${HTTP_STATUS}" -eq 200 ]; then
    echo -e "${GREEN}[SUCCESS] RailAlert backend is healthy (HTTP 200)!${NC}"
    curl -s "${HEALTH_URL}"
    echo ""
else
    echo -e "${RED}[ERROR] Health check failed with HTTP ${HTTP_STATUS}!${NC}"
    echo -e "${YELLOW}Checking journal logs:${NC}"
    sudo journalctl -u railalert.service -n 25 --no-pager
    exit 1
fi

echo -e "\n${GREEN}======================================================${NC}"
echo -e "${GREEN}  RailAlert Deployment Completed Successfully!        ${NC}"
echo -e "${GREEN}======================================================${NC}"
