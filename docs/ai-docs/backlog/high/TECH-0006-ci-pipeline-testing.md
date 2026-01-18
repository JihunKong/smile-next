---
id: TECH-0006
title: Add tests to CI pipeline before deployment
status: backlog
priority: high
category: tech-debt
component: ci-cd
created: 2026-01-18
updated: 2026-01-18
effort: s
assignee: ai-agent
---

# Add Tests to CI Pipeline Before Deployment

## Summary

The current CI/CD pipeline (`ci-cd.yml`) builds and deploys without running tests. The `test:ci` script exists in `package.json` but is never called. This means broken code can be deployed to both dev and production environments.

## Current Behavior

```yaml
# Current flow in ci-cd.yml:
check-changes → call-build → deploy-dev/deploy-prod
```

- No lint checking in CI
- No type checking in CI
- No unit tests in CI
- No E2E tests in CI
- `test:ci` script exists but unused: `"test:ci": "npm run lint:check && npm run type-check && npm run test:unit && npm run test:e2e"`

## Expected Behavior

```yaml
# Expected flow:
check-changes → test → call-build → deploy-dev/deploy-prod
```

CI should:
1. Run lint check
2. Run type check
3. Run unit tests
4. Run E2E tests (at least on PRs and main)
5. Only proceed to build if all tests pass

## Acceptance Criteria

- [ ] Add new `test` job to `ci-cd.yml` workflow
- [ ] Test job runs before build job
- [ ] Build job depends on test job success
- [ ] Unit tests run on all pushes/PRs
- [ ] E2E tests run on PRs and main branch
- [ ] Test failure blocks deployment
- [ ] Test results visible in GitHub Actions UI

## Technical Approach

### 1. Create Reusable Test Workflow

```yaml
# .github/workflows/test.yml
name: Run Tests

on:
  workflow_call:
    inputs:
      run-e2e:
        description: 'Whether to run E2E tests'
        type: boolean
        default: false

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: smile_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma Client
        run: npx prisma generate

      - name: Run Lint
        run: npm run lint:check

      - name: Run Type Check
        run: npm run type-check

      - name: Run Unit Tests
        run: npm run test:unit
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/smile_test
          REDIS_URL: redis://localhost:6379

      - name: Install Playwright Browsers
        if: inputs.run-e2e
        run: npx playwright install --with-deps chromium

      - name: Run E2E Tests
        if: inputs.run-e2e
        run: npm run test:e2e
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/smile_test
          REDIS_URL: redis://localhost:6379
          NEXTAUTH_SECRET: test-secret
          NEXTAUTH_URL: http://localhost:3000

      - name: Upload Test Results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: |
            playwright-report/
            coverage/
          retention-days: 7
```

### 2. Update Main CI/CD Workflow

```yaml
# .github/workflows/ci-cd.yml (add between check-changes and call-build)

  # 2. Run Tests
  run-tests:
    needs: check-changes
    if: needs.check-changes.outputs.should-build == 'true'
    uses: ./.github/workflows/test.yml
    with:
      # Run E2E on PRs and main branch only (they take longer)
      run-e2e: ${{ github.event_name == 'pull_request' || github.ref == 'refs/heads/main' }}

  # 3. Build (now depends on tests)
  call-build:
    needs: [check-changes, run-tests]
    if: |
      needs.check-changes.outputs.should-build == 'true' &&
      needs.run-tests.result == 'success'
    # ... rest of build job
```

### 3. Optional: Add Test Summary

```yaml
      - name: Test Summary
        if: always()
        uses: test-summary/action@v2
        with:
          paths: 'test-results/**/*.xml'
```

## Related Files

- `.github/workflows/ci-cd.yml` - Main workflow to update
- `.github/workflows/test.yml` - New workflow to create
- `package.json` - Test scripts already defined

## Dependencies

**Blocked By:**
- TECH-0004 (Unit Test Coverage) - need tests to run

**Blocks:**
- None

## Notes

- Start with unit tests only, add E2E later if build times are acceptable
- Consider caching Playwright browsers for faster E2E runs
- May want to add test coverage thresholds

## Conversation History

| Date | Note |
|------|------|
| 2026-01-18 | Initial creation based on CI/CD analysis |
