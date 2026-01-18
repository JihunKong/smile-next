#!/bin/bash
# Setup systemd service for docker-compose management
# Usage: setup-systemd-service.sh <environment> <compose-file> <service-name>
#
# This script:
# 1. Creates a systemd service file for managing docker-compose
# 2. Enables the service to start on boot
# 3. Reloads systemd daemon

set -e

ENVIRONMENT="${1:-dev}"
COMPOSE_FILE="${2:-docker-compose.dev.yml}"
SERVICE_NAME="${3:-smile-next-${ENVIRONMENT}}"

if [ -z "$ENVIRONMENT" ]; then
  echo "ERROR: Environment is required"
  echo "Usage: setup-systemd-service.sh <environment> [compose-file] [service-name]"
  exit 1
fi

echo "🔧 Setting up systemd service for $SERVICE_NAME..."
echo "   Environment: $ENVIRONMENT"
echo "   Compose file: $COMPOSE_FILE"
echo ""

# Determine project directory
# Try common locations
PROJECT_DIR=""
for dir in "$HOME/smile-next" "/opt/smile-next" "/opt/smile/app"; do
  if [ -d "$dir" ] && [ -f "$dir/$COMPOSE_FILE" ]; then
    PROJECT_DIR="$dir"
    break
  fi
done

if [ -z "$PROJECT_DIR" ]; then
  # Use current directory if compose file exists
  if [ -f "$COMPOSE_FILE" ]; then
    PROJECT_DIR="$(pwd)"
  else
    echo "❌ ERROR: Could not find project directory with $COMPOSE_FILE"
    echo "Please run this script from the project directory or set PROJECT_DIR"
    exit 1
  fi
fi

echo "📁 Project directory: $PROJECT_DIR"

# Create systemd service file
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

echo "📝 Creating systemd service file: $SERVICE_FILE"

sudo tee "$SERVICE_FILE" > /dev/null <<EOF
[Unit]
Description=SMILE Next.js Application ($ENVIRONMENT)
Documentation=https://github.com/tedahn-pknic/new_smile_flask
Requires=docker.service
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$PROJECT_DIR
# Start all services (db, redis, app) - docker compose handles dependencies
ExecStart=/usr/bin/docker compose -f $COMPOSE_FILE up -d
ExecStop=/usr/bin/docker compose -f $COMPOSE_FILE down
ExecReload=/usr/bin/docker compose -f $COMPOSE_FILE up -d --force-recreate
# Restart on failure (systemd will restart the service, which restarts containers)
Restart=on-failure
RestartSec=10
TimeoutStartSec=300
TimeoutStopSec=30

# Security settings
User=$(whoami)
Group=$(id -gn)
PrivateTmp=yes
NoNewPrivileges=yes

# Environment
Environment="COMPOSE_FILE=$COMPOSE_FILE"
Environment="PROJECT_DIR=$PROJECT_DIR"

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=$SERVICE_NAME

[Install]
WantedBy=multi-user.target
EOF

echo "✅ Service file created"

# Reload systemd daemon
echo "🔄 Reloading systemd daemon..."
sudo systemctl daemon-reload

# Enable service (but don't start it yet - let deployment do that)
echo "🔌 Enabling service to start on boot..."
sudo systemctl enable "$SERVICE_NAME" || {
  echo "⚠️  Warning: Failed to enable service (may need sudo)"
}

echo ""
echo "✅ Systemd service setup complete!"
echo ""
echo "📋 Service management commands:"
echo "   sudo systemctl start $SERVICE_NAME    # Start the service"
echo "   sudo systemctl stop $SERVICE_NAME     # Stop the service"
echo "   sudo systemctl restart $SERVICE_NAME  # Restart the service"
echo "   sudo systemctl status $SERVICE_NAME   # Check service status"
echo "   sudo journalctl -u $SERVICE_NAME -f   # View logs"
echo ""
echo "💡 The service will automatically start on system boot"
