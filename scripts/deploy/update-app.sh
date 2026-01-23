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

# Set default port based on environment if not provided
if [ -z "$PORT" ]; then
  case "$ENVIRONMENT" in
    prod)
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
# Select docker-compose files based on environment
if [ "$ENVIRONMENT" == "dev" ]; then
  COMPILE_FILE_APP="docker-compose.dev.yml"
  COMPILE_FILE_INFRA="docker-compose.infra.dev.yml"
  echo "📋 Using Dev Stack:"
  echo "   - App:   $COMPILE_FILE_APP"
  echo "   - Infra: $COMPILE_FILE_INFRA (PostgreSQL + Redis)"
elif [ "$ENVIRONMENT" == "qa" ]; then
  COMPILE_FILE_APP="docker-compose.qa.yml"
  # QA shares the same infrastructure (PostgreSQL + Redis) as Dev
  COMPILE_FILE_INFRA="docker-compose.infra.dev.yml"
  echo "📋 Using QA Stack (Shared Infra):"
  echo "   - App:   $COMPILE_FILE_APP"
  echo "   - Infra: $COMPILE_FILE_INFRA (PostgreSQL + Redis)"
else
  # Fallback or Prod (if needed later)
  echo "❌ Unknown environment: $ENVIRONMENT"
  exit 1
fi

# Verify docker-compose files exist
if [ ! -f "$COMPILE_FILE_APP" ] || [ ! -f "$COMPILE_FILE_INFRA" ]; then
  echo "❌ ERROR: Deployment files not found!"
  echo "   Checked: $COMPILE_FILE_APP and $COMPILE_FILE_INFRA"
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

# ... [Login & Pull logic usually goes here, preserving surrounding code] ...
# (Assuming Login/Pull is handled above this block or I need to preserve it.
#  The tool `replace_file_content` replaces a block. I must ensure I don't delete the Login logic if it was OUTSIDE my TargetContent range.
#  Looking at original file, Login/Pull is lines 107-200.
#  My TargetContent below starts at line 73.
#  Wait, I should carefully exclude the Login/Pull logic from replacement if I want to keep it simple,
#  OR re-include it.
#  Actually, the simpler 'structure' logic (Choosing files) was at lines 71-80.
#  The 'Deployment' logic was at lines 316-500.
#  I should do TWO replacements or one massive one.
#  Let's do the Deployment Logic replacement first (Lines 316-500).
#  I'll handle the File Selection separately or just hardcode it in the Deployment part if I can't reach the top variables easily?
#  No, variables are set early.
#  Let's replace the whole file content related to execution.

# Let's stick to replacing the logic after "Ensure network" (Line 217).

# ---------------------------------------------------------
# REPLACEMENT STRATEGY
# ---------------------------------------------------------
# The previous `update-app.sh` had a lot of complex logic.
# I want to replace the "Main Logic" starting from line 71 (File Selection) down to line 500.
# But that includes the "Pull Image" logic (107-197) which I want to KEEP.
# So I will do 2 edits.
# Edit 1: File Selection (Lines 71-80)
# Edit 2: The execution logic (Lines 240-500)
# ---------------------------------------------------------

# EDIT 1: File Selection
# ---------------------------------------------------------



# Log in to GHCR (if credentials are available)
# Use the same approach as build workflow: prefer GITHUB_TOKEN, fallback to GitHub App token
GHCR_USER="${GHCR_USERNAME:-seeds-smile-the-ultimate}"

# Determine which token to use (match build workflow: prefer GITHUB_TOKEN)
GHCR_TOKEN=""
if [ -n "$GITHUB_TOKEN" ]; then
  GHCR_TOKEN="$GITHUB_TOKEN"
  echo "🔐 Using GITHUB_TOKEN for GHCR authentication (same as build workflow)"
elif [ -n "$GHCR_PAT" ]; then
  GHCR_TOKEN="$GHCR_PAT"
  echo "🔐 Using GitHub App token for GHCR authentication (fallback)"
else
  echo "ℹ️  No GHCR credentials provided, attempting to pull image (may work if image is public)..."
fi

