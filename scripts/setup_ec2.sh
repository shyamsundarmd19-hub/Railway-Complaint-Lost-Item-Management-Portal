#!/usr/bin/env bash
# ==============================================================================
# RailAlert EC2 Automated Provisioning & Deployment Script
# Optimized for AWS Free Tier (Ubuntu 22.04 / 24.04 LTS on t2.micro / t3.micro)
# Direct Hosting Architecture: Systemd + Gunicorn/Uvicorn + Nginx (No Docker)
# ==============================================================================

set -euo pipefail

# Color Codes for Terminal Output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================${NC}"
echo -e "${GREEN}   RailAlert EC2 Automated Provisioning Script       ${NC}"
echo -e "${BLUE}======================================================${NC}"

# Check if script is executed with sudo/root privileges
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}[ERROR] Please run this script with sudo privileges:${NC}"
    echo "  sudo bash $0"
    exit 1
fi

APP_USER="ubuntu"
APP_DIR="/home/${APP_USER}/railalert"
WEB_DIR="/var/www/railalert"
LOG_DIR="/var/log/railalert"

# Detect if APP_DIR exists or if running from cloned repository
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

if [ ! -d "${APP_DIR}" ] && [ -d "${REPO_ROOT}/backend" ]; then
    echo -e "${YELLOW}[INFO] Setting repository directory to ${REPO_ROOT}...${NC}"
    APP_DIR="${REPO_ROOT}"
fi

# ------------------------------------------------------------------------------
# 1. AWS Free Tier Optimization: Setup 2GB Swap Memory (Prevents t2.micro OOM)
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}--> Step 1: Checking and configuring Swap Memory for Free Tier...${NC}"
if ! swapon --show | grep -q "/swapfile"; then
    echo -e "${YELLOW}Creating 2GB swapfile to prevent Out-Of-Memory crashes on 1GB RAM instances...${NC}"
    fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    if ! grep -q '/swapfile' /etc/fstab; then
        echo '/swapfile none swap sw 0 0' >> /etc/fstab
    fi
    echo -e "${GREEN}[OK] Swap memory configured successfully.${NC}"
else
    echo -e "${GREEN}[OK] Swapfile already exists and is active.${NC}"
fi

# ------------------------------------------------------------------------------
# 2. Update System Packages & Install Native Dependencies
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}--> Step 2: Updating package lists and installing dependencies...${NC}"
apt-get update -y
DEBIAN_FRONTEND=noninteractive apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    python3-dev \
    build-essential \
    libpq-dev \
    nginx \
    git \
    curl \
    ufw \
    postgresql-client

echo -e "${GREEN}[OK] Native packages installed.${NC}"

# ------------------------------------------------------------------------------
# 3. Create Web & Logging Directories
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}--> Step 3: Setting up web root and log directories...${NC}"
mkdir -p "${WEB_DIR}"
mkdir -p "${LOG_DIR}"

chown -R "${APP_USER}":www-data "${WEB_DIR}"
chmod -R 755 "${WEB_DIR}"

chown -R "${APP_USER}":"${APP_USER}" "${LOG_DIR}"
chmod -R 755 "${LOG_DIR}"

# Create placeholder index.html if React build is not yet deployed
if [ ! -f "${WEB_DIR}/index.html" ]; then
    cat << 'EOF' > "${WEB_DIR}/index.html"
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RailAlert - Railway Grievance & Lost Item Portal</title>
    <style>
        body { font-family: system-ui, sans-serif; background-color: #f0fdf4; color: #064e3b; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .card { background: white; padding: 2.5rem; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); border: 1px solid #d1fae5; text-align: center; max-width: 520px; }
        h1 { color: #059669; margin-bottom: 0.5rem; }
        p { color: #374151; line-height: 1.6; }
        .badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.85rem; font-weight: 600; background: #ecfdf5; color: #047857; margin-top: 1rem; border: 1px solid #a7f3d0; }
    </style>
</head>
<body>
    <div class="card">
        <h1>RailAlert Portal</h1>
        <p>The RailAlert backend API and Nginx reverse proxy are running online.</p>
        <p>Deploy the React production bundle (<code>npm run build</code>) to <code>/var/www/railalert</code> to activate the user interface.</p>
        <span class="badge">API Health: <a href="/api/v1/complaints/" style="color: inherit; text-decoration: underline;">/api/v1/complaints/</a></span>
    </div>
</body>
</html>
EOF
    chown "${APP_USER}":www-data "${WEB_DIR}/index.html"
fi

echo -e "${GREEN}[OK] Web directories ready at ${WEB_DIR}.${NC}"

# ------------------------------------------------------------------------------
# 4. Setup Python Virtual Environment & Install Requirements
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}--> Step 4: Configuring Python virtual environment...${NC}"
BACKEND_DIR="${APP_DIR}/backend"

if [ -d "${BACKEND_DIR}" ]; then
    cd "${BACKEND_DIR}"
    
    if [ ! -d "venv" ]; then
        echo "Creating virtual environment at ${BACKEND_DIR}/venv..."
        sudo -u "${APP_USER}" python3 -m venv venv
    fi

    echo "Upgrading pip and installing backend requirements..."
    sudo -u "${APP_USER}" ./venv/bin/pip install --upgrade pip setuptools wheel
    sudo -u "${APP_USER}" ./venv/bin/pip install -r requirements.txt

    # Initialize .env file if not present
    if [ ! -f ".env" ] && [ -f ".env.example" ]; then
        echo "Creating initial .env from .env.example..."
        sudo -u "${APP_USER}" cp .env.example .env
        # Generate random 32-byte secret key
        SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))")
        sed -i "s/railalert-production-secret-change-me-with-openssl-rand-hex-32/${SECRET_KEY}/g" .env
    fi
    echo -e "${GREEN}[OK] Python virtualenv and packages installed successfully.${NC}"
