#!/bin/bash
# SMILE Next.js - Blue Environment Deployment Script
# Usage: ./scripts/deploy-blue.sh
#
# This script deploys the latest code to the Blue (development) environment
# Run from /opt/smile/app on the EC2 server

set -e

echo "==========================================="
echo "  SMILE Next.js - Blue Environment Deploy"
echo "==========================================="

# Configuration
COMPOSE_FILE="docker-compose.blue.yml"
HEALTH_URL="https://smile-next-blue.seedsofempowerment.org/api/health"
MAX_RETRIES=30
RETRY_INTERVAL=2

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "$COMPOSE_FILE" ]; then
    print_error "docker-compose.blue.yml not found. Are you in /opt/smile/app?"
    exit 1
fi

# Check if .env.blue exists
if [ ! -f ".env.blue" ]; then
    print_error ".env.blue not found. Copy .env.blue.example and configure it."
    exit 1
fi

# Step 1: Pull latest code
print_status "Pulling latest code from GitHub..."
git pull origin main

# Step 2: Build and restart containers
print_status "Building Blue environment..."
docker compose -f "$COMPOSE_FILE" build app-blue

print_status "Starting Blue environment..."
docker compose -f "$COMPOSE_FILE" up -d

# Step 3: Wait for database to be ready
print_status "Waiting for database..."
sleep 5

# Step 4: Run Prisma migrations if needed
print_status "Running Prisma migrations..."
docker compose -f "$COMPOSE_FILE" exec -T app-blue npx prisma db push --accept-data-loss || true

# Step 5: Health check
print_status "Running health check..."
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -sf "$HEALTH_URL" > /dev/null 2>&1; then
        print_status "Health check passed!"
        break
    fi

    RETRY_COUNT=$((RETRY_COUNT + 1))
    print_warning "Health check attempt $RETRY_COUNT/$MAX_RETRIES failed. Retrying in ${RETRY_INTERVAL}s..."
    sleep $RETRY_INTERVAL
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    print_error "Health check failed after $MAX_RETRIES attempts"
    print_status "Showing container logs..."
    docker compose -f "$COMPOSE_FILE" logs --tail=50 app-blue
    exit 1
fi

# Step 6: Show status
print_status "Deployment complete!"
echo ""
echo "==========================================="
echo "  Blue Environment Status"
echo "==========================================="
docker compose -f "$COMPOSE_FILE" ps
echo ""
echo "URL: https://smile-next-blue.seedsofempowerment.org"
echo ""
print_status "View logs with: docker compose -f $COMPOSE_FILE logs -f --tail=50 app-blue"
