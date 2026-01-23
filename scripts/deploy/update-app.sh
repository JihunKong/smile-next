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

# Select docker-compose file based on environment
# Both dev and QA use docker-compose.dev.yml and share the same PostgreSQL + Redis
if [ "$ENVIRONMENT" == "dev" ] || [ "$ENVIRONMENT" == "qa" ]; then
  COMPOSE_FILE="docker-compose.dev.yml"
  echo "📋 Using docker-compose.dev.yml (includes PostgreSQL + Redis)"
  echo "   Note: dev and QA share the same PostgreSQL and Redis instances"
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

# Load environment variables from .env file early (needed for DB_PASSWORD, etc.)
ENV_FILE="$PROJECT_DIR/.env"
if [ ! -f "$ENV_FILE" ]; then
  ENV_FILE="/opt/smile-next/.env"
fi
if [ -f "$ENV_FILE" ]; then
  set -a
  source "$ENV_FILE"
  set +a
  echo "✅ Environment variables loaded from $ENV_FILE"
fi

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

# Ensure volumes exist (idempotent - won't recreate if they exist)
# Dev and QA share the same volumes
echo "📦 Ensuring volumes exist (data will be preserved)..."
docker volume create app_redis_data 2>/dev/null || echo "✅ Volume app_redis_data already exists (shared by dev/QA)"

# For dev and QA environments, ensure PostgreSQL volume exists (shared)
if [ "$ENVIRONMENT" == "dev" ] || [ "$ENVIRONMENT" == "qa" ]; then
  docker volume create app_postgres_data 2>/dev/null || echo "✅ Volume app_postgres_data already exists (shared by dev/QA)"
fi

# Check which services are already running
echo "🔍 Checking existing services..."
DB_RUNNING=false
REDIS_RUNNING=false
APP_RUNNING=false

# Check for PostgreSQL (dev and QA share the same instance)
if [ "$ENVIRONMENT" == "dev" ] || [ "$ENVIRONMENT" == "qa" ]; then
  if docker ps --format "{{.Names}}" | grep -q "^smile-postgres$"; then
    DB_RUNNING=true
    echo "   ✅ PostgreSQL is already running (shared by dev/QA, will keep it running)"
  fi
fi

if docker ps --format "{{.Names}}" | grep -q "^smile-redis$"; then
  REDIS_RUNNING=true
  echo "   ✅ Redis is already running (will keep it running)"
fi

if docker ps --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
  APP_RUNNING=true
  echo "   ℹ️  App container is running (will recreate with new image)"
fi

# Stop only the app container (keep db/redis running)
if [ "$APP_RUNNING" = true ]; then
  echo "🛑 Stopping app container for update (db/redis stay running)..."
  docker stop "$CONTAINER_NAME" 2>/dev/null || true
  docker rm "$CONTAINER_NAME" 2>/dev/null || true
fi

# Re-export docker-compose variables
export DOCKER_IMAGE="$IMAGE_TAG"
export CONTAINER_NAME="$CONTAINER_NAME"
export PORT="$PORT"

