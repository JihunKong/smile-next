#!/bin/bash
# Validate environment configuration before deployment
# Usage: validate-env.sh <environment>

set -e

ENVIRONMENT="${1:-dev}"

# Try to find .env file
ENV_FILE="$HOME/smile-next/.env"
if [ ! -f "$ENV_FILE" ]; then
  ENV_FILE="/opt/smile-next/.env"
fi

echo "Validating environment configuration for $ENVIRONMENT..."

# Check .env file exists
if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: .env file not found in any expected location:"
  echo "  - $HOME/smile-next/.env"
  echo "  - /opt/smile-next/.env"
  exit 1
fi

# Source and validate required vars
set -a
source "$ENV_FILE"
set +a

# Critical variables - required for all environments
MISSING_VARS=()
[ -z "$AUTH_SECRET" ] && [ -z "$NEXTAUTH_SECRET" ] && MISSING_VARS+=("AUTH_SECRET or NEXTAUTH_SECRET")
[ -z "$DATABASE_URL" ] && MISSING_VARS+=("DATABASE_URL")
[ -z "$NEXTAUTH_URL" ] && MISSING_VARS+=("NEXTAUTH_URL")
[ -z "$NEXT_PUBLIC_APP_URL" ] && MISSING_VARS+=("NEXT_PUBLIC_APP_URL")

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
  echo "ERROR: Missing required environment variables:"
  printf '  - %s\n' "${MISSING_VARS[@]}"
  exit 1
fi

# Validate DATABASE_URL format
if ! echo "$DATABASE_URL" | grep -qE '^postgresql://'; then
  echo "ERROR: DATABASE_URL must be a PostgreSQL connection string"
  exit 1
fi

echo "✓ Environment validation passed"
