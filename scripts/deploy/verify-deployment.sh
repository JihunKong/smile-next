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

# Wait for container to start
sleep 5

# Check if container is running
if ! docker ps | grep -q "$CONTAINER_NAME"; then
  echo "❌ Container is not running!"
  echo "Container logs:"
  docker logs "$CONTAINER_NAME" --tail 50 2>/dev/null || true
  exit 1
fi

# Check health endpoint
MAX_RETRIES=15
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if docker exec "$CONTAINER_NAME" node -e "
    const http = require('http');
    http.get('http://localhost:3000/api/health', (res) => {
      if (res.statusCode === 200) {
        process.exit(0);
      } else {
        process.exit(1);
      }
    }).on('error', () => process.exit(1));
  " 2>/dev/null; then
    echo "✓ Health check passed"
    
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
