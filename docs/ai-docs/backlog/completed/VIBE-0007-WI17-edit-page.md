---
id: VIBE-0007-WI17
title: Refactor Edit Page
status: backlog
effort: s
dependencies: [VIBE-0007-WI03, VIBE-0007-WI05, VIBE-0007-WI08, VIBE-0007-WI09]
---

# WI-017: Refactor Edit Page

## Description

Integrate extracted components and hooks into edit page.

## Tasks

1. Replace inline fetching with `useCertificate` hook
2. Replace inline form with `CertificateForm` component
3. Use `useCertificateForm` hook for state management
4. Verify update flow works

## Target

Page under 80 lines (from 577)

## Acceptance Criteria

- [ ] Page renders correctly
- [ ] Existing certificate data loads
- [ ] Updates save correctly
- [ ] Page is under 100 lines
