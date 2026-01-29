---
id: VIBE-0007-WI18
title: Refactor Designer Page
status: backlog
effort: l
dependencies: [VIBE-0007-WI03, VIBE-0007-WI06, VIBE-0007-WI12, VIBE-0007-WI13]
---

# WI-018: Refactor Designer Page

## Description

Integrate extracted components and hooks into designer page.

## Tasks

1. Use `useCertificate` hook for data fetching
2. Use `useCertificateDesigner` hook for designer logic
3. Use `CertificatePreview` for live preview
4. Use `BadgePlacer` for canvas/drag-drop
5. Verify all designer functionality works

## Target

Page under 200 lines (from 858) - complexity is acceptable

## Acceptance Criteria

- [ ] Page renders correctly
- [ ] Image upload works
- [ ] Badge placement works
- [ ] Preview updates live
- [ ] Save/submit works
- [ ] Page is under 200 lines
