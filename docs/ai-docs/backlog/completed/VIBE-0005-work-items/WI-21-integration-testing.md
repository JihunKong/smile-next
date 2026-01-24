---
id: VIBE-0005-WI-21
title: Integration Testing & Cleanup
status: ready
priority: P0
effort: M (1 hour)
dependencies: WI-19, WI-20
phase: 7 - Final Verification
parent: VIBE-0005
---

# WI-21: Integration Testing & Cleanup

## Purpose
Final verification and cleanup after all refactoring is complete.

## Tasks

### 1. Run All Unit Tests
```bash
npm run test
```

Ensure all tests pass, including:
- Hook tests in `tests/unit/hooks/activities/`
- Component tests in `tests/unit/components/activities/`

### 2. Run E2E Tests for Activity Flows
```bash
npm run test:e2e -- --grep activity
```

Verify:
- [ ] Create activity flow works
- [ ] View activity detail works (all modes)
- [ ] Edit activity works
- [ ] Delete activity works

### 3. Manual Verification Checklist

#### Create Page
- [ ] Page renders without errors
- [ ] Group selector shows user's groups
- [ ] Mode selection works
- [ ] Mode-specific settings appear
- [ ] Form validation shows errors
- [ ] Activity creation succeeds
- [ ] Redirects to detail page after creation

#### Detail Page (test each mode)
- [ ] **Open Mode**: Questions list renders, post button works
- [ ] **Exam Mode**: Exam info shows, Take Exam button works
- [ ] **Inquiry Mode**: Settings display, Start button works
- [ ] **Case Mode**: Case info shows, scenarios display

### 4. Code Cleanup
- [ ] Remove unused imports from refactored pages
- [ ] Verify barrel exports are complete
- [ ] Check for any console.log statements
- [ ] Verify TypeScript has no errors: `npm run type-check`

### 5. Line Count Verification
```bash
# Create page should be ~100 lines
wc -l src/app/\(dashboard\)/activities/create/page.tsx

# Detail page should be ~100 lines
wc -l src/app/\(dashboard\)/activities/\[id\]/page.tsx

# All component files should be <150 lines
find src/features/activities -name "*.tsx" -exec wc -l {} \;
```

## Success Metrics

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| `create/page.tsx` | 775 | ? | ≤100 |
| `[id]/page.tsx` | 691 | ? | ≤100 |
| **Total** | **1,466** | ? | **≤200** |
| Unit test coverage | TBD | ? | ≥80% |
| Component files | 2 | ? | ~20 |
| Max file size | 775 | ? | ≤150 |

## Acceptance Criteria
- [ ] All unit tests pass
- [ ] All E2E tests pass
- [ ] Create page under 100 lines
- [ ] Detail page under 100 lines
- [ ] All component files under 150 lines
- [ ] No TypeScript errors
- [ ] No console warnings

## Final Steps
1. Update VIBE-0005 status to `completed`
2. Update VIBE-0005A status to `completed`
3. Create walkthrough documenting changes
