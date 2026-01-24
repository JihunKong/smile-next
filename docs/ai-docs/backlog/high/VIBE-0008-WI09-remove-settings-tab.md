---
id: VIBE-0008-WI09
title: Remove Embedded SettingsTab from Profile
status: backlog
effort: xs
dependencies: [VIBE-0008-WI05]
---

# WI-09: Remove Embedded SettingsTab from Profile

## Description

Remove the duplicated `SettingsTab` component embedded in `profile/page.tsx` (lines 344-523) and redirect to the dedicated settings page.

## Implementation

1. Remove the `SettingsTab` function from `profile/page.tsx`
2. Update the settings tab behavior to redirect to `/settings`
3. Or keep minimal inline settings but link to advanced settings

## Files to Modify

- `src/app/(dashboard)/profile/page.tsx`

## Acceptance Criteria

- [ ] No duplicate settings form code
- [ ] Users can access full settings from profile
- [ ] Page line count reduced by ~180 lines