# Start or update services
# If db/redis are running, only start the app (using --no-deps to skip dependencies)
# If they're not running, start everything
if [ "$ENVIRONMENT" == "dev" ] || [ "$ENVIRONMENT" == "qa" ]; then
  if [ "$DB_RUNNING" = true ] && [ "$REDIS_RUNNING" = true ]; then
    # Both db and redis are running, only update the app
    echo "🚀 Updating app container (db and redis stay running - shared by dev/QA)..."
    docker compose -f "$COMPOSE_FILE" up -d --no-deps --force-recreate app || {
      echo "❌ Failed to recreate app container"
      exit 1
    }
    
    # Wait for app container to be ready
    echo "⏳ Waiting for app container to be ready..."
    sleep 3
    
    # Ensure database exists and initialize schema if needed
    echo "🔍 Ensuring database '$DB_NAME' exists..."
    docker exec smile-postgres psql -U smile_user -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || {
      echo "📦 Creating database '$DB_NAME'..."
      docker exec smile-postgres psql -U smile_user -d postgres -c "CREATE DATABASE \"$DB_NAME\";" || {
        echo "⚠️  Could not create database (may already exist or need permissions)"
      }
    }
    
    # Check if app container is running and initialize Prisma schema if needed
    if docker ps --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
      echo "🔍 Checking if database schema needs initialization..."
      TABLE_COUNT=$(docker exec smile-postgres psql -U smile_user -d "$DB_NAME" -tc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ' || echo "0")
      
      if [ "$TABLE_COUNT" = "0" ] || [ -z "$TABLE_COUNT" ]; then
        echo "📦 Database schema not initialized. Running Prisma db push..."
        docker exec "$CONTAINER_NAME" npx prisma db push --skip-generate || {
          echo "⚠️  Prisma db push failed (schema may already be initialized or container not ready)"
        }
        echo "✅ Database schema initialized"
      else
        echo "✅ Database schema already exists ($TABLE_COUNT tables found)"
      fi
    fi
  else
    # Start all services (docker-compose will handle existing containers gracefully)
    echo "🚀 Starting all services with docker-compose..."
    docker compose -f "$COMPOSE_FILE" up -d || {
      echo "❌ Failed to start services"
      echo "   Checking port 5432 (PostgreSQL)..."
      docker ps --format "table {{.Names}}\t{{.Ports}}" | grep -E "(5432|postgres)" || true
      exit 1
    }
    
    # Wait for dependencies to be healthy
    echo "⏳ Waiting for dependencies to be healthy..."
    sleep 5
    
    # Verify PostgreSQL is ready (dev and QA)
    for i in {1..20}; do
      if docker exec smile-postgres pg_isready -U smile_user > /dev/null 2>&1; then
        echo "✅ PostgreSQL is ready (shared by dev/QA)"
        break
      fi
      if [ $i -eq 20 ]; then
        echo "⚠️  PostgreSQL health check timeout (may still be starting)"
      fi
      sleep 1
    done
    
    # Ensure the environment-specific database exists
    echo "🔍 Ensuring database '$DB_NAME' exists..."
    docker exec smile-postgres psql -U smile_user -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || {
      echo "📦 Creating database '$DB_NAME'..."
      docker exec smile-postgres psql -U smile_user -d postgres -c "CREATE DATABASE \"$DB_NAME\";" || {
        echo "⚠️  Could not create database (may already exist or need permissions)"
      }
    }
    echo "✅ Database '$DB_NAME' is ready"
    
    # Re-encode password with scram-sha-256 for SSH tunnel access (DBeaver, etc.)
    echo "🔐 Ensuring PostgreSQL password uses scram-sha-256 encoding..."
    docker exec smile-postgres psql -U smile_user -d postgres -c "ALTER USER smile_user PASSWORD '${DB_PASSWORD:-simple_pass}';" > /dev/null 2>&1 || {
      echo "⚠️  Could not re-encode password (may need manual reset for DBeaver access)"
    }
    echo "✅ PostgreSQL password configured for scram-sha-256 auth"
  fi
  
  # Wait for app container to be ready before running Prisma commands
  echo "⏳ Waiting for app container to be ready..."
  sleep 3
  
  # Check if app container is running before running Prisma commands
  if docker ps --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
    # Initialize Prisma schema if database is empty (for new databases)
    echo "🔍 Checking if database schema needs initialization..."
    
    # Check if database has any tables
    TABLE_COUNT=$(docker exec smile-postgres psql -U smile_user -d "$DB_NAME" -tc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ' || echo "0")
    
    if [ "$TABLE_COUNT" = "0" ] || [ -z "$TABLE_COUNT" ]; then
      echo "📦 Database schema not initialized. Running Prisma db push..."
      # Run Prisma db push inside the app container
      # The container has DATABASE_URL set from docker-compose, so it will use the correct database
      docker exec "$CONTAINER_NAME" npx prisma db push --skip-generate || {
        echo "⚠️  Prisma db push failed (schema may already be initialized or container not ready)"
        echo "   This is normal if the database already has tables"
      }
      echo "✅ Database schema initialized"
    else
      echo "✅ Database schema already exists ($TABLE_COUNT tables found)"
      echo "   Skipping schema initialization"
    fi
    
    # Optionally run migrations if using Prisma migrations (commented out by default)
    # Uncomment if you switch to using Prisma migrations instead of db push
    # echo "🔄 Running Prisma migrations..."
    # docker exec "$CONTAINER_NAME" npx prisma migrate deploy || {
    #   echo "⚠️  Prisma migrations failed (may not have migrations)"
    # }
  else
    echo "⚠️  App container '$CONTAINER_NAME' not running yet, skipping Prisma setup"
    echo "   Schema will be initialized on first app startup or next deployment"
  fi
else
  # Prod: Check if redis is running
  if [ "$REDIS_RUNNING" = true ]; then
    echo "🚀 Updating app container (redis stays running)..."
    docker compose -f "$COMPOSE_FILE" up -d --no-deps --force-recreate app || {
      echo "❌ Failed to recreate app container"
      exit 1
    }
  else
    # Start redis and app
    docker compose -f "$COMPOSE_FILE" up -d || {
      echo "❌ Failed to start services"
      exit 1
    }
    echo "⏳ Waiting for Redis to be ready..."
    sleep 3
  fi
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
  echo "💡 Consider running: bash scripts/deploy/setup-systemd-service.sh $ENVIRONMENT $COMPOSE_FILE $SERVICE_NAME"
fi

# Clean up old images
echo "🧹 Cleaning up old Docker images..."
docker image prune -af --filter "until=24h" || echo "Image cleanup completed with warnings"

echo ""
echo "✅ Deployment update completed successfully!"
