---
id: TECH-0010
title: Improve code splitting and lazy loading
status: backlog
priority: low
category: tech-debt
component: performance
created: 2026-01-18
updated: 2026-01-18
effort: m
assignee: ai-agent
---

# Improve Code Splitting and Lazy Loading

## Summary

The codebase has minimal use of React's lazy loading and Suspense patterns. Only 7 files use `Suspense` or `lazy`. Large pages could benefit from dynamic imports to reduce initial bundle size and improve time-to-interactive.

## Current Behavior

- Most components are statically imported
- Heavy components (charts, PDF generators, rich editors) load on initial page
- No loading states for lazy-loaded components
- Bundle may include unused code

## Expected Behavior

- Heavy components dynamically imported
- Suspense boundaries with skeleton loaders
- Route-based code splitting (Next.js automatic)
- Reduced initial bundle size

## Acceptance Criteria

- [ ] Identify heavy components suitable for lazy loading
- [ ] Implement dynamic imports for 5+ heavy components
- [ ] Add Suspense boundaries with skeleton loaders
- [ ] Measure bundle size before/after
- [ ] Document lazy loading patterns

## Technical Approach

### 1. Identify Heavy Components

Components likely to benefit:
- PDF generators (`pdfService.ts`, `pdf-template.ts`)
- Chart/analytics components
- Rich text editors (if any)
- QR code generators
- Certificate previews

```bash
# Analyze bundle
npm run build
npx @next/bundle-analyzer
```

### 2. Dynamic Import Pattern

```typescript
// Before
import { HeavyChart } from '@/components/analytics/HeavyChart'

// After
import dynamic from 'next/dynamic'

const HeavyChart = dynamic(
  () => import('@/components/analytics/HeavyChart'),
  {
    loading: () => <ChartSkeleton />,
    ssr: false // If component doesn't need SSR
  }
)
```

### 3. Suspense Boundaries

```typescript
// src/app/(dashboard)/analytics/page.tsx
import { Suspense } from 'react'
import { AnalyticsSkeleton } from '@/components/skeletons'

const AnalyticsChart = dynamic(() => import('@/components/AnalyticsChart'))
const PerformanceTable = dynamic(() => import('@/components/PerformanceTable'))

export default function AnalyticsPage() {
  return (
    <div>
      <h1>Analytics</h1>
      
      <Suspense fallback={<AnalyticsSkeleton />}>
        <AnalyticsChart />
      </Suspense>
      
      <Suspense fallback={<TableSkeleton rows={10} />}>
        <PerformanceTable />
      </Suspense>
    </div>
  )
}
```

### 4. Skeleton Components

```typescript
// src/components/skeletons/ChartSkeleton.tsx
export function ChartSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      <div className="mt-4 flex gap-4">
        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    </div>
  )
}

// src/components/skeletons/TableSkeleton.tsx
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse">
      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded mb-1" />
      ))}
    </div>
  )
}
```

### 5. Route-Level Code Splitting

Next.js App Router automatically code-splits by route, but ensure:

```typescript
// Avoid importing all routes in one place
// Bad
import ActivitiesPage from './activities/page'
import GroupsPage from './groups/page'
import AnalyticsPage from './analytics/page'

// Good - let Next.js handle it via file-system routing
// Each page.tsx is its own chunk
```

### 6. Conditional Feature Loading

```typescript
// Only load admin features for admins
const AdminPanel = dynamic(
  () => import('@/components/admin/AdminPanel'),
  { ssr: false }
)

function Dashboard({ user }) {
  return (
    <div>
      <MainContent />
      {user.isAdmin && (
        <Suspense fallback={<Skeleton />}>
          <AdminPanel />
        </Suspense>
      )}
    </div>
  )
}
```

## Candidates for Lazy Loading

| Component | Reason | Priority |
|-----------|--------|----------|
| Certificate Designer | Heavy, PDF libs | High |
| QR Code Generator | qrcode library | Medium |
| Analytics Charts | Visualization libs | Medium |
| Activity Maker | Complex form wizard | Medium |
| Admin Panels | Not needed for most users | Low |

## Related Files

- `src/app/(dashboard)/` - Dashboard pages
- `src/components/` - All components
- `next.config.ts` - Build configuration
- `package.json` - Dependencies to analyze

## Dependencies

**Blocked By:**
- REFACTOR-0002 (UI Components) - Skeleton components needed

**Blocks:**
- None

## Notes

- Measure bundle size before making changes
- Don't over-optimize - focus on actually heavy components
- SSR may be needed for SEO-critical content
- Test on slow connections

## Conversation History

| Date | Note |
|------|------|
| 2026-01-18 | Initial creation based on bundle analysis |
