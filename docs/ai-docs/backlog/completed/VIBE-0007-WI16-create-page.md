---
id: VIBE-0007-WI16
title: Refactor Create Page
status: backlog
effort: s
dependencies: [VIBE-0007-WI05, VIBE-0007-WI08, VIBE-0007-WI09]
---

# WI-016: Refactor Create Page

## Description

Integrate extracted components and hooks into create page.

## Tasks

1. Replace inline form with `CertificateForm` component
2. Use `useCertificateForm` hook for state management
3. Verify creation flow works

## Target

Page under 80 lines (from 455)

## Acceptance Criteria

- [ ] Page renders correctly
- [ ] Form validation works
- [ ] Activity selection works
- [ ] Certificate creation works
- [ ] Page is under 100 lines
