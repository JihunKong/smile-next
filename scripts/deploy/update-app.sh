#!/bin/bash
# Update application deployment - Declarative Docker Compose approach
# Usage: update-app.sh <environment> <docker-tag> <image-name> <container-name> <port>
#
# This script handles deployment using a purely declarative docker-compose approach:
# 1. Finding project directory
# 2. Validating environment
# 3. Logging into GHCR and pulling the image
# 4. Running docker-compose up with --force-recreate (no manual container stopping)
# 5. Verifying deployment

set -e

ENVIRONMENT="${1:-dev}"
DOCKER_TAG="${2}"
IMAGE_NAME="${3}"
CONTAINER_NAME="${4}"
PORT="${5}"

# Set default port based on environment if not provided
if [ -z "$PORT" ]; then
  case "$ENVIRONMENT" in
    prod)
      PORT="${VM_PORT_MAIN:-3001}"
      ;;
    qa)
      PORT="${VM_PORT_MAIN:-3001}"
      ;;
    dev|*)
      PORT="${VM_PORT_DEV:-3002}"
      ;;
  esac
  echo "⚠️  Port not provided, using default for $ENVIRONMENT: $PORT"
fi

if [ -z "$DOCKER_TAG" ] || [ -z "$IMAGE_NAME" ] || [ -z "$CONTAINER_NAME" ] || [ -z "$PORT" ]; then
  echo "ERROR: Missing required arguments"
  echo "Usage: update-app.sh <environment> <docker-tag> <image-name> <container-name> <port>"
  echo ""
  echo "Received arguments:"
  echo "  ENVIRONMENT: ${ENVIRONMENT:-'(empty)'}"
  echo "  DOCKER_TAG: ${DOCKER_TAG:-'(empty)'}"
  echo "  IMAGE_NAME: ${IMAGE_NAME:-'(empty)'}"
  echo "  CONTAINER_NAME: ${CONTAINER_NAME:-'(empty)'}"
  echo "  PORT: ${PORT:-'(empty)'}"
  exit 1
fi

echo "🚀 Starting deployment update..."
echo "   Environment: $ENVIRONMENT"
echo "   Image: $IMAGE_NAME:$DOCKER_TAG"
echo "   Container: $CONTAINER_NAME"
echo "   Port: $PORT"
echo ""

# Find project directory (check multiple locations)
PROJECT_DIR=""
for dir in "$HOME/smile-next" "/opt/smile-next" "/opt/smile/app"; do
  if [ -d "$dir" ]; then
    PROJECT_DIR="$dir"
    break
  fi
done

if [ -z "$PROJECT_DIR" ]; then
  echo "❌ ERROR: Could not find project directory"
  exit 1
fi

cd "$PROJECT_DIR" || { echo "ERROR: Cannot cd to $PROJECT_DIR"; exit 1; }
echo "📁 Using project directory: $PROJECT_DIR"

# Select docker-compose files based on environment
if [ "$ENVIRONMENT" == "dev" ]; then
  COMPOSE_FILE_APP="docker-compose.dev.yml"
  COMPOSE_FILE_INFRA="docker-compose.infra.dev.yml"
  export DB_NAME="smile_dev_db"
  echo "📋 Using Dev Stack:"
  echo "   - App:   $COMPOSE_FILE_APP"
  echo "   - Infra: $COMPOSE_FILE_INFRA"
elif [ "$ENVIRONMENT" == "qa" ]; then
  COMPOSE_FILE_APP="docker-compose.qa.yml"
  COMPOSE_FILE_INFRA="docker-compose.infra.dev.yml"
  export DB_NAME="smile_qa_db"
  echo "📋 Using QA Stack (Shared Infra):"
  echo "   - App:   $COMPOSE_FILE_APP"
  echo "   - Infra: $COMPOSE_FILE_INFRA"
else
  echo "❌ Unknown environment: $ENVIRONMENT"
  exit 1
fi

# Verify docker-compose files exist
if [ ! -f "$COMPOSE_FILE_APP" ] || [ ! -f "$COMPOSE_FILE_INFRA" ]; then
  echo "❌ ERROR: Deployment files not found!"
  echo "   Checked: $COMPOSE_FILE_APP and $COMPOSE_FILE_INFRA"
  exit 1
fi

