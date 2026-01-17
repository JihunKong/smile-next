# Environment Variables Reference

Complete list of all environment variables used in the SMILE Next.js application.

## Critical Variables (Build/Runtime Failures)

These variables **must** be set or the application will fail to build or run:

| Variable | Required For | Location | Notes |
|----------|--------------|----------|-------|
| `DATABASE_URL` | Build & Runtime | `prisma/schema.prisma` | Prisma schema requires this. Format: `postgresql://user:password@host:port/database` |
| `AUTH_SECRET` | Runtime | `src/lib/auth/config.ts` | NextAuth.js secret. Generate with: `openssl rand -base64 32`. Also checks `NEXTAUTH_SECRET` |
| `GOOGLE_CLIENT_ID` | Runtime | `src/lib/auth/config.ts` | Required if using Google OAuth (used with `!` assertion) |
| `GOOGLE_CLIENT_SECRET` | Runtime | `src/lib/auth/config.ts` | Required if using Google OAuth (used with `!` assertion) |

## Required for Queue Workers

These are required if running background workers (`scripts/start-workers.ts`):

| Variable | Required For | Location | Notes |
|----------|--------------|----------|-------|
| `REDIS_URL` | Workers | `scripts/start-workers.ts`, `src/lib/queue/bull.ts` | Bull queue connection. Format: `redis://host:port` |
| `ANTHROPIC_API_KEY` | Workers | `scripts/start-workers.ts` | Claude AI API key for evaluation workers |

## Highly Recommended (Features Disabled Without)

| Variable | Used In | Default | Notes |
|----------|---------|---------|-------|
| `NEXTAUTH_URL` | Multiple API routes | `http://localhost:3000` | OAuth callbacks, email verification links |
| `NEXT_PUBLIC_APP_URL` | Client-side code | `http://localhost:3000` | Public app URL for links, QR codes |
| `OPENAI_API_KEY` | AI services | None | Required for AI features (questions, evaluation, analytics) |
| `SMTP_HOST` | Email service | `smtp.gmail.com` | SMTP server hostname |
| `SMTP_PORT` | Email service | `587` | SMTP server port |
| `SMTP_USER` | Email service | None | SMTP username (usually email address) |
| `SMTP_PASSWORD` | Email service | None | SMTP password (use app password for Gmail) |
| `EMAIL_FROM` | Email service | `SMILE <noreply@seedsofempowerment.org>` | From address for emails |

## Optional Variables

| Variable | Used In | Default | Notes |
|----------|---------|---------|-------|
| `AUTH_TRUST_HOST` | NextAuth | `false` | Set to `true` in production behind reverse proxy |
| `OPENAI_MODEL` | AI services | `gpt-4o` or `gpt-4o-mini` | OpenAI model selection |
| `ANTHROPIC_MODEL` | AI services | `claude-sonnet-4-5-20250929` | Claude model selection |
| `STRIPE_SECRET_KEY` | Subscriptions | None | Stripe API key for payment features |
| `STRIPE_WEBHOOK_SECRET` | Subscriptions | None | Stripe webhook secret |
| `INTERNAL_API_KEY` | Internal APIs | None | Used in `/api/points/award` route |
| `CONTACT_EMAIL` | Contact form | `SMTP_USER` or `admin@seedsofempowerment.org` | Admin notification email |
| `NEXT_PUBLIC_APP_VERSION` | Admin panel | `1.0.0` | App version display |
| `DISABLE_WORKERS` | Instrumentation | `false` | Set to `"true"` to disable background workers |
| `NODE_ENV` | Multiple | `development` | Usually set automatically |
| `PORT` | Server | `3000` | Server port (set in Dockerfile) |
| `HOSTNAME` | Server | `0.0.0.0` | Server hostname (set in Dockerfile) |

## Development/Testing Only

| Variable | Used In | Notes |
|----------|---------|-------|
| `PLAYWRIGHT_BASE_URL` | E2E tests | Base URL for Playwright tests |
| `CI` | CI/CD | Set automatically by CI systems |
| `NEXT_RUNTIME` | Next.js | Set automatically by Next.js |

## Build-Time Variables (Dockerfile Only)

These are set during Docker build and don't need to be in `.env.local`:

- `NEXT_TELEMETRY_DISABLED` - Set to `1` in Dockerfile
- `NODE_OPTIONS` - Set to `--max-old-space-size=1536` in Dockerfile

## Complete List (Alphabetical)

1. `ANTHROPIC_API_KEY` ⚠️ (workers)
2. `ANTHROPIC_MODEL`
3. `AUTH_SECRET` ⚠️
4. `AUTH_TRUST_HOST`
5. `CI`
6. `CONTACT_EMAIL`
7. `DATABASE_URL` ⚠️
8. `DISABLE_WORKERS`
9. `EMAIL_FROM`
10. `GOOGLE_CLIENT_ID` ⚠️
11. `GOOGLE_CLIENT_SECRET` ⚠️
12. `HOSTNAME`
13. `INTERNAL_API_KEY`
14. `NEXT_PUBLIC_APP_URL`
15. `NEXT_PUBLIC_APP_VERSION`
16. `NEXT_RUNTIME`
17. `NEXTAUTH_SECRET` (alternative to AUTH_SECRET)
18. `NEXTAUTH_URL`
19. `NODE_ENV`
20. `OPENAI_API_KEY`
21. `OPENAI_MODEL`
22. `PLAYWRIGHT_BASE_URL`
23. `PORT`
24. `REDIS_URL` ⚠️ (workers)
25. `SMTP_HOST`
26. `SMTP_PASSWORD`
27. `SMTP_PORT`
28. `SMTP_USER`
29. `STRIPE_SECRET_KEY`
30. `STRIPE_WEBHOOK_SECRET`

## Usage by Feature

### Authentication
- `AUTH_SECRET` / `NEXTAUTH_SECRET` ⚠️
- `NEXTAUTH_URL`
- `AUTH_TRUST_HOST`
- `GOOGLE_CLIENT_ID` ⚠️
- `GOOGLE_CLIENT_SECRET` ⚠️

### Database
- `DATABASE_URL` ⚠️

### Queue/Workers
- `REDIS_URL` ⚠️
- `ANTHROPIC_API_KEY` ⚠️
- `ANTHROPIC_MODEL`
- `DISABLE_WORKERS`

### AI Services
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `ANTHROPIC_API_KEY` ⚠️
- `ANTHROPIC_MODEL`

### Email
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `EMAIL_FROM`
- `CONTACT_EMAIL`

### Payments
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

### Internal APIs
- `INTERNAL_API_KEY`

### Client-Side
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_APP_VERSION`

## See Also

- `env.template` - Complete template file with all variables and descriptions
- `Dockerfile` - Build-time environment variables
- `scripts/start-workers.ts` - Worker-specific requirements
