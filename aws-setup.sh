#!/bin/bash
# =============================================================================
# AWS EC2 Setup Script for SMILE Next.js
# =============================================================================
# Run this script on a fresh Ubuntu 22.04 EC2 instance
# Instance: t3.micro (1GB) or t3.small (2GB) recommended
#
# Usage:
#   chmod +x aws-setup.sh
#   ./aws-setup.sh
# =============================================================================

set -e

echo "=== SMILE Next.js AWS Setup ==="
echo ""

# Update system
echo "[1/6] Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker
echo "[2/6] Installing Docker..."
sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add current user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
echo "[3/6] Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create app directory
echo "[4/6] Creating application directory..."
sudo mkdir -p /opt/smile
sudo chown $USER:$USER /opt/smile
cd /opt/smile

# Create .env file template
echo "[5/6] Creating environment file template..."
cat > .env.template << 'EOF'
# =============================================================================
# SMILE Next.js - Production Environment Variables
# =============================================================================
# Copy this to .env and fill in your values

# Database
DB_PASSWORD=your_secure_database_password_here

# Application URLs
NEXTAUTH_URL=https://your-domain.com
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Authentication
AUTH_SECRET=generate_with_openssl_rand_base64_32

# Google OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# AI Services (at least one required for evaluations)
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-sonnet-4-5-20250929

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
EMAIL_FROM=SMILE <noreply@smile.edu>
EOF

echo ""
echo "[6/6] Setup complete!"
echo ""
echo "=== Next Steps ==="
echo "1. Log out and log back in (for Docker group)"
echo "2. Clone your repository:"
echo "   git clone https://github.com/JihunKong/smile-next.git /opt/smile/app"
echo ""
echo "3. Configure environment:"
echo "   cp /opt/smile/.env.template /opt/smile/app/.env"
echo "   nano /opt/smile/app/.env"
echo ""
echo "4. Build and start:"
echo "   cd /opt/smile/app"
echo "   docker-compose -f docker-compose.prod.yml build"
echo "   docker-compose -f docker-compose.prod.yml up -d"
echo ""
echo "5. Initialize database:"
echo "   docker exec smile-app npx prisma db push"
echo ""
echo "=== Security Reminders ==="
echo "- Configure AWS Security Group: Allow ports 80, 443, 22"
echo "- Set up SSL with Let's Encrypt (nginx-proxy or Caddy)"
echo "- Change default database password"
echo "- Generate a strong AUTH_SECRET"
echo ""
