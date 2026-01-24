---
id: VIBE-0009-WI14
title: Update Component Index Exports
status: backlog
priority: high
category: refactoring
component: ui
created: 2026-01-24
updated: 2026-01-24
effort: xs
assignee: ai-agent
parent: VIBE-0009
---

# Update Component Index Exports

## Summary

Ensure all components are properly exported from the index files for clean imports.

## Acceptance Criteria

- [ ] All exports compile without errors
- [ ] Types are properly exported
- [ ] Import paths work correctly

## Technical Approach

### components/index.ts

```typescript
// Display Components
export { BloomsBadge } from './BloomsBadge'
export { QualityScoreDisplay, getScoreColor, getScoreBgColor } from './QualityScoreDisplay'

// Input Components  
export { KeywordBadge } from './KeywordBadge'
export { KeywordInput } from './KeywordInput'

// Card Components
export { QuestionSubmissionCard } from './QuestionSubmissionCard'
export { InquiryResultCard } from './InquiryResultCard'

// Progress Components
export { InquiryProgress } from './InquiryProgress'
```

### hooks/index.ts

```typescript
export { useInquiryAttempt } from './useInquiryAttempt'
export { useInquiryResults } from './useInquiryResults'
```

### index.ts (root)

```typescript
export * from './types'
export * from './components'
export * from './hooks'
```

## Dependencies

**Blocked By:**
- VIBE-0009-WI02 through WI-10 (all components and hooks)

**Blocks:**
- VIBE-0009-WI15 (Final Cleanup)

## Conversation History

| Date | Note |
|------|------|
| 2026-01-24 | Created from VIBE-0009 implementation plan breakdown |
