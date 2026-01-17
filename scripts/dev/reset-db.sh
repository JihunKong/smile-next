#!/bin/bash
# Reset dev database and reseed with test data
# Usage: ./scripts/dev/reset-db.sh

set -e

echo "🔄 Resetting development database..."

# Check if containers are running
if ! docker ps | grep -q "smile-postgres"; then
  echo "❌ PostgreSQL container is not running"
  echo "Start it with: docker start smile-postgres"
  echo "Or create it with: bash scripts/deploy/ensure-dependencies.sh dev"
  exit 1
fi

# Get database URL (dev uses port 5432, local docker-compose uses 5435)
DB_URL="${DATABASE_URL:-postgresql://smile_user:smile_password@localhost:5432/smile_db}"

echo "📊 Dropping and recreating database schema..."
npx prisma db push --force-reset --skip-generate

echo "🌱 Seeding database with test data..."
npm run db:seed

echo ""
echo "✅ Database reset complete!"
echo ""
echo "Test accounts (password: Test1234!):"
echo "  - superadmin@smile.test"
echo "  - admin@smile.test"
echo "  - teacher1@smile.test"
echo "  - student1@smile.test"
echo "  - student2@smile.test"
echo "  - student3@smile.test"
echo "  - student4@smile.test"
