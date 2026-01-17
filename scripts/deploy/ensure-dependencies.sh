#!/bin/bash
# Ensure dependency containers (Redis, PostgreSQL) are running
# Usage: ensure-dependencies.sh <environment>

set -e

ENVIRONMENT="${1:-dev}"

echo "🔧 Ensuring dependency containers are running..."

# Redis is required for both dev and prod
if ! docker ps | grep -q "smile-redis"; then
  if docker ps -a | grep -q "smile-redis"; then
    echo "🔄 Starting existing Redis container..."
    docker start smile-redis
  else
    echo "📦 Creating Redis container..."
    docker run -d \
      --name smile-redis \
      --restart always \
      -p 6379:6379 \
      redis:7-alpine \
      redis-server --maxmemory 64mb --maxmemory-policy allkeys-lru
  fi
  echo "⏳ Waiting for Redis to be ready..."
  for i in {1..10}; do
    if docker exec smile-redis redis-cli ping > /dev/null 2>&1; then
      echo "✅ Redis is ready"
      break
    fi
    if [ $i -eq 10 ]; then
      echo "❌ Redis failed to start after 10 attempts"
      exit 1
    fi
    sleep 1
  done
else
  echo "✅ Redis container is already running"
fi

# PostgreSQL is only needed for dev (prod uses GCP SQL)
if [ "$ENVIRONMENT" == "dev" ]; then
  if ! docker ps | grep -q "smile-postgres"; then
    if docker ps -a | grep -q "smile-postgres"; then
      echo "🔄 Starting existing PostgreSQL container..."
      docker start smile-postgres
    else
      echo "📦 Creating PostgreSQL container..."
      # Source .env to get DB_PASSWORD
      ENV_FILE="/opt/smile-next/.env"
      if [ -f "$ENV_FILE" ]; then
        set -a
        source "$ENV_FILE"
        set +a
      fi
      docker run -d \
        --name smile-postgres \
        --restart always \
        -p 5432:5432 \
        -e POSTGRES_USER=smile_user \
        -e POSTGRES_DB=smile_db \
        -e POSTGRES_PASSWORD="${DB_PASSWORD:-change_me_in_production}" \
        -v postgres_data:/var/lib/postgresql/data \
        postgres:15-alpine
    fi
    echo "⏳ Waiting for PostgreSQL to be ready..."
    for i in {1..20}; do
      if docker exec smile-postgres pg_isready -U smile_user -d smile_db > /dev/null 2>&1; then
        echo "✅ PostgreSQL is ready"
        break
      fi
      if [ $i -eq 20 ]; then
        echo "❌ PostgreSQL failed to start after 20 attempts"
        exit 1
      fi
      sleep 1
    done
  else
    echo "✅ PostgreSQL container is already running"
  fi
else
  echo "ℹ️  Skipping PostgreSQL (prod uses GCP SQL)"
fi
