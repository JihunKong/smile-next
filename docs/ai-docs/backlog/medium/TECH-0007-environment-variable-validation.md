---
id: TECH-0007
title: Validate environment variables at application startup
status: backlog
priority: medium
category: tech-debt
component: configuration
created: 2026-01-18
updated: 2026-01-18
effort: s
assignee: ai-agent
---

# Validate Environment Variables at Startup

## Summary

Environment variables are used throughout the codebase but not validated at startup. Missing or malformed env vars cause cryptic runtime errors deep in the application. A Zod schema can validate all required env vars when the app starts, providing clear error messages.

## Current Behavior

```typescript
// Variables are accessed directly without validation
process.env.DATABASE_URL     // Could be undefined
process.env.NEXTAUTH_SECRET  // Could be missing
process.env.ANTHROPIC_API_KEY // Runtime error if missing
```

The `instrumentation.ts` validates some vars for workers, but not all required vars.

## Expected Behavior

```typescript
// Validated at app startup
import { env } from '@/lib/env'

env.DATABASE_URL      // TypeScript knows this exists
env.ANTHROPIC_API_KEY // Runtime validated, properly typed
```

If validation fails:
```
❌ Environment validation failed:
  - DATABASE_URL: Required
  - NEXTAUTH_SECRET: Required, minimum 32 characters
  - STRIPE_SECRET_KEY: Invalid format, must start with 'sk_'
```

## Acceptance Criteria

- [ ] Create `src/lib/env.ts` with Zod schema for all env vars
- [ ] Validate at app startup (before any routes run)
- [ ] Provide clear error messages for missing/invalid vars
- [ ] Export typed `env` object for use throughout app
- [ ] Document all environment variables
- [ ] Differentiate required vs optional vars

## Technical Approach

### 1. Create Environment Schema

```typescript
// src/lib/env.ts
import { z } from 'zod'

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),

  // Authentication
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  NEXTAUTH_URL: z.string().url().optional(),

  // OAuth (optional in dev)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // AI Services
  ANTHROPIC_API_KEY: z.string().startsWith('sk-ant-', 'ANTHROPIC_API_KEY must start with sk-ant-').optional(),
  OPENAI_API_KEY: z.string().startsWith('sk-', 'OPENAI_API_KEY must start with sk-').optional(),

  // Redis (optional)
  REDIS_URL: z.string().url().optional(),

  // Stripe (optional)
  STRIPE_SECRET_KEY: z.string().startsWith('sk_').optional(),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_').optional(),

  // Email (optional)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),

  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  DISABLE_WORKERS: z.string().transform(v => v === 'true').default('false'),
})

// Validate and export
function validateEnv() {
  const parsed = envSchema.safeParse(process.env)

  if (!parsed.success) {
    console.error('❌ Environment validation failed:')
    parsed.error.issues.forEach(issue => {
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`)
    })
    
    // In production, exit immediately
    if (process.env.NODE_ENV === 'production') {
      process.exit(1)
    }
    
    throw new Error('Environment validation failed')
  }

  return parsed.data
}

export const env = validateEnv()

// Type for use in the app
export type Env = z.infer<typeof envSchema>
```

### 2. Import Early in App

```typescript
// src/instrumentation.ts (or src/app/layout.tsx for client-side awareness)
import '@/lib/env' // Validates on import

export async function register() {
  // ... existing code
}
```

### 3. Use Throughout App

```typescript
// Instead of process.env
import { env } from '@/lib/env'

// Type-safe access
const apiKey = env.ANTHROPIC_API_KEY // string | undefined, properly typed
const dbUrl = env.DATABASE_URL // string, guaranteed

// Conditional features based on optional vars
if (env.STRIPE_SECRET_KEY) {
  initializeStripe(env.STRIPE_SECRET_KEY)
}
```

### 4. Development vs Production

```typescript
// Add development defaults for optional features
const envSchema = z.object({
  // Required in production, optional in dev
  STRIPE_SECRET_KEY: process.env.NODE_ENV === 'production'
    ? z.string().startsWith('sk_')
    : z.string().startsWith('sk_').optional(),
})
```

## Related Files

- `src/instrumentation.ts` - Partial validation exists
- `environment.txt` - Documentation template
- All files using `process.env`

## Dependencies

**Blocked By:**
- None

**Blocks:**
- None

## Notes

- Zod is already installed in the project
- Consider using `t3-env` package for more features
- Don't log secret values, even in errors
- Update `environment.txt` with all validated vars

## Conversation History

| Date | Note |
|------|------|
| 2026-01-18 | Initial creation based on codebase analysis |
