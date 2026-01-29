---
id: VIBE-0007-WI13
title: BadgePlacer Component
status: backlog
effort: l
dependencies: [VIBE-0007-WI06]
---

# WI-013: BadgePlacer Component

## Description

Extract drag-drop badge placement canvas from designer page.

## TDD Approach

### 1. Write Tests First

**File:** `tests/unit/features/certificates/components/BadgePlacer.test.tsx`

```typescript
describe('BadgePlacer', () => {
  describe('Canvas Rendering', () => {
    it('renders canvas with correct dimensions')
    it('renders certificate background')
    it('renders available badges palette')
  })
  
  describe('Badge Palette', () => {
    it('shows available badges')
    it('allows dragging badge from palette')
    it('shows badge name on hover')
  })
  
  describe('Placed Badges', () => {
    it('renders placed badges at correct positions')
    it('allows dragging placed badges')
    it('allows removing placed badges')
    it('snaps to grid when enabled')
  })
  
  describe('Drag and Drop', () => {
    it('calls onBadgePlaced when badge dropped on canvas')
    it('calls onBadgeMoved when badge repositioned')
    it('calls onBadgeRemoved when badge removed')
    it('prevents badge placement outside canvas bounds')
  })
  
  describe('Positioning Controls', () => {
    it('shows logo position selector')
    it('shows QR code position selector')
    it('updates positions when changed')
  })
})
```

### 2. Implement Component

**File:** `src/features/certificates/components/BadgePlacer.tsx`

## Acceptance Criteria

- [ ] All tests pass
- [ ] Drag-drop functionality works
- [ ] Designer page complexity reduced by ~300 lines
