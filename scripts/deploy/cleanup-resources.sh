#!/bin/bash
# =============================================================================
# cleanup-resources.sh - Server Resource Cleanup Script
# =============================================================================
#
# Purpose: Clean up disk space on the deployment server to prevent full disk
# issues during deployment. This script is called before deployments to ensure
# there's enough space for new Docker images and files.
#
# Usage: bash scripts/deploy/cleanup-resources.sh [--aggressive]
#   --aggressive: Perform more aggressive cleanup (journal logs, tmp files)
#
# Exit codes:
#   0 - Cleanup successful
#   1 - Cleanup failed or disk still critically full
#
# =============================================================================

set -e

AGGRESSIVE_MODE=false
DISK_THRESHOLD=80  # Warn if disk usage exceeds this percentage

# Parse arguments
while [[ "$#" -gt 0 ]]; do
  case $1 in
    --aggressive) AGGRESSIVE_MODE=true ;;
    *) echo "Unknown parameter: $1"; exit 1 ;;
  esac
  shift
done

echo "=============================================="
echo "   Resource Cleanup Script"
echo "=============================================="
echo ""

# Function to get disk usage percentage
get_disk_usage() {
  df / | tail -1 | awk '{print $5}' | tr -d '%'
}

# Function to format bytes
format_size() {
  numfmt --to=iec-i --suffix=B "$1" 2>/dev/null || echo "${1}B"
}

# Initial disk check
echo "=== Initial Disk Status ==="
df -h / | head -2
INITIAL_USAGE=$(get_disk_usage)
echo "Current usage: ${INITIAL_USAGE}%"
echo ""

# Check if disk is critically full
if [ "$INITIAL_USAGE" -gt 95 ]; then
  echo "CRITICAL: Disk usage is ${INITIAL_USAGE}% - enabling aggressive mode"
  AGGRESSIVE_MODE=true
fi

# ============================================
# Phase 1: Docker Cleanup (Always run)
# ============================================
echo "=== Phase 1: Docker Cleanup ==="

# Remove stopped containers
echo "  Removing stopped containers..."
docker container prune -f 2>/dev/null || true

# Remove dangling images
echo "  Removing dangling images..."
docker image prune -f 2>/dev/null || true

# Remove unused images (not just dangling)
echo "  Removing unused images..."
docker image prune -af 2>/dev/null || true

# Remove unused volumes
echo "  Removing unused volumes..."
docker volume prune -f 2>/dev/null || true

# Remove unused networks
echo "  Removing unused networks..."
docker network prune -f 2>/dev/null || true

# Remove build cache
echo "  Removing build cache..."
docker builder prune -af 2>/dev/null || true

# Show Docker disk usage summary
echo ""
echo "  Docker disk usage after cleanup:"
docker system df 2>/dev/null || true

# ============================================
# Phase 2: Log Cleanup (Always run)
# ============================================
echo ""
echo "=== Phase 2: Log Cleanup ==="

# Truncate Docker container logs (they can grow very large)
echo "  Truncating Docker container logs..."
if [ -d /var/lib/docker/containers ]; then
  sudo truncate -s 0 /var/lib/docker/containers/*/*-json.log 2>/dev/null || true
  echo "  Container logs truncated"
else
  echo "  No container logs found"
fi

# ============================================
# Phase 3: Aggressive Cleanup (Optional)
# ============================================
if [ "$AGGRESSIVE_MODE" = true ]; then
  echo ""
  echo "=== Phase 3: Aggressive Cleanup ==="

  # Vacuum journal logs
  echo "  Vacuuming journal logs to 100M..."
  sudo journalctl --vacuum-size=100M 2>/dev/null || true

  # Clean apt cache (if apt is available)
  if command -v apt-get &> /dev/null; then
    echo "  Cleaning apt cache..."
    sudo apt-get clean 2>/dev/null || true
    sudo apt-get autoremove -y 2>/dev/null || true
  fi

  # Clean old kernels (careful with this)
  # Not implemented - too risky for automated script

  # Remove old smile deployment artifacts
  echo "  Removing old deployment artifacts..."
  rm -rf /tmp/smile-* 2>/dev/null || true
  rm -rf ~/smile-next/*.tar.gz 2>/dev/null || true
  rm -rf ~/smile-next/*.bak 2>/dev/null || true

  # Remove old Docker image tarballs if any
  rm -f ~/smile-next/*.tar 2>/dev/null || true
fi

# ============================================
# Final Status
# ============================================
echo ""
echo "=============================================="
echo "   Cleanup Complete"
echo "=============================================="
echo ""
echo "=== Final Disk Status ==="
df -h / | head -2

FINAL_USAGE=$(get_disk_usage)
SPACE_FREED=$((INITIAL_USAGE - FINAL_USAGE))

echo ""
echo "Results:"
echo "  Initial usage: ${INITIAL_USAGE}%"
echo "  Final usage:   ${FINAL_USAGE}%"
if [ "$SPACE_FREED" -gt 0 ]; then
  echo "  Space freed:   ${SPACE_FREED}%"
else
  echo "  Space freed:   0% (no change)"
fi

# Threshold warning
if [ "$FINAL_USAGE" -gt "$DISK_THRESHOLD" ]; then
  echo ""
  echo "WARNING: Disk usage (${FINAL_USAGE}%) still exceeds threshold (${DISK_THRESHOLD}%)"
  echo "Consider manual investigation of disk usage"
  echo ""
  echo "Large directories to check:"
  echo "  /var/lib/docker - Docker data"
  echo "  /var/log - System logs"
  echo "  /home - User data"
  echo ""
  # Don't exit with error - just warn
fi

# Write test to verify disk is writable
TEST_FILE="/tmp/.cleanup-test-$$"
if touch "$TEST_FILE" 2>/dev/null; then
  rm -f "$TEST_FILE"
  echo ""
  echo "Disk write test: PASSED"
else
  echo ""
  echo "ERROR: Disk write test FAILED - disk may still be full"
  exit 1
fi

echo ""
echo "Cleanup script completed successfully"
exit 0
