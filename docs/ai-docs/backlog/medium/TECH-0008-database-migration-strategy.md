---
id: TECH-0008
title: Document and implement database migration strategy
status: backlog
priority: medium
category: tech-debt
component: database
created: 2026-01-18
updated: 2026-01-18
effort: s
assignee: ai-agent
---

# Document Database Migration Strategy

## Summary

The project uses Prisma but the scripts show `db:push` usage which is a development-only approach. There's no documented migration strategy for production deployments. Using `db push` in production can cause data loss. Proper migration workflow needs to be established.

## Current Behavior

```json
// package.json
"db:push": "prisma db push",      // Development - no migration history
"db:migrate": "prisma migrate dev" // Creates migrations but unclear usage
```

- `db:push` is used (appears in docs/scripts)
- Migration files may or may not exist
- No production migration strategy documented
- CI/CD doesn't run migrations

## Expected Behavior

Clear migration workflow:
1. **Development**: `prisma migrate dev` creates migration files
2. **CI/CD**: Migrations applied during deployment
3. **Production**: `prisma migrate deploy` applies pending migrations
4. **Rollback**: Documented recovery procedure

## Acceptance Criteria

- [ ] Document migration workflow in deployment guide
- [ ] Add migration step to CI/CD pipeline
- [ ] Create `db:migrate:prod` script for production
- [ ] Ensure migrations directory exists and is committed
- [ ] Add migration check to deployment verification
- [ ] Document rollback procedure

## Technical Approach

### 1. Update Package Scripts

```json
{
  "scripts": {
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate:dev": "prisma migrate dev",
    "db:migrate:create": "prisma migrate dev --create-only",
    "db:migrate:deploy": "prisma migrate deploy",
    "db:migrate:status": "prisma migrate status",
    "db:migrate:reset": "prisma migrate reset"
  }
}
```

### 2. Add Migration to Deployment Script

```bash
# scripts/deploy/update-app.sh (add before app start)

echo "Running database migrations..."
docker compose -f docker-compose.${ENV}.yml exec -T app npx prisma migrate deploy

if [ $? -ne 0 ]; then
  echo "❌ Migration failed! Rolling back..."
  docker compose -f docker-compose.${ENV}.yml down
  exit 1
fi

echo "✅ Migrations applied successfully"
```

### 3. Add to CI/CD Workflow

```yaml
# In deploy workflow, after pulling new image
- name: Run Database Migrations
  run: |
    ssh ${{ secrets.VM_USERNAME }}@${{ secrets.VM_HOST }} << 'EOF'
      cd ~/smile-next
      docker compose -f docker-compose.${{ inputs.environment }}.yml exec -T app npx prisma migrate deploy
    EOF
```

### 4. Document Workflow

```markdown
# Database Migration Guide

## Development Workflow

1. Make schema changes in `prisma/schema.prisma`
2. Create migration: `npm run db:migrate:dev`
3. Name the migration descriptively (e.g., "add_user_preferences")
4. Review generated SQL in `prisma/migrations/`
5. Commit migration files

## Production Deployment

Migrations are automatically applied during deployment via CI/CD.
The `prisma migrate deploy` command:
- Applies pending migrations in order
- Fails if migrations cannot be applied
- Does NOT generate new migrations

## Manual Migration (Emergency)

```bash
ssh user@vm-host
cd ~/smile-next
docker compose exec app npx prisma migrate deploy
```

## Rollback Procedure

Prisma doesn't support automatic rollback. To revert:

1. Create a new migration that undoes changes
2. Deploy the reverting migration
3. Or restore from database backup

## Checking Migration Status

```bash
npx prisma migrate status
```
```

### 5. Pre-deployment Check

```typescript
// src/lib/db/migration-check.ts
import { prisma } from './prisma'

export async function checkMigrationStatus() {
  try {
    // Simple query to verify database connection and schema
    await prisma.$queryRaw`SELECT 1`
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error.message }
  }
}
```

## Related Files

- `prisma/schema.prisma` - Schema definition
- `prisma/migrations/` - Migration history
- `scripts/deploy/update-app.sh` - Deployment script
- `.github/workflows/deploy-*.yml` - CI/CD workflows

## Dependencies

**Blocked By:**
- None

**Blocks:**
- None

## Notes

- Never use `db push` in production
- Always backup database before major migrations
- Test migrations on staging/dev before production
- Consider adding migration dry-run step

## Conversation History

| Date | Note |
|------|------|
| 2026-01-18 | Initial creation based on deployment analysis |