# Validate environment configuration
echo "🔍 Validating environment configuration..."
bash scripts/deploy/validate-env.sh "$ENVIRONMENT" || {
  echo "❌ Environment validation failed"
  exit 1
}

# Load environment variables
ENV_FILE="$PROJECT_DIR/.env"
[ -f "/opt/smile-next/.env" ] && ENV_FILE="/opt/smile-next/.env"

if [ -f "$ENV_FILE" ]; then
  set -a
  source "$ENV_FILE"
  set +a
  echo "✅ Environment variables loaded from $ENV_FILE"
fi

# ------------------------------------------------------------------------------
# GHCR LOGIN AND IMAGE PULL
# ------------------------------------------------------------------------------
GHCR_USER="${GHCR_USERNAME:-seeds-smile-the-ultimate}"

# Determine which token to use
GHCR_TOKEN=""
if [ -n "$GITHUB_TOKEN" ]; then
  GHCR_TOKEN="$GITHUB_TOKEN"
  echo "🔐 Using GITHUB_TOKEN for GHCR authentication"
elif [ -n "$GHCR_PAT" ]; then
  GHCR_TOKEN="$GHCR_PAT"
  echo "🔐 Using GitHub App token for GHCR authentication"
else
  echo "ℹ️  No GHCR credentials provided, attempting to pull image..."
fi

if [ -n "$GHCR_TOKEN" ]; then
  echo "   Username: $GHCR_USER"
  echo "   Registry: ghcr.io"
  
  # Login with retry logic
  MAX_LOGIN_RETRIES=3
  LOGIN_RETRY=0
  LOGIN_SUCCESS=false
  
  while [ $LOGIN_RETRY -lt $MAX_LOGIN_RETRIES ]; do
    if echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin 2>&1; then
      LOGIN_SUCCESS=true
      echo "✅ Successfully logged in to GHCR"
      break
    else
      LOGIN_RETRY=$((LOGIN_RETRY + 1))
      if [ $LOGIN_RETRY -lt $MAX_LOGIN_RETRIES ]; then
        echo "⚠️  Login attempt $LOGIN_RETRY failed, retrying in 2 seconds..."
        sleep 2
      fi
    fi
  done
  
  if [ "$LOGIN_SUCCESS" = false ]; then
    echo "❌ Failed to login to GHCR after $MAX_LOGIN_RETRIES attempts"
    echo "   Continuing anyway - image may still be cached or public..."
  fi
fi

# Pull the image with retry logic
IMAGE_TAG="$IMAGE_NAME:$DOCKER_TAG"
echo "📥 Pulling Docker image: $IMAGE_TAG"

MAX_PULL_RETRIES=3
PULL_RETRY=0
PULL_SUCCESS=false

while [ $PULL_RETRY -lt $MAX_PULL_RETRIES ]; do
  if docker pull "$IMAGE_TAG" 2>&1; then
    PULL_SUCCESS=true
    echo "✅ Successfully pulled image: $IMAGE_TAG"
    break
  else
    PULL_RETRY=$((PULL_RETRY + 1))
    if [ $PULL_RETRY -lt $MAX_PULL_RETRIES ]; then
      echo "⚠️  Pull attempt $PULL_RETRY failed, retrying in 5 seconds..."
      sleep 5
    fi
  fi
done

if [ "$PULL_SUCCESS" = false ]; then
  echo "❌ Failed to pull image after $MAX_PULL_RETRIES attempts: $IMAGE_TAG"
  exit 1
fi

# Tag the image for docker-compose
docker tag "$IMAGE_TAG" "$IMAGE_NAME:latest" || true

# ------------------------------------------------------------------------------
# SET ENVIRONMENT VARIABLES FOR DOCKER-COMPOSE
# ------------------------------------------------------------------------------
export DOCKER_IMAGE="$IMAGE_TAG"
export PORT="$PORT"
export CONTAINER_NAME="$CONTAINER_NAME"

# Compose project name - unique per environment to avoid conflicts
COMPOSE_PROJECT="smile-${ENVIRONMENT}"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 DEPLOYING WITH DOCKER COMPOSE (Declarative)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   Project: $COMPOSE_PROJECT"
echo "   Files:   $COMPOSE_FILE_INFRA + $COMPOSE_FILE_APP"
echo "   Image:   $IMAGE_TAG"
echo ""

