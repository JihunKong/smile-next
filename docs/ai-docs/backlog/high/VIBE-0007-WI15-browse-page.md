---
id: VIBE-0007-WI15
title: Refactor Browse Page
status: backlog
effort: m
dependencies: [VIBE-0007-WI02, VIBE-0007-WI07, VIBE-0007-WI14]
---

# WI-015: Refactor Browse Page

## Description

Integrate extracted components and hooks into browse page.

## Tasks

1. Replace inline certificate fetching with `useCertificates` hook
2. Replace inline filters with `CertificateFilters` component
3. Replace inline card rendering with `CertificateCard` component
4. Verify all existing functionality preserved

## Target

Page under 100 lines (from 428)

## Acceptance Criteria

- [ ] Page renders correctly
- [ ] Search/filter/sort work
- [ ] Enrollment works
- [ ] Page is under 120 lines
