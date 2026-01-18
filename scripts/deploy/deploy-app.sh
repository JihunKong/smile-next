#!/bin/bash
# Deploy the application container
# Usage: deploy-app.sh <image-name> <docker-tag> <port> <container-name> <ghcr-username> <ghcr-pat>

set -e

IMAGE_NAME="$1"
DOCKER_TAG="$2"
PORT="$3"
CONTAINER_NAME="$4"
GHCR_USERNAME="${5:-tedahn-pknic}"
GHCR_PAT="$6"

if [ -z "$IMAGE_NAME" ] || [ -z "$DOCKER_TAG" ] || [ -z "$PORT" ] || [ -z "$CONTAINER_NAME" ]; then
  echo "ERROR: Missing required arguments"
  echo "Usage: deploy-app.sh <image-name> <docker-tag> <port> <container-name> [ghcr-username] [ghcr-pat]"
  exit 1
fi

echo "🚀 Starting deployment..."
echo "📦 Image: $IMAGE_NAME:$DOCKER_TAG"
echo "🔌 Port: $PORT"
echo "📛 Container: $CONTAINER_NAME"

# 1. Log in to GHCR
echo "🔐 Logging in to GitHub Container Registry..."
if [ -n "$GHCR_PAT" ]; then
  echo "$GHCR_PAT" | docker login ghcr.io -u "$GHCR_USERNAME" --password-stdin || {
    echo "⚠️  Warning: Failed to login to GHCR. Image might be public or using different credentials."
  }
else
  echo "⚠️  Warning: No GHCR_PAT provided, skipping login"
fi

# 2. Verify image exists and pull
echo "📥 Verifying and pulling Docker image..."
IMAGE_TAG="$IMAGE_NAME:$DOCKER_TAG"

# Check if image exists in registry (with retry)
MAX_PULL_RETRIES=3
PULL_RETRY=0
while [ $PULL_RETRY -lt $MAX_PULL_RETRIES ]; do
  if docker pull "$IMAGE_TAG"; then
    echo "✅ Successfully pulled image: $IMAGE_TAG"
    break
  else
    PULL_RETRY=$((PULL_RETRY + 1))
    if [ $PULL_RETRY -eq $MAX_PULL_RETRIES ]; then
      echo "❌ Failed to pull image after $MAX_PULL_RETRIES attempts: $IMAGE_TAG"
      echo "This might indicate the build job failed or the image wasn't pushed."
      exit 1
    fi
    echo "⚠️  Pull attempt $PULL_RETRY failed, retrying in 5 seconds..."
    sleep 5
  fi
done

# 3. Stop and remove existing container
echo "🛑 Stopping existing container..."
docker stop "$CONTAINER_NAME" 2>/dev/null || echo "Container not running or doesn't exist"

echo "🗑️  Removing existing container..."
docker rm "$CONTAINER_NAME" 2>/dev/null || echo "Container doesn't exist"

# 4. Run the new container
echo "▶️  Starting new container..."
# Find .env file location
ENV_FILE="$HOME/smile-next/.env"
if [ ! -f "$ENV_FILE" ]; then
  ENV_FILE="/opt/smile-next/.env"
fi
if [ ! -f "$ENV_FILE" ]; then
  echo "❌ ERROR: .env file not found in any expected location"
  exit 1
fi

docker run -d \
  --name "$CONTAINER_NAME" \
  --restart always \
  -p "$PORT:3000" \
  --env-file "$ENV_FILE" \
  "$IMAGE_TAG" || {
  echo "❌ Failed to start container"
  docker logs "$CONTAINER_NAME" --tail 50 2>/dev/null || true
  exit 1
}

# 5. Prune old Docker images
echo "🧹 Cleaning up old images..."
docker image prune -af --filter "until=24h" || echo "Image prune completed with warnings"

echo "✅ Deployment completed successfully!"
