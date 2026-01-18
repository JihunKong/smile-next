#!/bin/bash
# Update application deployment
# Usage: update-app.sh <environment> <docker-tag> <image-name> <container-name> <port>
#
# This script handles:
# 1. Finding project directory
# 2. Validating environment
# 3. Pulling Docker image
# 4. Stopping existing containers
# 5. Starting services via docker-compose
# 6. Verifying deployment

set -e

ENVIRONMENT="${1:-dev}"
DOCKER_TAG="${2}"
IMAGE_NAME="${3}"
CONTAINER_NAME="${4}"
PORT="${5}"

if [ -z "$DOCKER_TAG" ] || [ -z "$IMAGE_NAME" ] || [ -z "$CONTAINER_NAME" ] || [ -z "$PORT" ]; then
  echo "ERROR: Missing required arguments"
  echo "Usage: update-app.sh <environment> <docker-tag> <image-name> <container-name> <port>"
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

# Select docker-compose file based on environment
if [ "$ENVIRONMENT" == "dev" ]; then
  COMPOSE_FILE="docker-compose.dev.yml"
  echo "📋 Using docker-compose.dev.yml (includes PostgreSQL + Redis)"
else
  COMPOSE_FILE="docker-compose.prod.yml"
  echo "📋 Using docker-compose.prod.yml (Redis only, uses GCP Cloud SQL)"
fi

# Verify docker-compose file exists
if [ ! -f "$COMPOSE_FILE" ]; then
  echo "❌ ERROR: $COMPOSE_FILE not found in $PROJECT_DIR"
  exit 1
fi

# Validate environment configuration
echo "🔍 Validating environment configuration..."
bash scripts/deploy/validate-env.sh "$ENVIRONMENT" || {
  echo "❌ Environment validation failed"
  exit 1
}

# Log in to GHCR (if credentials are available)
if [ -n "$GHCR_PAT" ] && [ -n "$GHCR_USERNAME" ]; then
  echo "🔐 Logging in to GitHub Container Registry..."
  echo "$GHCR_PAT" | docker login ghcr.io -u "$GHCR_USERNAME" --password-stdin || {
    echo "⚠️  Warning: Failed to login to GHCR (may need credentials)"
  }
elif [ -n "$GHCR_PAT" ]; then
  # Try with default username if only PAT is provided
  echo "🔐 Logging in to GitHub Container Registry (using default username)..."
  echo "$GHCR_PAT" | docker login ghcr.io -u "tedahn-pknic" --password-stdin || {
    echo "⚠️  Warning: Failed to login to GHCR"
  }
else
  echo "ℹ️  Skipping GHCR login (credentials not provided)"
fi

# Pull the image
IMAGE_TAG="$IMAGE_NAME:$DOCKER_TAG"
echo "📥 Pulling Docker image: $IMAGE_TAG"
docker pull "$IMAGE_TAG" || {
  echo "❌ Failed to pull image: $IMAGE_TAG"
  exit 1
}

# Tag the image for docker-compose
docker tag "$IMAGE_TAG" "$IMAGE_NAME:latest" || true

# Set environment variables for docker-compose
export DOCKER_IMAGE="$IMAGE_TAG"
export PORT="$PORT"
export CONTAINER_NAME="$CONTAINER_NAME"

# Ensure volumes exist (idempotent - won't recreate if they exist)
echo "📦 Ensuring volumes exist (data will be preserved)..."
docker volume create app_redis_data 2>/dev/null || echo "✅ Volume app_redis_data already exists (data preserved)"

# For dev environment, also ensure PostgreSQL volume exists
if [ "$ENVIRONMENT" == "dev" ]; then
  docker volume create app_postgres_data 2>/dev/null || echo "✅ Volume app_postgres_data already exists (data preserved)"
fi

# Stop existing standalone containers FIRST to avoid conflicts
# Then start them via docker-compose (using same volumes - data preserved)
echo "🛑 Stopping existing standalone containers (will restart via docker-compose)..."

# Stop app container
if docker ps -a | grep -q "$CONTAINER_NAME"; then
  echo "   Stopping $CONTAINER_NAME..."
  docker stop "$CONTAINER_NAME" 2>/dev/null || true
  docker rm "$CONTAINER_NAME" 2>/dev/null || true
