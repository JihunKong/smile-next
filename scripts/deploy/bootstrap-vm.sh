#!/bin/bash
# ==============================================================================
# SMILE Application - VM Bootstrap Script
# ==============================================================================
# This script sets up a fresh GCP Compute Engine VM for the SMILE CI/CD pipeline.
#
# What it does:
#   1. Updates system packages
#   2. Installs Docker and Docker Compose plugin
#   3. Creates the deployment directory structure
#   4. Generates an SSH key pair for CI/CD authentication
#   5. Creates Docker volumes for persistent data
#   6. Outputs credentials for GitHub Secrets
#
# Usage (run on the VM as your deploy user):
#   curl -fsSL https://raw.githubusercontent.com/seeds-smile-the-ultimate/smile-web/develop/scripts/deploy/bootstrap-vm.sh | bash
#   
# Or if you have the repo cloned:
#   bash scripts/deploy/bootstrap-vm.sh
#
# ==============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║                    SMILE VM Bootstrap Script                         ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# ==============================================================================
# 1. System Information
# ==============================================================================
echo -e "${BLUE}📋 System Information${NC}"
echo "   Hostname: $(hostname)"
echo "   User: $(whoami)"
echo "   Home: $HOME"
echo "   OS: $(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)"
echo ""

# Get external IP
EXTERNAL_IP=$(curl -s -H "Metadata-Flavor: Google" http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip 2>/dev/null || curl -s ifconfig.me 2>/dev/null || echo "UNKNOWN")
echo -e "   ${GREEN}External IP: $EXTERNAL_IP${NC}"
echo ""

# ==============================================================================
# 2. Update System Packages
# ==============================================================================
echo -e "${BLUE}📦 Updating system packages...${NC}"
if command -v apt-get &> /dev/null; then
  sudo apt-get update -qq
  sudo apt-get upgrade -y -qq
  echo -e "${GREEN}✅ System packages updated${NC}"
elif command -v yum &> /dev/null; then
  sudo yum update -y -q
  echo -e "${GREEN}✅ System packages updated${NC}"
else
  echo -e "${YELLOW}⚠️  Unknown package manager, skipping system update${NC}"
fi
echo ""

# ==============================================================================
# 3. Install Docker
# ==============================================================================
echo -e "${BLUE}🐳 Installing Docker...${NC}"
if command -v docker &> /dev/null; then
  echo -e "${GREEN}✅ Docker is already installed: $(docker --version)${NC}"
else
  echo "   Downloading Docker installation script..."
  curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
  sudo sh /tmp/get-docker.sh
  rm /tmp/get-docker.sh
  
  # Add current user to docker group
  sudo usermod -aG docker "$USER"
  echo -e "${GREEN}✅ Docker installed: $(docker --version)${NC}"
  echo -e "${YELLOW}⚠️  NOTE: You may need to log out and back in for docker group to take effect${NC}"
fi
echo ""

# ==============================================================================
# 4. Install Docker Compose Plugin
# ==============================================================================
echo -e "${BLUE}🔧 Installing Docker Compose plugin...${NC}"
if docker compose version &> /dev/null 2>&1 || sudo docker compose version &> /dev/null 2>&1; then
  echo -e "${GREEN}✅ Docker Compose is already installed: $(docker compose version 2>/dev/null || sudo docker compose version)${NC}"
else
  if command -v apt-get &> /dev/null; then
    sudo apt-get install -y docker-compose-plugin
  elif command -v yum &> /dev/null; then
    sudo yum install -y docker-compose-plugin
  else
    echo -e "${RED}❌ Could not install docker-compose-plugin automatically${NC}"
    echo "   Please install it manually: https://docs.docker.com/compose/install/"
    exit 1
  fi
  echo -e "${GREEN}✅ Docker Compose plugin installed${NC}"
fi
echo ""

