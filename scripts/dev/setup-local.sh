#!/bin/bash
# =============================================================================
# Local Development Setup Script
# =============================================================================
# This script sets up everything needed for local development:
# 1. Starts Docker containers (PostgreSQL + Redis)
# 2. Waits for database to be ready
# 3. Runs Prisma migrations/push
# 4. Seeds the database with test data
#
# Usage: ./scripts/dev/setup-local.sh [--reset]
#   --reset  Drops and recreates the database (WARNING: deletes all data)
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.local.yml"
DB_CONTAINER="smile-postgres-local"
MAX_RETRIES=30
RETRY_INTERVAL=2

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║           SMILE Local Development Setup                       ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check for --reset flag
RESET_DB=false
if [ "$1" == "--reset" ]; then
    RESET_DB=true
    echo -e "${YELLOW}⚠️  Reset mode: Database will be dropped and recreated${NC}"
fi

# -----------------------------------------------------------------------------
# Step 1: Check prerequisites
# -----------------------------------------------------------------------------
echo -e "\n${BLUE}[1/6] Checking prerequisites...${NC}"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker daemon is not running. Please start Docker.${NC}"
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 20+.${NC}"
    exit 1
fi

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Prerequisites OK${NC}"

# -----------------------------------------------------------------------------
# Step 2: Check environment file
# -----------------------------------------------------------------------------
echo -e "\n${BLUE}[2/6] Checking environment configuration...${NC}"

if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  .env.local not found. Creating from template...${NC}"
    
    if [ -f ".env.example" ]; then
        cp .env.example .env.local
        
        # Generate AUTH_SECRET
        AUTH_SECRET=$(openssl rand -base64 32)
        
        # Update the file (macOS compatible sed)
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|generate-with-openssl-rand-base64-32|${AUTH_SECRET}|g" .env.local
            sed -i '' "s|same-as-AUTH_SECRET-above|${AUTH_SECRET}|g" .env.local
        else
            sed -i "s|generate-with-openssl-rand-base64-32|${AUTH_SECRET}|g" .env.local
            sed -i "s|same-as-AUTH_SECRET-above|${AUTH_SECRET}|g" .env.local
        fi
        
        echo -e "${GREEN}✓ Created .env.local with generated AUTH_SECRET${NC}"
    else
        echo -e "${RED}❌ .env.example not found. Cannot create .env.local${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ .env.local exists${NC}"
fi

# -----------------------------------------------------------------------------
# Step 3: Start Docker containers
# -----------------------------------------------------------------------------
echo -e "\n${BLUE}[3/6] Starting Docker containers...${NC}"

# Check if compose file exists
if [ ! -f "$COMPOSE_FILE" ]; then
    echo -e "${RED}❌ $COMPOSE_FILE not found${NC}"
    exit 1
fi

# Stop existing containers if resetting
if [ "$RESET_DB" = true ]; then
    echo -e "${YELLOW}Stopping and removing existing containers...${NC}"
    docker-compose -f "$COMPOSE_FILE" down -v 2>/dev/null || true
fi

# Start containers
docker-compose -f "$COMPOSE_FILE" up -d

echo -e "${GREEN}✓ Docker containers started${NC}"

# -----------------------------------------------------------------------------
# Step 4: Wait for database to be ready
# -----------------------------------------------------------------------------
echo -e "\n${BLUE}[4/6] Waiting for database to be ready...${NC}"

retry_count=0
while [ $retry_count -lt $MAX_RETRIES ]; do
    if docker exec $DB_CONTAINER pg_isready -U smile_user -d smile_new_db &> /dev/null; then
        echo -e "${GREEN}✓ Database is ready${NC}"
        break
    fi
    
    retry_count=$((retry_count + 1))
    echo -e "  Waiting for database... (attempt $retry_count/$MAX_RETRIES)"
    sleep $RETRY_INTERVAL
done

if [ $retry_count -eq $MAX_RETRIES ]; then
    echo -e "${RED}❌ Database failed to start after $MAX_RETRIES attempts${NC}"
    exit 1
fi

# -----------------------------------------------------------------------------
# Step 5: Run Prisma setup
# -----------------------------------------------------------------------------
echo -e "\n${BLUE}[5/6] Setting up database schema...${NC}"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing npm dependencies..."
    npm install
fi

# Create .env symlink for Prisma (Prisma doesn't read .env.local)
if [ -f ".env.local" ] && [ ! -f ".env" ]; then
    echo "Creating .env symlink for Prisma..."
    ln -sf .env.local .env
fi

# Generate Prisma client
echo "Generating Prisma client..."
npm run db:generate

# Push schema to database
if [ "$RESET_DB" = true ]; then
    echo "Resetting database schema..."
    npx prisma db push --force-reset --skip-generate
else
    echo "Syncing database schema..."
    npm run db:push
fi

echo -e "${GREEN}✓ Database schema ready${NC}"

# -----------------------------------------------------------------------------
# Step 6: Seed database
# -----------------------------------------------------------------------------
echo -e "\n${BLUE}[6/6] Seeding database with test data...${NC}"

npm run db:seed

echo -e "${GREEN}✓ Database seeded${NC}"

# -----------------------------------------------------------------------------
# Done!
# -----------------------------------------------------------------------------
echo -e "\n${GREEN}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    Setup Complete! 🎉                         ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "Next steps:"
echo -e "  ${BLUE}1.${NC} Start the development server:"
echo -e "     ${YELLOW}DISABLE_WORKERS=true npm run dev${NC}"
echo ""
echo -e "  ${BLUE}2.${NC} Open in browser:"
echo -e "     ${YELLOW}http://localhost:3000${NC}"
echo ""
echo -e "  ${BLUE}3.${NC} Login with test accounts:"
echo -e "     Email: ${YELLOW}teacher1@smile.test${NC}"
echo -e "     Password: ${YELLOW}Test1234!${NC}"
echo ""
echo -e "  ${BLUE}4.${NC} View database:"
echo -e "     ${YELLOW}npm run db:studio${NC}"
echo ""
echo -e "Other useful commands:"
echo -e "  ${YELLOW}./scripts/dev/reset-db.sh${NC}  - Reset database with fresh data"
echo -e "  ${YELLOW}docker-compose -f docker-compose.local.yml logs -f${NC}  - View container logs"
echo -e "  ${YELLOW}docker-compose -f docker-compose.local.yml down${NC}  - Stop containers"
