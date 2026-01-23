#!/bin/bash
# ensure-infra.sh
# One-time (or idempotent) setup for infrastructure on the remote VM.
# Usage: ensure-infra.sh

echo "🏗️  Ensuring Infrastructure..."

# 1. Ensure Network
NETWORK_NAME="smile-network"
echo "🌐 Ensuring Docker network exists..."
docker network create "$NETWORK_NAME" 2>/dev/null && echo "✅ Created network: $NETWORK_NAME" || echo "✅ Network $NETWORK_NAME already exists"

# 2. Ensure Volumes
# Common volumes for Redis and PostgreSQL (shared across environments if on same host)
echo "📦 Ensuring volumes exist..."
docker volume create app_redis_data 2>/dev/null || echo "✅ Volume app_redis_data already exists"
docker volume create app_postgres_data 2>/dev/null || echo "✅ Volume app_postgres_data already exists"

# 3. Ensure Permissions (optional, if script needs to fix ownership)
# echo "🔒 Setting permissions..."

echo "✅ Infrastructure setup complete."
