#!/bin/bash
# Check how containers are currently managed
# Usage: check-container-management.sh

echo "=========================================="
echo "  Container Management Status Check"
echo "=========================================="
echo ""

echo "1️⃣  Checking systemd services..."
echo "----------------------------------------"
systemctl list-unit-files | grep -E "smile|postgres|redis" || echo "No systemd services found for smile/postgres/redis"
echo ""

echo "2️⃣  Checking running containers..."
echo "----------------------------------------"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "smile|postgres|redis|NAMES" || echo "No containers found"
echo ""

echo "3️⃣  Checking all containers (including stopped)..."
echo "----------------------------------------"
docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Image}}" | grep -E "smile|postgres|redis|NAMES" || echo "No containers found"
echo ""

echo "4️⃣  Checking Docker volumes..."
echo "----------------------------------------"
docker volume ls | grep -E "postgres|redis|app_" || echo "No postgres/redis volumes found"
echo ""

echo "5️⃣  Checking for docker-compose files..."
echo "----------------------------------------"
for dir in "$HOME/smile-next" "/opt/smile-next" "/opt/smile/app" "$(pwd)"; do
  if [ -d "$dir" ]; then
    echo "Checking: $dir"
    ls -la "$dir"/*.yml 2>/dev/null | grep -E "docker-compose|compose" || echo "  No docker-compose files found"
  fi
done
echo ""

echo "6️⃣  Checking if containers are managed by systemd..."
echo "----------------------------------------"
for container in smile-postgres smile-redis smile-next-dev smile-next-prod smile-app; do
  if docker ps -a --format "{{.Names}}" | grep -q "^${container}$"; then
    echo "Container: $container"
    # Check if there's a systemd service managing it
    if systemctl list-units --type=service --all | grep -q "$container"; then
      echo "  ✓ Has systemd service"
      systemctl status "$container" --no-pager -l | head -5
    else
      echo "  ✗ No systemd service found"
    fi
    echo ""
  fi
done

echo "7️⃣  Checking container restart policies..."
echo "----------------------------------------"
docker ps -a --format "table {{.Names}}\t{{.RestartPolicy}}" | grep -E "smile|postgres|redis|NAMES" || echo "No containers found"
echo ""

echo "8️⃣  Checking for docker-compose processes..."
echo "----------------------------------------"
ps aux | grep -E "docker-compose|compose" | grep -v grep || echo "No docker-compose processes running"
echo ""

echo "9️⃣  Checking systemd service files (if any)..."
echo "----------------------------------------"
sudo ls -la /etc/systemd/system/*smile* 2>/dev/null || echo "No systemd service files found in /etc/systemd/system/"
sudo ls -la /etc/systemd/system/*postgres* 2>/dev/null || echo "No postgres systemd service files found"
sudo ls -la /etc/systemd/system/*redis* 2>/dev/null || echo "No redis systemd service files found"
echo ""

echo "=========================================="
echo "  Summary"
echo "=========================================="
echo ""
echo "To check specific service status:"
echo "  systemctl status <service-name>"
echo ""
echo "To view container logs:"
echo "  docker logs <container-name>"
echo ""
echo "To check if docker-compose is managing containers:"
echo "  cd ~/smile-next && docker-compose ps"
echo ""