# ------------------------------------------------------------------------------
# ONE-TIME MIGRATION: Clean up orphaned containers from old deployment approach
# This runs only if old-style containers exist outside of compose management
# ------------------------------------------------------------------------------
OLD_CONTAINERS=$(docker ps -a --format '{{.Names}}' | grep -E '^smile-(postgres|redis|next|app)' | grep -v "^$COMPOSE_PROJECT" || true)
if [ -n "$OLD_CONTAINERS" ]; then
  echo "🧹 Cleaning up old containers from previous deployment approach..."
  echo "$OLD_CONTAINERS" | xargs -r docker stop 2>/dev/null || true
  echo "$OLD_CONTAINERS" | xargs -r docker rm 2>/dev/null || true
  echo "   Cleaned up: $(echo "$OLD_CONTAINERS" | tr '\n' ' ')"
fi

# Remove old networks if they exist (from before compose-managed networks)
OLD_NETWORK=$(docker network ls --format "{{.Name}}" | grep -E "^smile-next_smile-network$" || true)
if [ -n "$OLD_NETWORK" ]; then
  echo "🧹 Removing old network: $OLD_NETWORK"
  docker network rm "$OLD_NETWORK" 2>/dev/null || true
fi

# ------------------------------------------------------------------------------
# DEPLOY: Single declarative docker-compose command
# ------------------------------------------------------------------------------
echo "🚀 Starting deployment..."
docker compose -p "$COMPOSE_PROJECT" \
  -f "$COMPOSE_FILE_INFRA" \
  -f "$COMPOSE_FILE_APP" \
  up -d --force-recreate --remove-orphans || {
    echo "❌ Failed to deploy with docker-compose"
    echo ""
    echo "📋 Debug: Container status:"
    docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | head -20
    exit 1
  }

echo "✅ Docker compose deployment complete"

# ------------------------------------------------------------------------------
# POST-DEPLOYMENT: Wait for services and initialize database
# ------------------------------------------------------------------------------
echo ""
echo "⏳ Waiting for services to be ready..."

# Wait for PostgreSQL (shared by dev/QA)
echo "   Checking PostgreSQL..."
MAX_RETRIES=30
RETRY=0
while [ $RETRY -lt $MAX_RETRIES ]; do
  if docker exec smile-postgres pg_isready -U smile_user >/dev/null 2>&1; then
    echo "   ✅ PostgreSQL is ready"
    break
  fi
  RETRY=$((RETRY + 1))
  sleep 1
done

if [ $RETRY -eq $MAX_RETRIES ]; then
  echo "   ⚠️ PostgreSQL timed out but proceeding..."
fi

# Ensure environment-specific database exists
if [ "$ENVIRONMENT" == "dev" ] || [ "$ENVIRONMENT" == "qa" ]; then
  docker exec smile-postgres psql -U smile_user -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || {
    echo "📦 Creating database '$DB_NAME'..."
    docker exec smile-postgres psql -U smile_user -d postgres -c "CREATE DATABASE \"$DB_NAME\";"
  }
  
  # Ensure DB password compatibility
  docker exec smile-postgres psql -U smile_user -d postgres -c "ALTER USER smile_user PASSWORD '${DB_PASSWORD:-simple_pass}';" >/dev/null 2>&1 || true
fi

# Check Redis
echo "   Checking Redis..."
for i in {1..10}; do
  if docker exec smile-redis redis-cli ping > /dev/null 2>&1; then
    echo "   ✅ Redis is ready"
    break
  fi
  if [ $i -eq 10 ]; then
    echo "   ⚠️ Redis timeout (may still be starting)"
  fi
  sleep 1
done

# Wait for app container
echo "   Checking App..."
sleep 3
if docker ps --format "{{.Names}}" | grep -q "$CONTAINER_NAME"; then
  echo "   ✅ App container is running"
else
  echo "   ⚠️ App container may not be running yet"
fi

# Run Prisma migrations
echo ""
echo "📦 Updating database schema..."
docker exec "$CONTAINER_NAME" npm run db:push -- --accept-data-loss 2>&1 || {
  echo "⚠️ Prisma push had issues (check logs)"
}

# Clean up old images
echo ""
echo "🧹 Cleaning up old Docker images..."
docker image prune -af --filter "until=24h" 2>/dev/null || echo "   Image cleanup completed"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ DEPLOYMENT COMPLETE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Running containers:"
docker compose -p "$COMPOSE_PROJECT" ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
