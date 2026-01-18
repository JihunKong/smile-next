#!/bin/bash
# =============================================================================
# GCP dev-blue Deployment Script
# =============================================================================
# Deploys Next.js Docker container with host network mode
# Prerequisite: PostgreSQL and Redis running on host

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}  SMILE Next.js - GCP Deployment${NC}"
echo -e "${GREEN}=========================================${NC}"

# Configuration
CONTAINER_NAME="smile-next"
IMAGE_NAME="smile-next:dev"
ENV_FILE=".env.docker.gcp"
COMPOSE_FILE="docker-compose.gcp.yml"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Must run from smile-next directory${NC}"
    exit 1
fi

# Check if env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}Error: $ENV_FILE not found${NC}"
    echo "Please copy .env.docker.gcp.example to $ENV_FILE and configure it"
    exit 1
fi

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

# Check PostgreSQL
if pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PostgreSQL is running${NC}"
else
    echo -e "${RED}✗ PostgreSQL is not running on localhost:5432${NC}"
    exit 1
fi

# Check Redis
if redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Redis is running${NC}"
else
    echo -e "${RED}✗ Redis is not running on localhost:6379${NC}"
    exit 1
fi

# Check if smile_next_db exists
if psql -h localhost -U smile_user -d smile_next_db -c '\q' 2>/dev/null; then
    echo -e "${GREEN}✓ Database smile_next_db exists${NC}"
else
    echo -e "${YELLOW}! Database smile_next_db not found. Creating...${NC}"
    createdb -h localhost -U smile_user smile_next_db
fi

# Stop existing container if running
echo -e "${YELLOW}Stopping existing container...${NC}"
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

# Build or pull image
echo -e "${YELLOW}Building Docker image...${NC}"
if [ "$1" == "--no-build" ]; then
    echo "Skipping build (using existing image)"
else
    docker build -t $IMAGE_NAME .
fi

# Deploy with docker compose
echo -e "${YELLOW}Starting container with host network mode...${NC}"
docker compose -f $COMPOSE_FILE --env-file $ENV_FILE up -d

# Wait for container to be ready
echo -e "${YELLOW}Waiting for container to be ready...${NC}"
sleep 5

# Check container status
if docker ps | grep -q $CONTAINER_NAME; then
    echo -e "${GREEN}=========================================${NC}"
    echo -e "${GREEN}  Deployment Successful!${NC}"
    echo -e "${GREEN}=========================================${NC}"
    echo ""
    echo -e "Container: ${GREEN}$CONTAINER_NAME${NC}"
    echo -e "Port: ${GREEN}5002${NC} (host network mode)"
    echo -e "URL: ${GREEN}https://newsmile-dev-blue.seedsofempowerment.org${NC}"
    echo ""
    echo "Useful commands:"
    echo "  docker logs -f $CONTAINER_NAME    # View logs"
    echo "  docker stop $CONTAINER_NAME       # Stop container"
    echo "  docker restart $CONTAINER_NAME    # Restart container"
else
    echo -e "${RED}=========================================${NC}"
    echo -e "${RED}  Deployment Failed!${NC}"
    echo -e "${RED}=========================================${NC}"
    echo ""
    echo "Check logs with: docker logs $CONTAINER_NAME"
    exit 1
fi