fi

# For dev: Stop standalone postgres/redis if they exist (will be managed by docker-compose)
if [ "$ENVIRONMENT" == "dev" ]; then
  if docker ps -a | grep -q "smile-postgres"; then
    echo "   Stopping standalone smile-postgres (will restart via docker-compose with same volume)..."
    docker stop smile-postgres 2>/dev/null || true
    docker rm smile-postgres 2>/dev/null || true
  fi
fi

if docker ps -a | grep -q "smile-redis"; then
  echo "   Stopping standalone smile-redis (will restart via docker-compose with same volume)..."
  docker stop smile-redis 2>/dev/null || true
  docker rm smile-redis 2>/dev/null || true
fi

# Now start all services via docker-compose (using existing volumes - data preserved)
echo "🚀 Starting all services with docker-compose (using existing volumes - data preserved)..."
if [ "$ENVIRONMENT" == "dev" ]; then
  # Dev: Start db, redis, and app
  docker compose -f "$COMPOSE_FILE" up -d || {
    echo "❌ Failed to start services"
    exit 1
  }
  
  # Wait for dependencies to be healthy
  echo "⏳ Waiting for dependencies to be healthy..."
  sleep 5
  
  # Verify PostgreSQL is ready (dev only)
  for i in {1..20}; do
    if docker exec smile-postgres pg_isready -U smile_user -d smile_db > /dev/null 2>&1; then
      echo "✅ PostgreSQL is ready (data preserved from volume)"
      break
    fi
    if [ $i -eq 20 ]; then
      echo "⚠️  PostgreSQL health check timeout (may still be starting)"
    fi
    sleep 1
  done
else
  # Prod: Start redis and app (uses GCP Cloud SQL)
  docker compose -f "$COMPOSE_FILE" up -d || {
    echo "❌ Failed to start services"
    exit 1
  }
  echo "⏳ Waiting for Redis to be ready..."
  sleep 3
fi

# Verify Redis is ready
for i in {1..10}; do
  if docker exec smile-redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis is ready (data preserved from volume)"
    break
  fi
  if [ $i -eq 10 ]; then
    echo "⚠️  Redis health check timeout (may still be starting)"
  fi
  sleep 1
done

# Load environment variables from .env file
ENV_FILE="$PROJECT_DIR/.env"
if [ ! -f "$ENV_FILE" ]; then
  ENV_FILE="/opt/smile-next/.env"
fi

if [ -f "$ENV_FILE" ]; then
  set -a
  source "$ENV_FILE"
  set +a
fi

export DOCKER_IMAGE="$IMAGE_TAG"
export CONTAINER_NAME="$CONTAINER_NAME"
export PORT="$PORT"

# Recreate app container with new image
echo "🔄 Ensuring app container uses latest image..."
docker compose -f "$COMPOSE_FILE" up -d --force-recreate app || {
  echo "❌ Failed to recreate app container"
  exit 1
}

# Use systemd service to manage the entire stack (if available)
SERVICE_NAME="smile-next-${ENVIRONMENT}"
if systemctl list-unit-files | grep -q "^${SERVICE_NAME}.service"; then
  echo "🔄 Reloading systemd service to ensure all containers are managed..."
  sudo systemctl daemon-reload || true
  # Restart the service to ensure all containers (db, redis, app) are running
  sudo systemctl restart "$SERVICE_NAME" || {
    echo "⚠️  Warning: Failed to restart systemd service, but containers are running"
  }
  echo "✅ Systemd service $SERVICE_NAME reloaded - now managing all containers"
else
  echo "ℹ️  Systemd service not found, containers managed directly by docker-compose"
  echo "💡 Consider running: bash scripts/deploy/setup-systemd-service.sh $ENVIRONMENT $COMPOSE_FILE $SERVICE_NAME"
fi

# Clean up old images
echo "🧹 Cleaning up old Docker images..."
docker image prune -af --filter "until=24h" || echo "Image cleanup completed with warnings"

echo ""
echo "✅ Deployment update completed successfully!"
