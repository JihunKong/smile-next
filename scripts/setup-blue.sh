#!/bin/bash
# SMILE Next.js - Blue Environment Initial Setup Script
# Usage: sudo ./scripts/setup-blue.sh
#
# This script sets up the Blue/Green deployment infrastructure:
# 1. Installs Nginx and Certbot
# 2. Configures Nginx for Blue environment
# 3. Sets up SSL certificates
#
# Run as root or with sudo on the EC2 server

set -e

echo "==========================================="
echo "  SMILE Next.js - Blue Environment Setup"
echo "==========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() { echo -e "${GREEN}[INFO]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARN]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root (sudo ./scripts/setup-blue.sh)"
    exit 1
fi

# Configuration
DOMAIN="smile-next-blue.seedsofempowerment.org"
APP_DIR="/opt/smile/app"

# Step 1: Stop existing containers using port 80
print_status "Stopping existing containers..."
cd "$APP_DIR"
if [ -f "docker-compose.prod.yml" ]; then
    docker compose -f docker-compose.prod.yml down || true
fi

# Step 2: Install Nginx and Certbot
print_status "Installing Nginx and Certbot..."
apt update
apt install -y nginx certbot python3-certbot-nginx

# Step 3: Create Nginx configuration
print_status "Creating Nginx configuration..."
cat > /etc/nginx/sites-available/smile-next << 'EOF'
# SMILE Next.js Blue/Green Nginx Configuration
# Rate limiting
limit_req_zone $binary_remote_addr zone=smile_limit:10m rate=10r/s;

# BLUE Environment (Development/Testing) - Port 3001
server {
    listen 80;
    server_name smile-next-blue.seedsofempowerment.org;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /_next/static/ {
        proxy_pass http://localhost:3001;
        proxy_cache_valid 200 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_connect_timeout 120s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
    }
}
EOF

# Step 4: Enable Nginx configuration
print_status "Enabling Nginx configuration..."
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/smile-next /etc/nginx/sites-enabled/

# Step 5: Test and reload Nginx
print_status "Testing Nginx configuration..."
nginx -t

print_status "Reloading Nginx..."
systemctl reload nginx
systemctl enable nginx

# Step 6: Create .env.blue if it doesn't exist
if [ ! -f "$APP_DIR/.env.blue" ]; then
    print_status "Creating .env.blue from .env..."
    if [ -f "$APP_DIR/.env" ]; then
        cp "$APP_DIR/.env" "$APP_DIR/.env.blue"
        # Update URLs for Blue environment
        sed -i 's|NEXTAUTH_URL=.*|NEXTAUTH_URL=https://smile-next-blue.seedsofempowerment.org|g' "$APP_DIR/.env.blue"
        sed -i 's|NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=https://smile-next-blue.seedsofempowerment.org|g' "$APP_DIR/.env.blue"
        print_status ".env.blue created. Please verify the configuration."
    else
        print_warning ".env not found. Please create .env.blue manually."
    fi
fi

# Step 7: Start Blue containers
print_status "Starting Blue environment containers..."
cd "$APP_DIR"
docker compose -f docker-compose.blue.yml up -d --build

# Step 8: Wait for app to start
print_status "Waiting for application to start..."
sleep 20

# Step 9: Setup SSL (requires DNS to be configured)
print_status "Setting up SSL certificate..."
print_warning "Make sure DNS A record for $DOMAIN points to this server's IP"
print_warning "Running certbot..."

certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email admin@seedsofempowerment.org || {
    print_warning "SSL setup failed. You can run it manually later:"
    print_warning "sudo certbot --nginx -d $DOMAIN"
}

echo ""
echo "==========================================="
echo "  Setup Complete!"
echo "==========================================="
echo ""
echo "Blue Environment URL: https://$DOMAIN"
echo ""
echo "Next steps:"
echo "1. Verify DNS A record: $DOMAIN -> $(curl -s ifconfig.me)"
echo "2. Test the application: curl https://$DOMAIN/api/health"
echo "3. View logs: docker compose -f docker-compose.blue.yml logs -f"
echo ""
