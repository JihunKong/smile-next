#!/bin/bash
# Migrate standalone containers to docker-compose while preserving data
# Usage: migrate-to-docker-compose.sh [dev|prod]
#
# This script:
# 1. Verifies existing volumes contain data
# 2. Stops old standalone containers
# 3. Starts containers via docker-compose using the same volumes
# 4. Preserves all data

set -e

ENVIRONMENT="${1:-dev}"
COMPOSE_FILE="docker-compose.prod.yml"

if [ "$ENVIRONMENT" == "dev" ]; then
  COMPOSE_FILE="docker-compose.yml"
fi

echo "🔄 Migrating containers to docker-compose while preserving data..."
echo "Environment: $ENVIRONMENT"
echo "Compose file: $COMPOSE_FILE"
echo ""

# Check if we're in the right directory
if [ ! -f "$COMPOSE_FILE" ]; then
  echo "❌ Error: $COMPOSE_FILE not found in current directory"
  echo "Please run this script from the project root directory"
  exit 1
fi

# Step 1: Verify volumes exist and have data
echo "📦 Step 1: Checking existing volumes..."
if docker volume inspect app_postgres_data > /dev/null 2>&1; then
  echo "✅ Found app_postgres_data volume (existing data)"
  VOLUME_SIZE=$(docker volume inspect app_postgres_data --format '{{ .Mountpoint }}' | xargs du -sh 2>/dev/null | cut -f1 || echo "unknown")
  echo "   Volume size: $VOLUME_SIZE"
else
  echo "❌ app_postgres_data volume not found!"
  echo "   This volume should exist from your current containers."
  exit 1
fi

if docker volume inspect app_redis_data > /dev/null 2>&1; then
  echo "✅ Found app_redis_data volume (existing data)"
  VOLUME_SIZE=$(docker volume inspect app_redis_data --format '{{ .Mountpoint }}' | xargs du -sh 2>/dev/null | cut -f1 || echo "unknown")
  echo "   Volume size: $VOLUME_SIZE"
else
  echo "❌ app_redis_data volume not found!"
  echo "   This volume should exist from your current containers."
  exit 1
fi

echo ""
read -p "Continue with migration? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Migration cancelled"
  exit 0
fi

# Step 2: Stop existing standalone containers
echo ""
echo "🛑 Step 2: Stopping existing containers..."

if docker ps | grep -q "smile-postgres"; then
  echo "   Stopping smile-postgres..."
  docker stop smile-postgres || true
fi

if docker ps | grep -q "smile-redis"; then
  echo "   Stopping smile-redis..."
  docker stop smile-redis || true
fi

# Note: We're NOT stopping smile-next-dev as it might be running
# The user should handle that separately if needed

# Step 3: Remove old containers (but keep volumes!)
echo ""
echo "🗑️  Step 3: Removing old containers (volumes preserved)..."
docker rm smile-postgres 2>/dev/null || echo "   smile-postgres already removed"
docker rm smile-redis 2>/dev/null || echo "   smile-redis already removed"

# Step 4: Start with docker-compose (will use existing volumes)
echo ""
echo "🚀 Step 4: Starting containers with docker-compose..."
echo "   Using existing volumes - all data will be preserved!"

# Start only db and redis services (not app, since user has smile-next-dev)
docker-compose -f "$COMPOSE_FILE" up -d db redis

# Step 5: Verify services are healthy
echo ""
echo "⏳ Step 5: Waiting for services to be healthy..."
sleep 5

if docker exec smile-postgres pg_isready -U smile_user -d smile_db > /dev/null 2>&1; then
  echo "✅ PostgreSQL is healthy"
else
  echo "⚠️  PostgreSQL health check failed (may need a moment)"
fi

if docker exec smile-redis redis-cli ping > /dev/null 2>&1; then
  echo "✅ Redis is healthy"
else
  echo "⚠️  Redis health check failed (may need a moment)"
fi

echo ""
echo "✅ Migration complete!"
echo ""
echo "📋 Summary:"
echo "   - PostgreSQL: Running via docker-compose (data preserved)"
echo "   - Redis: Running via docker-compose (data preserved)"
echo "   - App container: You still have 'smile-next-dev' running separately"
echo ""
echo "💡 Next steps:"
echo "   1. Your data is safe in the volumes"
echo "   2. To use docker-compose for the app too, stop smile-next-dev and run:"
echo "      docker-compose -f $COMPOSE_FILE up -d app"
echo "   3. Or continue using smile-next-dev if it's working"
echo ""
echo "🔍 To verify data:"
echo "   docker exec smile-postgres psql -U smile_user -d smile_db -c '\\dt'"
echo "   docker exec smile-redis redis-cli DBSIZE"
