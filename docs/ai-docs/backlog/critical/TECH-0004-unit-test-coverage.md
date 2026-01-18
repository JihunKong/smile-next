---
id: TECH-0004
title: Add unit test coverage for services and business logic
status: backlog
priority: critical
category: tech-debt
component: testing
created: 2026-01-18
updated: 2026-01-18
effort: xl
assignee: ai-agent
---

# Add Unit Test Coverage for Services

## Summary

The codebase has **only 1 unit test file** (`keywordMatcher.test.ts`) despite having 150+ API routes and 20+ services. This creates significant risk for regressions and makes refactoring dangerous. E2E tests exist but don't provide the granular coverage needed for business logic validation.

## Current Behavior

- Single unit test file: `tests/unit/lib/utils/keywordMatcher.test.ts`
- Zero tests for any of the 20+ services in `src/lib/services/`
- Zero tests for queue workers, AI evaluation logic, or critical business operations
- CI/CD pipeline doesn't run tests before deployment

## Expected Behavior

Comprehensive unit test coverage for critical services:

```
tests/unit/
├── lib/
│   ├── services/
│   │   ├── activityPointsService.test.ts
│   │   ├── caseEvaluationService.test.ts
│   │   ├── examCoachingService.test.ts
│   │   ├── levelService.test.ts
│   │   ├── permissionService.test.ts
│   │   ├── streakService.test.ts
│   │   └── subscriptionService.test.ts
│   ├── queue/
│   │   ├── evaluationWorker.test.ts
│   │   └── responseEvaluationWorker.test.ts
│   └── utils/
│       └── keywordMatcher.test.ts  # Existing
```

## Acceptance Criteria

- [ ] Test coverage for critical services (aim for 70%+ on new tests):
  - [ ] `levelService.ts` - Point calculations, tier progression
  - [ ] `streakService.ts` - Streak tracking, badge earning
  - [ ] `permissionService.ts` - Role/permission checks
  - [ ] `subscriptionService.ts` - Usage limits, plan validation
  - [ ] `activityPointsService.ts` - Point awarding logic
- [ ] Test coverage for AI evaluation:
  - [ ] `caseEvaluationService.ts` - Scoring logic
  - [ ] `responseEvaluationWorker.ts` - Queue processing
- [ ] Test utilities and mocking patterns established
- [ ] Vitest coverage report shows > 50% overall coverage
- [ ] CI/CD updated to fail on coverage regression

## Technical Approach

### 1. Setup Test Utilities

```typescript
// tests/utils/db-mock.ts
import { vi } from 'vitest'
import { prisma } from '@/lib/db/prisma'

export function mockPrisma() {
  return {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
      // ...
    },
    // ... other models
  }
}

export function createMockUser(overrides = {}) {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    roleId: 3,
    ...overrides,
  }
}
```

### 2. Example Service Test

```typescript
// tests/unit/lib/services/levelService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { calculateTierProgress, getNextTier } from '@/lib/services/levelService'

describe('levelService', () => {
  describe('calculateTierProgress', () => {
    it('should calculate progress within a tier', () => {
      const progress = calculateTierProgress(150) // 150 points
      expect(progress.currentTier).toBe('CURIOUS_STARTER')
      expect(progress.tierProgress).toBeGreaterThan(0)
      expect(progress.tierProgress).toBeLessThan(1)
    })

    it('should return 1.0 progress at tier boundary', () => {
      const progress = calculateTierProgress(500) // Exact boundary
      expect(progress.tierProgress).toBe(1)
    })
  })

  describe('getNextTier', () => {
    it('should return next tier for valid current tier', () => {
      expect(getNextTier('CURIOUS_STARTER')).toBe('EMERGING_THINKER')
    })

    it('should return null for max tier', () => {
      expect(getNextTier('VISIONARY_LEADER')).toBeNull()
    })
  })
})
```

### 3. Mock External Dependencies

```typescript
// tests/unit/lib/services/subscriptionService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkUsageLimits, incrementUsage } from '@/lib/services/subscriptionService'

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    subscription: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}))

describe('subscriptionService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('checkUsageLimits', () => {
    it('should return true when under limit', async () => {
      const mockSub = { aiEvaluationsUsed: 50, plan: { aiEvaluations: 100 } }
      prisma.subscription.findFirst.mockResolvedValue(mockSub)
      
      const result = await checkUsageLimits('user-id', 'aiEvaluations')
      expect(result.withinLimit).toBe(true)
      expect(result.remaining).toBe(50)
    })

    it('should return false when at limit', async () => {
      const mockSub = { aiEvaluationsUsed: 100, plan: { aiEvaluations: 100 } }
      prisma.subscription.findFirst.mockResolvedValue(mockSub)
      
      const result = await checkUsageLimits('user-id', 'aiEvaluations')
      expect(result.withinLimit).toBe(false)
    })
  })
})
```

## Priority Order

1. **Phase 1**: Permission & subscription services (security-critical)
2. **Phase 2**: Level, streak, points services (gamification)
3. **Phase 3**: AI evaluation workers (core functionality)
4. **Phase 4**: Remaining services and utilities

## Related Files

- `tests/setup.ts` - Test configuration
- `vitest.config.ts` - Vitest configuration
- `src/lib/services/` - All service files to test

## Dependencies

**Blocked By:**
- None

**Blocks:**
- TECH-0006 (CI Pipeline Testing) - needs tests to run

## Notes

- Use `vitest` which is already configured
- Mock Prisma at the module level for unit tests
- E2E tests cover integration; unit tests focus on business logic
- Consider property-based testing for calculation-heavy services

## Conversation History

| Date | Note |
|------|------|
| 2026-01-18 | Initial creation based on codebase analysis |
