#!/bin/bash
# =============================================================================
# Reset Database Script
# =============================================================================
# Drops all tables and reseeds with fresh test data.
# Usage: npm run db:reset
#    or: ./scripts/dev/reset-db.sh
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔄 Resetting development database...${NC}"

# Check if containers are running (try both container names)
CONTAINER_NAME=""
if docker ps | grep -q "smile-postgres-local"; then
  CONTAINER_NAME="smile-postgres-local"
elif docker ps | grep -q "smile-postgres"; then
  CONTAINER_NAME="smile-postgres"
else
  echo -e "${RED}❌ PostgreSQL container is not running${NC}"
  echo ""
  echo "Start containers with one of:"
  echo "  docker-compose -f docker-compose.local.yml up -d"
  echo "  npm run setup"
  exit 1
fi

echo -e "Using container: ${GREEN}$CONTAINER_NAME${NC}"

# Create .env symlink for Prisma if needed (Prisma doesn't read .env.local)
if [ -f ".env.local" ] && [ ! -L ".env" ]; then
    echo -e "\n📝 Creating .env symlink for Prisma..."
    ln -sf .env.local .env
fi

echo -e "\n📊 Dropping and recreating database schema..."
npx prisma db push --force-reset --skip-generate

echo -e "\n🌱 Seeding database with test data..."
npm run db:seed

echo -e "\n${GREEN}✅ Database reset complete!${NC}"
echo ""
echo "Test accounts (password: Test1234!):"
echo "  - superadmin@smile.test (Super Admin)"
echo "  - admin@smile.test (Admin)"
echo "  - teacher1@smile.test (Teacher)"
echo "  - teacher2@smile.test (Teacher)"
echo "  - student1@smile.test (Student - has completed attempts)"
echo "  - student2@smile.test (Student - has failed attempts)"
echo "  - student3@smile.test (Student - has in-progress attempt)"
echo "  - student4@smile.test (Student - no attempts)"
