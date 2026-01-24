---
id: VIBE-0008-WI10
title: Refactor Invite Page (Stretch)
status: backlog
effort: m
dependencies: []
priority: stretch
---

# WI-10: Refactor Invite Page (Optional Stretch)

## Description

Break down the 543-line invite page into manageable components.

## Proposed Structure

```
src/features/auth/
├── components/
│   ├── invite/
│   │   ├── InviteValidator.tsx    (~60 lines) - Loading/error states
│   │   ├── GroupInfoCard.tsx      (~80 lines) - Group preview
│   │   ├── JoinGroupButton.tsx    (~50 lines) - Existing user join
│   │   ├── RegisterForm.tsx       (~150 lines) - New user registration
│   │   ├── AlreadyMemberCard.tsx  (~40 lines) - Already joined message
│   │   └── index.ts
│   └── index.ts
├── hooks/
│   └── useInvite.ts               (~100 lines) - Invite flow logic
└── types.ts
```

## TDD Approach

### Test Cases

```typescript
describe('useInvite', () => {
  it('should validate invite code on mount')
  it('should return group info on valid invite')
  it('should handle expired invite')
  it('should handle already member state')
  it('should handle join for logged-in users')
  it('should handle registration for new users')
})

describe('RegisterForm', () => {
  it('should validate email format')
  it('should validate password requirements')
  it('should validate password confirmation')
  it('should submit registration data')
  it('should handle registration errors')
})

describe('GroupInfoCard', () => {
  it('should display group name and description')
  it('should show member and activity counts')
  it('should show creator name')
})
```

## Acceptance Criteria

- [ ] Invite page under 100 lines
- [ ] Registration form properly validated
- [ ] All invite states handled
- [ ] No regressions in invite flow
