# VIBE-0008: Settings & Profile Refactor

> **Status:** Backlog  
> **Priority:** High  
> **Total Work Items:** 10  
> **Approach:** Test-Driven Development (TDD)

## Overview

Refactor Settings & Profile pages (2,916+ lines across 8 files) into modular, AI-friendly components.

## Related Documents

- [Main Ticket](./VIBE-0008-settings-profile-refactor.md) - Full description and acceptance criteria
- [Implementation Plan](./VIBE-0008-settings-profile-refactor-plan.md) - Detailed technical approach

## Work Items

### Phase 1: Foundation
| # | Work Item | Status | Effort | Dependencies |
|---|-----------|--------|--------|--------------|
| 01 | [Setup Feature Module Structure](./VIBE-0008-WI01-setup.md) | ⬜ Backlog | XS | None |

### Phase 2: Hooks
| # | Work Item | Status | Effort | Dependencies |
|---|-----------|--------|--------|--------------|
| 02 | [useUserSettings Hook](./VIBE-0008-WI02-use-user-settings.md) | ⬜ Backlog | M | WI-01 |
| 03 | [useUserProfile Hook](./VIBE-0008-WI03-use-user-profile.md) | ⬜ Backlog | S | WI-01 |

### Phase 3: Settings Components
| # | Work Item | Status | Effort | Dependencies |
|---|-----------|--------|--------|--------------|
| 04 | [Settings Section Components](./VIBE-0008-WI04-settings-components.md) | ⬜ Backlog | M | WI-02 |
| 05 | [Refactor Settings Page](./VIBE-0008-WI05-settings-page.md) | ⬜ Backlog | S | WI-02, WI-04 |

### Phase 4: Profile Components
| # | Work Item | Status | Effort | Dependencies |
|---|-----------|--------|--------|--------------|
| 06 | [Profile Section Components](./VIBE-0008-WI06-profile-components.md) | ⬜ Backlog | M | WI-03 |
| 07 | [Refactor Profile Page](./VIBE-0008-WI07-profile-page.md) | ⬜ Backlog | S | WI-03, WI-06 |

### Phase 5: Polish
| # | Work Item | Status | Effort | Dependencies |
|---|-----------|--------|--------|--------------|
| 08 | [Shared AvatarUploader](./VIBE-0008-WI08-avatar-uploader.md) | ⬜ Backlog | S | WI-04, WI-06 |
| 09 | [Remove Embedded SettingsTab](./VIBE-0008-WI09-remove-settings-tab.md) | ⬜ Backlog | XS | WI-05 |
| 10 | [Refactor Invite Page](./VIBE-0008-WI10-invite-page.md) | ⬜ Backlog | M | None (Stretch) |

## Status Legend

- ⬜ Backlog - Not started
- 🔄 In Progress - Currently being worked on
- ✅ Done - Completed and verified

## Definition of Done

1. ✅ Tests Written First - Failing tests exist before implementation
2. ✅ Tests Pass - All unit tests pass
3. ✅ Line Limits Met - Components < 150 lines, pages < 120 lines
4. ✅ TypeScript Clean - No type errors
5. ✅ No Regressions - Existing functionality preserved
6. ✅ Exports Updated - Barrel files updated
7. ✅ Styles Preserved - Visual appearance unchanged
