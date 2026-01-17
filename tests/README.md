# Test Structure

This directory contains all tests for the SMILE Next.js application.

## Directory Structure

```
tests/
├── unit/           # Unit tests (Vitest)
│   └── lib/        # Mirrors src/lib/ structure
│       └── utils/  # Test files mirror source structure
├── e2e/            # End-to-end tests (Playwright)
│   ├── fixtures/   # Test fixtures and helpers
│   └── modes/     # Mode-specific E2E tests
└── setup.ts        # Global test setup for Vitest
```

## Test Organization Principles

1. **Separate from source code**: Tests are kept in `tests/` directory, not co-located with source files
   - ✅ Better for AI/LLM codebase understanding
   - ✅ Cleaner source code navigation
   - ✅ Clear separation of concerns

2. **Mirror source structure**: Unit tests mirror the `src/` directory structure
   - `src/lib/utils/keywordMatcher.ts` → `tests/unit/lib/utils/keywordMatcher.test.ts`
   - Makes it easy to find tests for any source file

3. **Type-safe imports**: Use `@/` path alias for imports
   - `import { ... } from '@/lib/utils/keywordMatcher'`

## Running Tests

### Unit Tests (Vitest)
```bash
npm run test              # Run once
npm run test:watch       # Watch mode
npm run test:ui          # UI mode
npm run test:coverage    # With coverage
```

### E2E Tests (Playwright)
```bash
npm run test:e2e         # Run all E2E tests
npm run test:e2e:ui      # UI mode
npm run test:e2e:headed  # Headed browser
npm run test:e2e:debug   # Debug mode
```

### All Tests
```bash
npm run test:all        # Run unit + E2E tests
npm run test:ci         # CI mode (lint + type-check + all tests)
```

## Writing Tests

### Unit Test Example
```typescript
// tests/unit/lib/utils/keywordMatcher.test.ts
import { describe, it, expect } from 'vitest'
import { findBestMatch } from '@/lib/utils/keywordMatcher'

describe('keywordMatcher', () => {
  it('should find exact match', () => {
    const result = findBestMatch('education', 'This is about education')
    expect(result.matched).toBe(true)
  })
})
```

### E2E Test Example
```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test('should login successfully', async ({ page }) => {
  await page.goto('/auth/login')
  // ... test code
})
```

## Why This Structure?

### For AI/LLM Codebase Understanding
- **Clear separation**: Source code (`src/`) is separate from tests (`tests/`)
- **Easy navigation**: LLMs can focus on source code without test file noise
- **Predictable structure**: Tests mirror source, making it easy to find related tests

### For Developers
- **Clean source tree**: `src/` only contains production code
- **Organized tests**: All tests in one place
- **Easy discovery**: Mirror structure makes finding tests intuitive
