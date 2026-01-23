#!/bin/bash
# Verify deployment health
# Usage: verify-deployment.sh <container-name>

set -e

CONTAINER_NAME="$1"

if [ -z "$CONTAINER_NAME" ]; then
  echo "ERROR: Container name is required"
  echo "Usage: verify-deployment.sh <container-name>"
  exit 1
fi

echo "🔍 Verifying deployment..."
echo "Waiting for container to be healthy..."

# Check systemd service status if available
SERVICE_NAME="smile-next-${ENVIRONMENT:-dev}"
if systemctl list-unit-files | grep -q "^${SERVICE_NAME}.service"; then
  echo "📋 Checking systemd service status..."
  if systemctl is-active --quiet "$SERVICE_NAME"; then
    echo "✅ Systemd service $SERVICE_NAME is active"
  else
    echo "⚠️  Systemd service $SERVICE_NAME is not active (checking container directly)"
  fi
fi

# Wait for container to start (with retries)
MAX_WAIT_RETRIES=10
WAIT_RETRY=0
CONTAINER_RUNNING=false

while [ $WAIT_RETRY -lt $MAX_WAIT_RETRIES ]; do
  if docker ps --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
    CONTAINER_RUNNING=true
    echo "✅ Container is running"
    break
  fi
  
  WAIT_RETRY=$((WAIT_RETRY + 1))
  echo "⏳ Waiting for container to start... ($WAIT_RETRY/$MAX_WAIT_RETRIES)"
  sleep 3
done

# Check if container exists (even if stopped)
if [ "$CONTAINER_RUNNING" = false ]; then
  if docker ps -a --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
    echo "❌ Container exists but is not running!"
    echo "Container status:"
    docker ps -a --filter "name=${CONTAINER_NAME}" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo ""
    echo "Container logs:"
    docker logs "$CONTAINER_NAME" --tail 50 2>/dev/null || true
    exit 1
  else
    echo "❌ Container '$CONTAINER_NAME' does not exist!"
    echo "Available containers:"
    docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | head -10
    exit 1
  fi
fi

# Check health endpoint
MAX_RETRIES=15
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  HEALTH_RESULT=$(docker exec "$CONTAINER_NAME" node -e "
    const http = require('http');
    http.get('http://localhost:3000/api/health', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log(JSON.stringify({
            status: result.status,
            database: result.checks?.database?.status,
            dbLatency: result.checks?.database?.latencyMs,
            dbError: result.checks?.database?.error,
            redis: result.checks?.redis?.status,
            httpStatus: res.statusCode
          }));
          process.exit(res.statusCode === 200 ? 0 : 1);
        } catch (e) {
          process.exit(1);
        }
      });
    }).on('error', () => process.exit(1));
  " 2>/dev/null)
  
  if [ $? -eq 0 ]; then
    echo "✓ Health check passed"
    
    # Parse and display database status
    DB_STATUS=$(echo "$HEALTH_RESULT" | grep -o '"database":"[^"]*"' | cut -d'"' -f4 2>/dev/null || echo "unknown")
    DB_LATENCY=$(echo "$HEALTH_RESULT" | grep -o '"dbLatency":[0-9]*' | cut -d':' -f2 2>/dev/null || echo "")
    DB_ERROR=$(echo "$HEALTH_RESULT" | grep -o '"dbError":"[^"]*"' | cut -d'"' -f4 2>/dev/null || echo "")
    
    if [ "$DB_STATUS" == "ok" ]; then
      echo "✓ Database connection OK (${DB_LATENCY}ms)"
    elif [ "$DB_STATUS" == "error" ]; then
      echo "⚠️  Database connection FAILED: $DB_ERROR"
    fi
    
    # Also check workers status
    if docker exec "$CONTAINER_NAME" node -e "
      const http = require('http');
      http.get('http://localhost:3000/api/health/workers', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            if (result.workersEnabled) {
              console.log('✓ Workers are running');
              process.exit(0);
            } else {
              console.log('⚠ Workers are not running:', result.missingVars?.join(', ') || result.startupStatus?.error || 'unknown');
              process.exit(0); // Don't fail deployment if workers are disabled
            }
          } catch (e) {
            console.log('⚠ Could not parse worker status');
            process.exit(0);
          }
        });
      }).on('error', () => process.exit(1));
    " 2>/dev/null; then
      echo "✓ Worker status check completed"
    fi
    
    echo "✅ Deployment verification successful!"
    exit 0
  fi
  
  RETRY_COUNT=$((RETRY_COUNT + 1))
  echo "⏳ Waiting for health check... ($RETRY_COUNT/$MAX_RETRIES)"
  sleep 4
done

echo "❌ Health check failed after $((MAX_RETRIES * 4)) seconds"
echo "Container logs:"
docker logs "$CONTAINER_NAME" --tail 50
exit 1
