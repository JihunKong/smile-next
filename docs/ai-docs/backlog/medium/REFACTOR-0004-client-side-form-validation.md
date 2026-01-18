---
id: REFACTOR-0004
title: Add client-side Zod validation to forms
status: backlog
priority: medium
category: refactoring
component: ui
created: 2026-01-18
updated: 2026-01-18
effort: m
assignee: ai-agent
---

# Add Client-Side Form Validation

## Summary

Zod is installed but only used server-side. Forms rely on HTML5 validation (basic) and server-side validation (slow feedback). Client-side Zod validation will provide immediate, consistent feedback.

## Current Behavior

- Basic HTML validation (required, maxlength)
- Server validates after form submission
- Error messages appear after round-trip
- No inline field validation

## Expected Behavior

- Zod schemas validate on blur/change
- Immediate inline error messages
- Server validation as backup
- Consistent error styling

## Acceptance Criteria

- [ ] Validation schemas in `src/lib/validations/`
- [ ] `useForm` hook or react-hook-form integration
- [ ] Inline error messages on blur
- [ ] Schemas shared between client and server

## Technical Approach

```typescript
// src/lib/validations/activity.ts
import { z } from 'zod'

export const createActivitySchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name too long'),
  description: z.string().max(2000).optional(),
  mode: z.number().min(0).max(3),
  groupId: z.string().uuid('Invalid group'),
})

export type CreateActivityInput = z.infer<typeof createActivitySchema>
```

## Related Files

- Form components
- Server action validation

## Dependencies

**Blocked By:**
- None

**Blocks:**
- None

## Conversation History

| Date | Note |
|------|------|
| 2026-01-18 | Initial creation |