# ==============================================================================
# 5. Start and Enable Docker Service
# ==============================================================================
echo -e "${BLUE}🚀 Starting Docker service...${NC}"
sudo systemctl start docker 2>/dev/null || true
sudo systemctl enable docker 2>/dev/null || true
echo -e "${GREEN}✅ Docker service started and enabled${NC}"
echo ""

# ==============================================================================
# 6. Create Deployment Directory
# ==============================================================================
echo -e "${BLUE}📁 Creating deployment directory...${NC}"
mkdir -p "$HOME/smile-next/scripts/deploy"
echo -e "${GREEN}✅ Directory created: $HOME/smile-next${NC}"
echo ""

# ==============================================================================
# 7. Create Docker Volumes
# ==============================================================================
echo -e "${BLUE}💾 Creating Docker volumes for persistent data...${NC}"
# Use sudo if needed (in case docker group hasn't taken effect yet)
DOCKER_CMD="docker"
if ! docker info &> /dev/null 2>&1; then
  DOCKER_CMD="sudo docker"
fi

$DOCKER_CMD volume create app_postgres_data 2>/dev/null && echo "   Created: app_postgres_data" || echo "   Exists: app_postgres_data"
$DOCKER_CMD volume create app_redis_data 2>/dev/null && echo "   Created: app_redis_data" || echo "   Exists: app_redis_data"
echo -e "${GREEN}✅ Docker volumes ready${NC}"
echo ""

# ==============================================================================
# 8. Generate SSH Key for CI/CD
# ==============================================================================
SSH_KEY_PATH="$HOME/.ssh/smile-cicd-deploy"
echo -e "${BLUE}🔐 Generating SSH key pair for CI/CD...${NC}"

if [ -f "$SSH_KEY_PATH" ]; then
  echo -e "${YELLOW}⚠️  SSH key already exists at $SSH_KEY_PATH${NC}"
  read -p "   Overwrite existing key? (y/N): " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "   Keeping existing key"
  else
    rm -f "$SSH_KEY_PATH" "$SSH_KEY_PATH.pub"
    ssh-keygen -t ed25519 -C "smile-cicd-$(date +%Y%m%d)" -f "$SSH_KEY_PATH" -N ""
    echo -e "${GREEN}✅ New SSH key generated${NC}"
  fi
else
  mkdir -p "$HOME/.ssh"
  chmod 700 "$HOME/.ssh"
  ssh-keygen -t ed25519 -C "smile-cicd-$(date +%Y%m%d)" -f "$SSH_KEY_PATH" -N ""
  echo -e "${GREEN}✅ SSH key generated${NC}"
fi
echo ""

# ==============================================================================
# 9. Add Public Key to authorized_keys
# ==============================================================================
echo -e "${BLUE}🔑 Adding public key to authorized_keys...${NC}"
if ! grep -q "$(cat "$SSH_KEY_PATH.pub")" "$HOME/.ssh/authorized_keys" 2>/dev/null; then
  cat "$SSH_KEY_PATH.pub" >> "$HOME/.ssh/authorized_keys"
  chmod 600 "$HOME/.ssh/authorized_keys"
  echo -e "${GREEN}✅ Public key added to authorized_keys${NC}"
else
  echo -e "${GREEN}✅ Public key already in authorized_keys${NC}"
fi
echo ""

# ==============================================================================
# 10. Create placeholder .env file
# ==============================================================================
ENV_FILE="$HOME/smile-next/.env"
if [ ! -f "$ENV_FILE" ]; then
  echo -e "${BLUE}📝 Creating placeholder .env file...${NC}"
  cat > "$ENV_FILE" << 'ENVEOF'
# ==============================================================================
# SMILE Application Environment Variables
# ==============================================================================
# IMPORTANT: Fill in all required values before running the application!
# ==============================================================================

# Authentication (REQUIRED)
AUTH_SECRET=CHANGE_ME_RUN_openssl_rand_base64_32
NEXTAUTH_URL=http://YOUR_VM_IP:3001
NEXT_PUBLIC_APP_URL=http://YOUR_VM_IP:3001

