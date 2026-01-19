# Local Development Guide

> **For Humans & AI Agents**: This document provides complete instructions for running the SMILE platform locally.

## Quick Start (TL;DR)

### One-Command Setup (Recommended)

```bash
git clone https://github.com/seeds-smile-the-ultimate/smile-web.git
cd smile-web
npm install
npm run setup      # Does everything: Docker, DB, seed data
npm run dev:simple # Start server (workers disabled for simplicity)

# Open http://localhost:3000
# Login: teacher1@smile.test / Test1234!
```

### Manual Setup

```bash
# 1. Clone and install
git clone https://github.com/seeds-smile-the-ultimate/smile-web.git
cd smile-web
npm install

# 2. Setup environment
cp .env.example .env.local
# Edit .env.local - generate AUTH_SECRET with: openssl rand -base64 32

# 3. Start dependencies (PostgreSQL + Redis)
docker-compose -f docker-compose.local.yml up -d

# 4. Setup database
npm run db:generate
npm run db:push
npm run db:seed   # Optional: adds test accounts

# 5. Run development server
npm run dev:simple

# Open http://localhost:3000
```

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Running the Application](#running-the-application)
5. [Development Modes](#development-modes)
6. [Troubleshooting](#troubleshooting)
7. [Sharing Secrets Securely](#sharing-secrets-securely)

---

## Prerequisites

### Required

| Software | Version | Check Command | Install |
|----------|---------|---------------|---------|
| Node.js | 20.x+ | `node --version` | [nodejs.org](https://nodejs.org) or `nvm install 20` |
| npm | 10.x+ | `npm --version` | Comes with Node.js |
| Docker | 24.x+ | `docker --version` | [docker.com](https://docker.com) |

### Optional (for full feature set)

| Software | Purpose | When Needed |
|----------|---------|-------------|
| Redis | Background jobs | AI evaluation features |
| PostgreSQL (local) | Database | If not using Docker |

---

## Environment Setup

### Step 1: Copy the Template

```bash
cp .env.example .env.local
```

### Step 2: Generate Required Secrets

```bash
# Generate AUTH_SECRET (required)
openssl rand -base64 32
```

Copy the output and paste it as both `AUTH_SECRET` and `NEXTAUTH_SECRET` in `.env.local`.

### Step 3: Configure Variables

#### Minimum Required Variables

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | `postgresql://smile_user:simple_pass@localhost:5432/smile_new_db` | For docker-compose.local.yml |
| `AUTH_SECRET` | (generated above) | Must be unique per developer |
| `NEXTAUTH_SECRET` | (same as AUTH_SECRET) | Legacy compatibility |
| `NEXTAUTH_URL` | `http://localhost:3000` | Local dev URL |
| `DISABLE_WORKERS` | `true` | Simplifies local dev |

#### Optional Variables (for specific features)

| Feature | Variables Needed | How to Get |
|---------|-----------------|------------|
| AI Evaluation | `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` | Ask team lead |
| Google Sign-In | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Ask team lead or create at [Google Console](https://console.cloud.google.com/apis/credentials) |
| Email | `SMTP_USER`, `SMTP_PASSWORD` | Ask team lead or use [Mailtrap](https://mailtrap.io) |
| Background Jobs | `REDIS_URL` + set `DISABLE_WORKERS=false` | Run Redis via Docker |

### Example Minimal `.env.local`

```env
# Required
AUTH_SECRET="your-generated-secret-here"
NEXTAUTH_SECRET="same-as-auth-secret"
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=postgresql://smile_user:simple_pass@localhost:5432/smile_new_db

# Recommended for simpler dev
DISABLE_WORKERS=true
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Database Setup

### Option A: Docker (Recommended)

```bash
# Use the local development docker-compose (simpler, no external volumes needed)
docker-compose -f docker-compose.local.yml up -d

# Verify containers are running
docker ps
# Should show: smile-postgres-local, smile-redis-local

# Initialize database
npm run db:generate  # Generate Prisma client
npm run db:push      # Create tables
npm run db:seed      # Add test data (optional)
```

**Note**: `docker-compose.local.yml` uses standard ports (5432 for PostgreSQL, 6379 for Redis).

If you need to use the main `docker-compose.yml` (which uses port 5435):

```bash
# Create the required volumes first
docker volume create app_postgres_data
docker volume create app_redis_data

# Then start containers
docker-compose up -d db redis
```

### Option B: Local PostgreSQL

```bash
# macOS with Homebrew
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb smile_new_db

# Update .env.local
DATABASE_URL="postgresql://$(whoami)@localhost:5432/smile_new_db"
```

### Option C: No Database (UI Only)

You can run the frontend without a database for UI work:

```bash
# Just generates Prisma client (no DB connection needed)
npm run db:generate

# Run dev server - static pages will work, auth/data pages will error
npm run dev
```

---

## Running the Application

### Development Server

```bash
# Standard development mode
npm run dev

# With specific port
PORT=3001 npm run dev

# Without background workers (recommended)
DISABLE_WORKERS=true npm run dev
```

### Test Accounts (after running db:seed)

| Email | Password | Role |
|-------|----------|------|
| `superadmin@smile.test` | `Test1234!` | Super Admin |
| `admin@smile.test` | `Test1234!` | Admin |
| `teacher1@smile.test` | `Test1234!` | Teacher |
| `student1@smile.test` | `Test1234!` | Student |

### Useful Commands

```bash
# Setup & Database
npm run setup              # Full setup (Docker + DB + seed)
npm run setup:reset        # Reset everything and start fresh
npm run db:reset           # Reset database only (keeps containers)
npm run db:studio          # Visual database browser

# Development
npm run dev                # Standard dev server
npm run dev:simple         # Dev server without workers (simpler)

# Code Quality
npm run lint               # Run linting
npm run type-check         # Run TypeScript checks
npm run test               # Run unit tests
npm run test:e2e           # Run e2e tests (requires running server)
```

---

## Development Modes

### 1. Minimal Mode (UI Development)

Best for: Frontend work, styling, component development

```bash
# No Docker needed, some pages will error
npm run db:generate
DISABLE_WORKERS=true npm run dev
```

Features working:
- ✅ Static pages (home, about, login UI)
- ❌ Authentication (no database)
- ❌ Any data-dependent features

### 2. Standard Mode (Most Development)

Best for: Feature development, bug fixes

```bash
# Start dependencies
docker-compose up -d db redis

# Setup and run
npm run db:push
npm run db:seed
DISABLE_WORKERS=true npm run dev
```

Features working:
- ✅ All static pages
- ✅ Authentication
- ✅ CRUD operations
- ❌ AI evaluations (no API keys)

### 3. Full Mode (AI Features)

Best for: Working on AI evaluation, question scoring

```bash
# Ensure you have API keys in .env.local
# OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...
# DISABLE_WORKERS=false

docker-compose up -d db redis
npm run dev
```

Features working:
- ✅ Everything

---

## Database Initialization Strategy

### How SMILE Handles Database Setup

This project uses **Prisma** as the ORM, so database schema is managed via Prisma rather than raw SQL scripts.

```
┌─────────────────────────────────────────────────────────────────┐
│  Docker Compose starts PostgreSQL container                    │
│  └── Creates empty database: smile_new_db                       │
├─────────────────────────────────────────────────────────────────┤
│  npm run db:push (Prisma)                                       │
│  └── Creates all tables from prisma/schema.prisma              │
├─────────────────────────────────────────────────────────────────┤
│  npm run db:seed (Prisma)                                       │
│  └── Populates test data from prisma/seed.ts                   │
└─────────────────────────────────────────────────────────────────┘
```

### Why Prisma Instead of SQL Init Scripts?

| Approach | Pros | Cons |
|----------|------|------|
| **Prisma (our choice)** | Type-safe, schema in code, migrations | Requires Node.js |
| **SQL Init Scripts** | Pure SQL, runs automatically | No type safety, manual sync |

### Alternative: SQL Init Scripts (For Reference)

If you needed SQL init scripts (for a non-Prisma project), you would:

1. Create SQL files in `scripts/db/init/`:
```sql
-- scripts/db/init/01-schema.sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL
);

-- scripts/db/init/02-seed.sql  
INSERT INTO users (email) VALUES ('admin@test.com');
```

2. Mount in docker-compose:
```yaml
volumes:
  - ./scripts/db/init:/docker-entrypoint-initdb.d:ro
```

PostgreSQL automatically runs `.sql` files in `/docker-entrypoint-initdb.d/` alphabetically on first container creation.

### Exporting Current Schema as SQL

If you ever need the raw SQL schema:

```bash
# Export current database schema
npx prisma db pull
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > schema.sql
```

---

## Troubleshooting

### Common Issues

#### "Environment variable not found: DATABASE_URL"

**Cause**: Prisma only reads `.env` files, not `.env.local` (which is a Next.js convention).

**Solution**: Create a symlink so Prisma can read your config:
```bash
ln -sf .env.local .env
```

Or set the variable inline:
```bash
DATABASE_URL="postgresql://smile_user:simple_pass@localhost:5432/smile_new_db" npm run db:push
```

> **Note**: The `npm run setup` script creates this symlink automatically.

#### "Can't reach database server at localhost:5432"

**Cause**: PostgreSQL is not running or wrong port.

**Solutions**:
```bash
# Check if Docker container is running
docker ps | grep smile-postgres

# If not running, start it
docker-compose up -d db

# Verify the port in your DATABASE_URL
# Docker uses 5435, local PostgreSQL uses 5432
```

#### "ECONNREFUSED" for Redis/Bull Queue

**Cause**: Redis is not running.

**Solution**: Either start Redis or disable workers:
```bash
# Option A: Start Redis
docker-compose up -d redis

# Option B: Disable workers
DISABLE_WORKERS=true npm run dev
```

#### "Port 3000 is in use"

**Solution**: Use a different port:
```bash
PORT=3001 npm run dev
```

#### Prisma version warning

You may see: `configuration property package.json#prisma is deprecated`

**Solution**: This is a warning, not an error. The app will work fine. We'll update to Prisma config file in a future update.

### Reset Everything

If things get stuck, reset completely:

```bash
# Stop all containers
docker-compose down

# Remove volumes (⚠️ deletes all data)
docker volume rm app_postgres_data app_redis_data

# Recreate
docker volume create app_postgres_data
docker volume create app_redis_data
docker-compose up -d db redis

# Reinitialize
npm run db:push
npm run db:seed
```

---

## Sharing Secrets Securely

### DO NOT share `.env.local` directly!

It may contain sensitive API keys that shouldn't be in chat/email.

### Recommended Approaches

#### 1. Team Secret Manager (Best)

Use a service like:
- **1Password Teams** - Shared vault for dev secrets
- **Doppler** - Built specifically for env vars
- **Notion** (private page) - Simple for small teams

#### 2. Encrypted File (Git-friendly)

```bash
# Encrypt (person with secrets)
openssl enc -aes-256-cbc -salt -pbkdf2 -in .env.local -out .env.local.enc

# Share the password through secure channel (DM, 1Password)

# Decrypt (new developer)
openssl enc -aes-256-cbc -d -pbkdf2 -in .env.local.enc -out .env.local
```

#### 3. Variable Categories

| Category | How to Share |
|----------|-------------|
| **Generated locally** (AUTH_SECRET) | Each dev generates their own |
| **Team shared** (API keys) | Store in password manager |
| **Infrastructure** (DATABASE_URL) | Documented in .env.example |

---

## For AI Agents

### Key Files to Read
- `.env.example` - Environment template with instructions
- `prisma/schema.prisma` - Database schema
- `package.json` - Available scripts
- `docker-compose.yml` - Infrastructure setup

### Quick Diagnostic Commands
```bash
# Check Node version
node --version  # Should be 20+

# Check if dependencies installed
ls node_modules/.prisma/client  # Should exist after npm install

# Check database connection
npx prisma db pull  # Will fail if no connection

# Check Docker status
docker ps  # Should show smile-postgres, smile-redis
```

### Common Fixes
1. "DATABASE_URL not found" → Run with `DATABASE_URL="..." npm run db:push`
2. "Cannot find @prisma/client" → Run `npm run db:generate`
3. "Redis connection refused" → Set `DISABLE_WORKERS=true`
4. Build fails → Check `npm run type-check` for TypeScript errors

---

## See Also

- [Environment Variables Reference](./ENVIRONMENT_VARIABLES.md)
- [Development Guide](./DEVELOPMENT.md)
- [Architecture Overview](./ARCHITECTURE.md)
- [AI Documentation System](./ai-docs/README.md)
