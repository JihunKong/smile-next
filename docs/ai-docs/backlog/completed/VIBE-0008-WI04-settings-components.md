---
id: VIBE-0008-WI04
title: Settings Section Components
status: backlog
effort: m
dependencies: [VIBE-0008-WI02]
---

# WI-04: Settings Section Components

## Description

Break down the 663-line settings page into focused, testable section components.

## Components to Create

| Component | Target Lines | Source Lines | Responsibility |
|-----------|--------------|--------------|----------------|
| `SettingsSidebar` | ~60 | 262-288 | Tab navigation |
| `AccountSettings` | ~100 | 294-354 | Name, username form |
| `PasswordSettings` | ~80 | 356-406 | Password change form |
| `NotificationSettings` | ~60 | 408-460 | Email notification toggles |
| `PrivacySettings` | ~60 | 462-514 | Privacy toggles |
| `DisplaySettings` | ~100 | 516-634 | Theme, language, items per page |
| `DangerZone` | ~50 | 636-655 | Delete account with warning |

## TDD Approach

### Test Files to Create

**`tests/unit/features/user/components/settings/AccountSettings.test.tsx`**
```typescript
describe('AccountSettings', () => {
  it('should render with user data pre-filled')
  it('should call onSave with form data on submit')
  it('should show saving state while submitting')
  it('should disable email field (non-editable)')
  it('should validate required fields')
})
```

**`tests/unit/features/user/components/settings/PasswordSettings.test.tsx`**
```typescript
describe('PasswordSettings', () => {
  it('should render current, new, and confirm password fields')
  it('should call onSave with passwords on submit')
  it('should show saving state while submitting')
  it('should clear form after onSave resolves')
})
```

**`tests/unit/features/user/components/settings/NotificationSettings.test.tsx`**
```typescript
describe('NotificationSettings', () => {
  it('should render all notification toggles')
  it('should call onChange when toggle is clicked')
  it('should reflect preference values')
  it('should call onSave when save button clicked')
})
```

**`tests/unit/features/user/components/settings/PrivacySettings.test.tsx`**
```typescript
describe('PrivacySettings', () => {
  it('should render privacy toggles')
  it('should call onChange when toggle is clicked')
  it('should call onSave when save button clicked')
})
```

**`tests/unit/features/user/components/settings/DisplaySettings.test.tsx`**
```typescript
describe('DisplaySettings', () => {
  it('should render theme options (light/dark/auto)')
  it('should render language dropdown')
  it('should render items per page options')
  it('should call respective setters when changed')
  it('should call onSave when save button clicked')
})
```

**`tests/unit/features/user/components/settings/DangerZone.test.tsx`**
```typescript
describe('DangerZone', () => {
  it('should render delete account warning')
  it('should call onDelete when delete button clicked')
  it('should show loading state during deletion')
})
```

## Implementation Notes

Each component should:
- Accept `user/preferences` as props (not fetch internally)
- Accept `onSave/onChange` callbacks
- Accept `saving` state for loading UI
- Be under 150 lines
- Use existing Tailwind classes from source file

## Files to Create

- `tests/unit/features/user/components/settings/*.test.tsx` (7 files)
- `src/features/user/components/settings/*.tsx` (7 files)

## Files to Modify

- `src/features/user/components/settings/index.ts` (add exports)

## Acceptance Criteria

- [ ] All test cases pass
- [ ] Each component under 150 lines
- [ ] Components are pure (receive props, emit events)
- [ ] All existing functionality preserved
