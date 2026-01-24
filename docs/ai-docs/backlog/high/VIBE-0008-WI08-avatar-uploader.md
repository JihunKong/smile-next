---
id: VIBE-0008-WI08
title: Shared AvatarUploader Component
status: backlog
effort: s
dependencies: [VIBE-0008-WI04, VIBE-0008-WI06]
---

# WI-08: Shared AvatarUploader Component

## Description

Create a reusable avatar upload component for settings and profile.

## TDD Approach

### Write Tests First

**File:** `tests/unit/features/user/components/AvatarUploader.test.tsx`

```typescript
describe('AvatarUploader', () => {
  describe('Display', () => {
    it('should show current avatar when provided')
    it('should show initials when no avatar')
    it('should show upload overlay on hover')
  })

  describe('Upload', () => {
    it('should accept image file types only (jpg, png, gif, webp)')
    it('should validate file size limit (5MB default)')
    it('should show preview before confirming upload')
    it('should call onUpload with file on confirm')
    it('should show upload progress')
    it('should display error on failed upload')
  })

  describe('Remove', () => {
    it('should show remove button when avatar exists')
    it('should call onRemove when remove clicked')
    it('should show confirmation before removing')
  })

  describe('Accessibility', () => {
    it('should be keyboard accessible')
    it('should have proper aria labels')
  })
})
```

### Implement Component

**File:** `src/features/user/components/AvatarUploader.tsx`

```typescript
interface AvatarUploaderProps {
  avatarUrl: string | null
  initials: string
  onUpload: (file: File) => Promise<void>
  onRemove?: () => Promise<void>
  size?: 'sm' | 'md' | 'lg'
  maxSizeMB?: number
}

export function AvatarUploader({
  avatarUrl,
  initials,
  onUpload,
  onRemove,
  size = 'md',
  maxSizeMB = 5,
}: AvatarUploaderProps) {
  // Implementation
}
```

## Files to Create

- `tests/unit/features/user/components/AvatarUploader.test.tsx`
- `src/features/user/components/AvatarUploader.tsx`

## Files to Modify

- `src/features/user/components/index.ts` (add export)
- `src/features/user/components/settings/AccountSettings.tsx` (integrate)
- `src/features/user/components/profile/ProfileHeader.tsx` (integrate)

## Acceptance Criteria

- [ ] All test cases pass
- [ ] Component under 100 lines
- [ ] Works in both settings and profile
- [ ] Handles file validation
- [ ] Accessible
