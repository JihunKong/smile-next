# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository

**GitHub**:
- `JihunKong/smile-next` (Main development)
- `Seeds-SMILE/new_smile_flask` (Branch: `nextjs_migration`)

**Remote**: `origin` (JihunKong), `seeds-smile` (Seeds-SMILE)

---

## SMILE Next.js Development Protocol

### Server Architecture

```
                      ┌─────────────────────────────────────────┐
                      │          Nginx Reverse Proxy            │
                      │     (SSL Termination + Load Balance)    │
                      └─────────────────────────────────────────┘
                                        │
              ┌─────────────────────────┴─────────────────────────┐
              │                                                   │
              ▼                                                   ▼
┌──────────────────────────────┐            ┌──────────────────────────────┐
│     BLUE (Development)       │            │     GREEN (Production)       │
│     Port 3001                │            │     Port 3000                │
│     smile-app-blue           │            │     smile-app-green          │
│                              │            │                              │
│ always.seedsofempowerment.org│            │ (Future deployment)          │
└──────────────────────────────┘            └──────────────────────────────┘
```

### Server Information

| Environment | Server | IP Address | Domain | Port |
|-------------|--------|------------|--------|------|
| **BLUE (Dev)** | smilealways (GCP) | 34.31.218.90 | always.seedsofempowerment.org | 3001 |
| **GREEN (Prod)** | TBD | TBD | TBD | 3000 |
| **AWS Legacy** | smile-next | 13.209.198.95 | smile.seedsofempowerment.org | 80 |

### GCP Project Details

| Item | Value |
|------|-------|
| Project | smile-coach2 |
| Zone | us-central1-a |
| VM Instance | smilealways |
| Claude Code User | digitalschema |

---

## Development Workflow

### 1. Local Development
```bash
cd smile-next
npm run dev                     # Port 3000
```

### 2. Deploy to BLUE (Development)
```bash
# SSH to GCP server
gcloud compute ssh smilealways --zone=us-central1-a --project=smile-coach2

# Switch to digitalschema user
sudo -u digitalschema -i

# Deploy
cd /opt/smile/app
git pull origin main
docker compose -f docker-compose.blue.yml up -d --build

# Verify
curl http://localhost:3001/api/health
```

### 3. Test on BLUE
- URL: https://always.seedsofempowerment.org
- Admin: admin0@seedsofempowerment.org / SMILEis#1LMS

### 4. Push to GitHub
```bash
git add .
git commit -m "feat: description"
git push origin main
git push seeds-smile main:nextjs_migration
```

---

## Tech Stack

- **Frontend**: Next.js 16 + React 19 + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes + Prisma ORM
- **Database**: PostgreSQL 15 (via Docker)
- **Cache**: Redis 7 (via Docker)
- **AI**: OpenAI GPT + Anthropic Claude
- **Auth**: NextAuth.js
- **Deployment**: Docker + Nginx + Let's Encrypt

## Project Structure

```
smile-next/                    # ACTIVE - Next.js application
├── src/
│   ├── app/                   # App Router pages & API routes
│   │   ├── (dashboard)/       # Dashboard pages (groups, activities, etc.)
│   │   ├── (public)/          # Public pages
│   │   ├── api/               # API routes
│   │   └── auth/              # Authentication pages
│   ├── components/            # Reusable React components
│   ├── lib/                   # Utilities, services, AI integrations
│   └── types/                 # TypeScript type definitions
├── prisma/
│   └── schema.prisma          # Database schema
├── scripts/
│   ├── deploy-blue.sh         # Blue environment deployment
│   └── setup-blue.sh          # Initial Blue setup
├── docker-compose.blue.yml    # Blue environment Docker config
├── docker-compose.prod.yml    # Production Docker config
└── Dockerfile                 # Multi-stage Docker build
```

## Development Commands

```bash
# Start development server
npm run dev                     # Port 3000

# Build for production
npm run build

# Database operations
npx prisma generate             # Generate Prisma client
npx prisma db push              # Push schema changes
npx prisma studio               # Database GUI

# Docker operations (on server)
docker compose -f docker-compose.blue.yml ps
docker compose -f docker-compose.blue.yml logs -f --tail=50 app-blue
docker compose -f docker-compose.blue.yml restart app-blue
```

## Key Files

| File | Description |
|------|-------------|
| `src/app/api/` | API routes |
| `src/lib/ai/openai.ts` | OpenAI integration |
| `src/lib/ai/prompts.ts` | AI prompts (Bloom's Taxonomy) |
| `prisma/schema.prisma` | Database schema (32 tables) |
| `docker-compose.blue.yml` | Blue environment Docker config |
| `.env.blue.example` | Environment variables template |

## Environment Variables

Required in `.env` (local) or `.env.blue` (server):
```
DATABASE_URL=postgresql://smile_user:password@db:5432/smile_db
REDIS_URL=redis://redis:6379
AUTH_SECRET=<generated-secret>
NEXTAUTH_URL=https://always.seedsofempowerment.org
NEXT_PUBLIC_APP_URL=https://always.seedsofempowerment.org
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

## Admin Accounts

| Username | Email | Password | Role |
|----------|-------|----------|------|
| admin0 | admin0@seedsofempowerment.org | SMILEis#1LMS | Super Admin |
| admin1 | admin1@seedsofempowerment.org | SMILEis#1LMS | Admin |

## Related NEWSMILE Servers (Flask - Reference Only)

| Environment | IP | Domain | Notes |
|-------------|-----|--------|-------|
| DEV-BLUE | 34.9.189.51:5002 | newsmile-dev-blue.seedsofempowerment.org | Development |
| DEV-GREEN | 34.9.189.51:5001 | newsmile-dev.seedsofempowerment.org | Testing |
| PROD-BLUE | 34.171.142.53:5002 | smilenew-blue.seedsofempowerment.org | Production Blue |
| PROD-GREEN | 34.171.142.53:5001 | newsmile.seedsofempowerment.org | Production |

---

## Known Issues (Technical Debt)

- Redis connection errors during build (normal - Redis not running locally)
- Docker build requires dummy env vars for Next.js static generation

---

*Last updated: 2026-01-17*