if [ -n "$GHCR_TOKEN" ]; then
  echo "   Username: $GHCR_USER"
  echo "   Registry: ghcr.io"
  echo "   Image: $IMAGE_NAME:$DOCKER_TAG"
  
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
    if [ -n "$GITHUB_TOKEN" ]; then
      echo "   Using GITHUB_TOKEN - this may indicate:"
      echo "   1. Workflow doesn't have 'packages: read' permission"
      echo "   2. Organization workflow permissions not enabled"
    else
      echo "   Using GitHub App token - this may indicate:"
      echo "   1. GitHub App token doesn't have 'read:packages' permission"
      echo "   2. Token has expired or is invalid"
      echo "   3. Username format is incorrect"
    fi
    echo "   Checking if image is publicly accessible..."
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
  echo ""
  echo "Troubleshooting steps:"
  echo "1. Verify the GitHub App has 'read:packages' permission:"
  echo "   https://github.com/settings/apps"
  echo "2. Check that the installation has accepted updated permissions:"
  echo "   https://github.com/settings/installations"
  echo "3. Verify the package exists and is accessible:"
  echo "   https://github.com/orgs/seeds-smile-the-ultimate/packages/container/smile-web"
  echo "4. Ensure the token was generated correctly (check workflow logs)"
  exit 1
fi

# Tag the image for docker-compose
docker tag "$IMAGE_TAG" "$IMAGE_NAME:latest" || true

# Set database name based on environment (dev and QA use different databases in same PostgreSQL instance)
if [ "$ENVIRONMENT" == "dev" ]; then
  export DB_NAME="smile_dev_db"
elif [ "$ENVIRONMENT" == "qa" ]; then
  export DB_NAME="smile_qa_db"
else
  # For prod, use default (or set from env)
  export DB_NAME="${DB_NAME:-smile_new_db}"
fi

# Set environment variables for docker-compose
export DOCKER_IMAGE="$IMAGE_TAG"
export PORT="$PORT"
export CONTAINER_NAME="$CONTAINER_NAME"

# Ensure network exists (required for container communication)
# Docker-compose will create/use 'smile-network' (explicit name in compose file)
echo "🌐 Ensuring Docker network exists..."
# Create the network with explicit name (docker-compose will use it)
docker network create smile-network 2>/dev/null && echo "✅ Created network: smile-network" || echo "✅ Network smile-network already exists"
NETWORK_NAME="smile-network"

# If old prefixed network exists, we'll migrate containers to the new network
OLD_NETWORK=$(docker network ls --format "{{.Name}}" | grep -E "^smile-next_smile-network$" || true)
if [ -n "$OLD_NETWORK" ] && [ "$OLD_NETWORK" != "$NETWORK_NAME" ]; then
  echo "ℹ️  Found old network: $OLD_NETWORK (containers will be migrated to $NETWORK_NAME on next recreate)"
fi

# Ensure shared services are connected to the network
# This fixes connectivity issues if containers were created before the network was added
# or if they were started manually without the network
echo "🌐 Checking shared service network connectivity..."
for SHARED_CONTAINER in "smile-postgres" "smile-redis"; do
  if docker ps -a --format "{{.Names}}" | grep -q "^${SHARED_CONTAINER}$"; then
    if ! docker network inspect "$NETWORK_NAME" --format '{{range .Containers}}{{.Name}} {{end}}' 2>/dev/null | grep -q "${SHARED_CONTAINER}"; then
      echo "   Connecting $SHARED_CONTAINER to $NETWORK_NAME..."
      docker network connect "$NETWORK_NAME" "$SHARED_CONTAINER" 2>/dev/null || {
        echo "   ⚠️ Failed to connect $SHARED_CONTAINER to $NETWORK_NAME (will let docker-compose handle it)"
      }
    else
      echo "   ✅ $SHARED_CONTAINER is on $NETWORK_NAME"
    fi
  fi
done

# Ensure volumes exist (idempotent - won't recreate if they exist)
# Dev and QA share the same volumes
echo "📦 Ensuring volumes exist (data will be preserved)..."
docker volume create app_redis_data 2>/dev/null || echo "✅ Volume app_redis_data already exists (shared by dev/QA)"

# For dev and QA environments, ensure PostgreSQL volume exists (shared)
if [ "$ENVIRONMENT" == "dev" ] || [ "$ENVIRONMENT" == "qa" ]; then
  docker volume create app_postgres_data 2>/dev/null || echo "✅ Volume app_postgres_data already exists (shared by dev/QA)"
fi

# ------------------------------------------------------------------------------
# 1. DEPLOY INFRASTRUCTURE
# ------------------------------------------------------------------------------
echo "🏗️  Ensuring infrastructure is running..."
echo "   File: $COMPILE_FILE_INFRA"

# Check if infra is already running to avoid unnecessary restarts
if docker compose -f "$COMPILE_FILE_INFRA" ps --custom-format "{{.State}}" | grep -q "running"; then
  echo "   ✅ Infrastructure seems to be running"
  docker compose -f "$COMPILE_FILE_INFRA" up -d