else
    echo -e "${YELLOW}[WARN] Backend directory ${BACKEND_DIR} not found. Skipping venv setup.${NC}"
fi

# ------------------------------------------------------------------------------
# 5. Configure & Enable Systemd Service
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}--> Step 5: Configuring Systemd service (railalert.service)...${NC}"
SERVICE_SRC="${REPO_ROOT}/scripts/railalert.service"

if [ -f "${SERVICE_SRC}" ]; then
    # Adapt path if directory is custom
    sed "s|/home/ubuntu/railalert|${APP_DIR}|g" "${SERVICE_SRC}" > /etc/systemd/system/railalert.service
    systemctl daemon-reload
    systemctl enable railalert.service
    systemctl restart railalert.service
    echo -e "${GREEN}[OK] railalert.service enabled and started.${NC}"
else
    echo -e "${RED}[ERROR] ${SERVICE_SRC} file missing.${NC}"
fi

# ------------------------------------------------------------------------------
# 6. Configure & Reload Nginx Reverse Proxy
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}--> Step 6: Configuring Nginx reverse proxy...${NC}"
NGINX_SRC="${REPO_ROOT}/scripts/nginx.conf"

if [ -f "${NGINX_SRC}" ]; then
    cp "${NGINX_SRC}" /etc/nginx/sites-available/railalert
    
    # Remove default site if present
    if [ -f /etc/nginx/sites-enabled/default ]; then
        rm -f /etc/nginx/sites-enabled/default
    fi

    # Enable railalert configuration
    if [ ! -L /etc/nginx/sites-enabled/railalert ]; then
        ln -s /etc/nginx/sites-available/railalert /etc/nginx/sites-enabled/railalert
    fi

    # Test configuration and restart
    nginx -t
    systemctl restart nginx
    echo -e "${GREEN}[OK] Nginx configured and restarted successfully.${NC}"
else
    echo -e "${RED}[ERROR] ${NGINX_SRC} file missing.${NC}"
fi

# ------------------------------------------------------------------------------
# 7. Configure Firewall (UFW)
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}--> Step 7: Configuring UFW firewall rules...${NC}"
ufw allow 'OpenSSH' || true
ufw allow 'Nginx Full' || true
ufw --force enable || true
echo -e "${GREEN}[OK] Firewall allows SSH and HTTP/HTTPS traffic.${NC}"

# ------------------------------------------------------------------------------
# Summary & Verification
# ------------------------------------------------------------------------------
echo -e "\n${GREEN}======================================================${NC}"
echo -e "${GREEN}  RailAlert Deployment Completed Successfully!        ${NC}"
echo -e "${GREEN}======================================================${NC}"
echo -e "Backend Service Status:"
systemctl --no-pager status railalert.service || true
echo -e "\nNginx Status:"
systemctl --no-pager status nginx || true
echo -e "\nNext Steps:"
echo -e "1. Edit ${BACKEND_DIR}/.env to configure your PostgreSQL RDS URL & AWS S3 credentials."
echo -e "2. Build your React frontend and copy dist/ to ${WEB_DIR}/"
echo -e "3. Access your server at: http://$(curl -s http://checkip.amazonaws.com || echo 'YOUR_EC2_PUBLIC_IP')"