# Database (REQUIRED)
DB_PASSWORD=CHANGE_ME_secure_password
DATABASE_URL=postgresql://smile_user:CHANGE_ME_secure_password@db:5432/smile_new_db

# AI Services (at least one required for evaluation features)
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-sonnet-4-5-20250929

# OAuth (optional but recommended for production)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
EMAIL_FROM=

# Workers
DISABLE_WORKERS=false
ENVEOF
  echo -e "${GREEN}✅ Placeholder .env file created at $ENV_FILE${NC}"
  echo -e "${YELLOW}⚠️  IMPORTANT: Edit this file with your actual values!${NC}"
else
  echo -e "${GREEN}✅ .env file already exists at $ENV_FILE${NC}"
fi
echo ""

# ==============================================================================
# 11. Check Firewall (informational)
# ==============================================================================
echo -e "${BLUE}🔥 Firewall Information${NC}"
echo "   The following ports should be open in GCP Firewall:"
echo "   - 22    (SSH)"
echo "   - 3000  (Production app)"
echo "   - 3001  (Development app)"
echo "   - 3002  (PR testing - optional)"
echo ""
echo "   GCP Command to create firewall rule:"
echo -e "${CYAN}   gcloud compute firewall-rules create allow-smile-ports \\"
echo "     --allow tcp:22,tcp:3000,tcp:3001,tcp:3002 \\"
echo "     --source-ranges 0.0.0.0/0 \\"
echo -e "     --target-tags smile-server${NC}"
echo ""

# ==============================================================================
# OUTPUT: GitHub Secrets
# ==============================================================================
echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║                     GITHUB SECRETS - COPY THESE                      ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${GREEN}Add these secrets to your GitHub repository:${NC}"
echo "Repository → Settings → Secrets and variables → Actions → New repository secret"
echo ""

echo -e "${YELLOW}═══════════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}VM_HOST${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════════════════${NC}"
echo "$EXTERNAL_IP"
echo ""

echo -e "${YELLOW}═══════════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}VM_USERNAME${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════════════════${NC}"
echo "$(whoami)"
echo ""

echo -e "${YELLOW}═══════════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}SSH_PRIVATE_KEY${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════════════════${NC}"
cat "$SSH_KEY_PATH"
echo ""

echo -e "${YELLOW}═══════════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}PORT CONFIGURATION (Optional - defaults shown)${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════════════════${NC}"
echo "VM_PORT_MAIN=3000    # Port for main/production branch"
echo "VM_PORT_DEV=3001     # Port for develop branch"
echo "VM_PORT_PR=3002      # Port for PR branches"
echo ""

# ==============================================================================
# NEXT STEPS
# ==============================================================================
echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║                          NEXT STEPS                                  ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo "1. ${GREEN}Copy the secrets above to GitHub${NC}"
echo "   Repository → Settings → Secrets and variables → Actions"
echo ""
echo "2. ${GREEN}Edit the .env file${NC}"
echo "   nano $HOME/smile-next/.env"
echo ""
echo "3. ${GREEN}Ensure firewall ports are open${NC}"
echo "   Check GCP Console → VPC Network → Firewall"
echo ""
echo "4. ${GREEN}Test SSH connection (from your local machine)${NC}"
echo "   ssh -i path/to/private/key $(whoami)@$EXTERNAL_IP"
echo ""
echo "5. ${GREEN}Trigger the CI/CD pipeline${NC}"
echo "   Push to develop or main branch, or run workflow manually"
echo ""

echo -e "${GREEN}✅ VM Bootstrap Complete!${NC}"
echo ""

# If docker group was just added, remind user
if ! docker info &> /dev/null 2>&1; then
  echo -e "${YELLOW}═══════════════════════════════════════════════════════════════════════${NC}"
  echo -e "${YELLOW}⚠️  IMPORTANT: Log out and back in for docker group to take effect!${NC}"
  echo -e "${YELLOW}   Or run: newgrp docker${NC}"
  echo -e "${YELLOW}═══════════════════════════════════════════════════════════════════════${NC}"
fi