else
  echo "   🚀 Starting infrastructure..."
  docker compose -f "$COMPILE_FILE_INFRA" up -d || {
    echo "❌ Failed to start infrastructure"
    exit 1
  }
fi

# Wait for Infra Health
echo "⏳ Waiting for infrastructure health..."
if [ "$ENVIRONMENT" == "dev" ] || [ "$ENVIRONMENT" == "qa" ]; then
  # Wait for DB (Dev and QA share the managed DB container)
  MAX_RETRIES=30
  echo "   Checking PostgreSQL..."
  until docker exec smile-postgres pg_isready -U smile_user >/dev/null 2>&1 || [ $MAX_RETRIES -eq 0 ]; do
    echo -n "."
    sleep 1
    MAX_RETRIES=$((MAX_RETRIES - 1))
  done
  echo ""
  if [ $MAX_RETRIES -eq 0 ]; then echo "⚠️  PostgreSQL timed out but proceeding..."; else echo "   ✅ PostgreSQL is ready"; fi
  
  # Ensure DB password compatibility
  docker exec smile-postgres psql -U smile_user -d postgres -c "ALTER USER smile_user PASSWORD '${DB_PASSWORD:-simple_pass}';" >/dev/null 2>&1 || true
fi

# ------------------------------------------------------------------------------
# 2. DEPLOY APPLICATION
# ------------------------------------------------------------------------------
echo "🚀 Deploying Application..."
echo "   File: $COMPILE_FILE_APP"
echo "   Image: $IMAGE_TAG"

# Stop existing app container to ensure clean state
docker stop "$CONTAINER_NAME" 2>/dev/null || true
docker rm "$CONTAINER_NAME" 2>/dev/null || true

# Start App
docker compose -f "$COMPILE_FILE_APP" up -d --force-recreate || {
  echo "❌ Failed to start application"
  exit 1
}

# ------------------------------------------------------------------------------
# 3. POST-DEPLOYMENT CHECKS
# ------------------------------------------------------------------------------
echo "⏳ Waiting for app to be ready..."
sleep 5

# Ensure App is on the network (Safety Check)
if ! docker network inspect "$NETWORK_NAME" --format '{{range .Containers}}{{.Name}} {{end}}' 2>/dev/null | grep -q "${CONTAINER_NAME}"; then
   echo "⚠️  App container not on $NETWORK_NAME, connecting explicitly..."
   docker network connect "$NETWORK_NAME" "${CONTAINER_NAME}" 2>/dev/null
fi

# Initialize Database Schema (for Dev/QA)
# Note: QA might use external DB, but we still might want to push schema if we have access
if [ "$ENVIRONMENT" == "dev" ] || [ "$ENVIRONMENT" == "qa" ]; then
    echo "🔍 Checking database initialization logic..."
    
    # Ensure database exists (for both Dev and QA sharing the same container)
    if [ "$ENVIRONMENT" == "dev" ] || [ "$ENVIRONMENT" == "qa" ]; then
      docker exec smile-postgres psql -U smile_user -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || {
        echo "📦 Creating database '$DB_NAME'..."
        docker exec smile-postgres psql -U smile_user -d postgres -c "CREATE DATABASE \"$DB_NAME\";"
      }
    fi

    # Run Prisma Push (Applies to both Dev and QA if they need schema updates)
    echo "📦 Updating database schema..."
    docker exec "$CONTAINER_NAME" npm run db:push -- --accept-data-loss || echo "⚠️  Prisma push warning (check logs)"
fi

# Verify Redis is ready (if it's running - shared by dev/QA)
if docker ps --format "{{.Names}}" | grep -q "^smile-redis$"; then
  for i in {1..10}; do
    if docker exec smile-redis redis-cli ping > /dev/null 2>&1; then
      echo "✅ Redis is ready (shared by dev/QA)"
      break
    fi
    if [ $i -eq 10 ]; then
      echo "⚠️  Redis health check timeout (may still be starting)"
    fi
    sleep 1
  done
fi

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
  echo "💡 Consider running: bash scripts/deploy/setup-systemd-service.sh $ENVIRONMENT $COMPILE_FILE_APP $SERVICE_NAME"
fi

# Clean up old images
echo "🧹 Cleaning up old Docker images..."
docker image prune -af --filter "until=24h" || echo "Image cleanup completed with warnings"

echo ""
echo "✅ Deployment update completed successfully!"
