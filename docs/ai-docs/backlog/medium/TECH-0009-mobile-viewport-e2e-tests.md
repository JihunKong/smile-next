---
id: TECH-0009
title: Add mobile viewport E2E testing
status: backlog
priority: medium
category: tech-debt
component: testing
created: 2026-01-18
updated: 2026-01-18
effort: s
assignee: ai-agent
---

# Add Mobile Viewport E2E Testing

## Summary

The Playwright configuration only tests `Desktop Chrome`. No mobile viewport testing exists despite the application likely having mobile users. Adding at least one mobile device project will catch responsive design issues before they reach production.

## Current Behavior

```typescript
// playwright.config.ts
projects: [
  { name: 'setup', testMatch: /.*\.setup\.ts/ },
  { name: 'chromium', use: { ...devices['Desktop Chrome'] }, dependencies: ['setup'] },
  // Firefox and WebKit commented out
]
```

Only desktop Chrome (1280x720 viewport) is tested.

## Expected Behavior

Test on multiple viewports:
- Desktop Chrome (existing)
- Mobile Chrome (Android)
- Mobile Safari (iOS) - optional

## Acceptance Criteria

- [ ] Add Mobile Chrome project to Playwright config
- [ ] Ensure existing tests pass on mobile viewport
- [ ] Add mobile-specific test cases for:
  - [ ] Navigation menu (hamburger menu)
  - [ ] Touch interactions
  - [ ] Form inputs on mobile
- [ ] Optional: Add tablet viewport

## Technical Approach

### 1. Update Playwright Config

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  // ... existing config

  projects: [
    // Setup
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    // Desktop
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },

    // Mobile Android
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      dependencies: ['setup'],
    },

    // Mobile iOS (optional - requires WebKit)
    // {
    //   name: 'mobile-safari',
    //   use: { ...devices['iPhone 12'] },
    //   dependencies: ['setup'],
    // },

    // Tablet (optional)
    // {
    //   name: 'tablet',
    //   use: { ...devices['iPad (gen 7)'] },
    //   dependencies: ['setup'],
    // },
  ],
})
```

### 2. Mobile-Specific Test Helpers

```typescript
// tests/e2e/fixtures/mobile.fixture.ts
import { test as base } from '@playwright/test'

export const test = base.extend({
  isMobile: async ({ page }, use) => {
    const viewport = page.viewportSize()
    await use(viewport ? viewport.width < 768 : false)
  },
})

// Usage in tests
test('navigation works on mobile', async ({ page, isMobile }) => {
  await page.goto('/dashboard')
  
  if (isMobile) {
    // Open hamburger menu
    await page.click('[data-testid="mobile-menu-button"]')
    await page.waitForSelector('[data-testid="mobile-menu"]')
  }
  
  await page.click('text=Activities')
  await expect(page).toHaveURL('/activities')
})
```

### 3. Responsive Test Cases

```typescript
// tests/e2e/responsive.spec.ts
import { test, expect, devices } from '@playwright/test'

test.describe('Responsive Design', () => {
  test('dashboard renders correctly on mobile', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Check mobile-specific elements
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible()
    
    // Check layout doesn't overflow
    const body = page.locator('body')
    const bodyBox = await body.boundingBox()
    const viewportSize = page.viewportSize()
    
    expect(bodyBox?.width).toBeLessThanOrEqual(viewportSize?.width || 0)
  })

  test('forms are usable on mobile', async ({ page }) => {
    await page.goto('/activities/create')
    
    // Check input fields are properly sized
    const inputs = page.locator('input, textarea')
    for (const input of await inputs.all()) {
      const box = await input.boundingBox()
      // Inputs should be at least 44px tall for touch targets
      expect(box?.height).toBeGreaterThanOrEqual(44)
    }
  })

  test('touch targets are adequate size', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Check buttons meet minimum touch target size (44x44)
    const buttons = page.locator('button')
    for (const button of await buttons.all()) {
      const box = await button.boundingBox()
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44)
        expect(box.height).toBeGreaterThanOrEqual(44)
      }
    }
  })
})
```

### 4. Add Mobile Tags to Existing Tests

```typescript
// Skip certain tests on mobile if not applicable
test('desktop-only feature works', async ({ page, isMobile }) => {
  test.skip(isMobile, 'This feature is desktop-only')
  // ... test code
})
```

## CI Configuration

```yaml
# Run mobile tests in parallel with desktop
- name: Run E2E Tests
  run: |
    npx playwright test --project=chromium --project=mobile-chrome
```

## Related Files

- `playwright.config.ts` - Configuration to update
- `tests/e2e/**/*.spec.ts` - Existing tests to verify
- Components with responsive breakpoints

## Dependencies

**Blocked By:**
- None

**Blocks:**
- None

## Notes

- Mobile tests will increase CI time (~1.5x)
- Consider running mobile tests only on PRs to main
- Playwright handles touch emulation automatically
- May need to add data-testid to mobile menu components

## Conversation History

| Date | Note |
|------|------|
| 2026-01-18 | Initial creation based on testing analysis |
