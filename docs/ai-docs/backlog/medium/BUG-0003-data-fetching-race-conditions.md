---
id: BUG-0003
title: Fix race conditions in data fetching
status: backlog
priority: medium
category: bug
component: ui
created: 2026-01-18
updated: 2026-01-18
effort: m
assignee: ai-agent
---

# Fix Race Conditions in Data Fetching

## Summary

Rapid filtering/navigation can cause stale data to appear due to race conditions. When requests complete out of order, the UI may show incorrect data.

## Current Behavior

1. User searches "A"
2. User quickly searches "B"
3. Request for "A" returns after request for "B"
4. UI shows "A" results even though search input is "B"

## Expected Behavior

- AbortController cancels stale requests
- Only latest request's data is displayed
- Or React Query handles automatically

## Acceptance Criteria

- [ ] AbortController used for fetch cancellation
- [ ] Or migrated to React Query (auto-handles)
- [ ] No stale data displayed
- [ ] No console warnings about state updates

## Technical Approach

If manual fix needed:
```typescript
useEffect(() => {
  const controller = new AbortController()
  
  async function fetchData() {
    try {
      const res = await fetch(url, { signal: controller.signal })
      // ...
    } catch (e) {
      if (e.name !== 'AbortError') throw e
    }
  }
  
  fetchData()
  return () => controller.abort()
}, [deps])
```

Or just implement REFACTOR-0001 (React Query).

## Dependencies

**Blocked By:**
- REFACTOR-0001 (React Query) - may solve automatically

**Blocks:**
- None

## Conversation History

| Date | Note |
|------|------|
| 2026-01-18 | Initial creation - may be resolved by React Query |
