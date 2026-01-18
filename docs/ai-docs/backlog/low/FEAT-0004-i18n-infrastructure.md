---
id: FEAT-0004
title: Add internationalization (i18n) infrastructure
status: backlog
priority: low
category: feature
component: frontend
created: 2026-01-18
updated: 2026-01-18
effort: l
assignee: ai-agent
---

# Add Internationalization Infrastructure

## Summary

The `UserPreference` model has a `language` field defaulting to `'ko'`, suggesting multilingual support is planned. However, no i18n library or translation infrastructure exists. If the application needs to support multiple languages (Korean, English), proper i18n scaffolding should be established.

## Current Behavior

- `UserPreference.language` defaults to `'ko'`
- All UI strings are hardcoded in English/Korean
- No translation files or i18n library

## Expected Behavior

- i18n library installed and configured (next-intl or next-i18next)
- Translation files for supported languages
- Language switcher in UI
- URL-based or cookie-based locale detection
- TypeScript support for translation keys

## Acceptance Criteria

- [ ] Install and configure i18n library (recommend `next-intl`)
- [ ] Create translation file structure
- [ ] Extract strings from at least 5 key pages
- [ ] Implement language switcher component
- [ ] Add locale detection from user preference
- [ ] Document translation workflow

## Technical Approach

### 1. Install next-intl

```bash
npm install next-intl
```

### 2. Configure next-intl

```typescript
// src/i18n.ts
import { getRequestConfig } from 'next-intl/server'

export const locales = ['en', 'ko'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'ko'

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`../messages/${locale}.json`)).default
}))
```

### 3. Create Translation Files

```
messages/
├── en.json
└── ko.json
```

```json
// messages/en.json
{
  "common": {
    "loading": "Loading...",
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit"
  },
  "nav": {
    "dashboard": "Dashboard",
    "activities": "Activities",
    "groups": "Groups",
    "profile": "Profile"
  },
  "activities": {
    "title": "Activities",
    "create": "Create Activity",
    "noActivities": "No activities found"
  }
}
```

```json
// messages/ko.json
{
  "common": {
    "loading": "로딩 중...",
    "save": "저장",
    "cancel": "취소",
    "delete": "삭제",
    "edit": "편집"
  },
  "nav": {
    "dashboard": "대시보드",
    "activities": "활동",
    "groups": "그룹",
    "profile": "프로필"
  },
  "activities": {
    "title": "활동",
    "create": "활동 만들기",
    "noActivities": "활동이 없습니다"
  }
}
```

### 4. Update Layout

```typescript
// src/app/[locale]/layout.tsx
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'

export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  const messages = await getMessages()

  return (
    <NextIntlClientProvider messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}
```

### 5. Use in Components

```typescript
// Component example
import { useTranslations } from 'next-intl'

export function ActivitiesPage() {
  const t = useTranslations('activities')

  return (
    <div>
      <h1>{t('title')}</h1>
      <button>{t('create')}</button>
    </div>
  )
}
```

### 6. Language Switcher

```typescript
// src/components/LanguageSwitcher.tsx
'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'

export function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const switchLocale = (newLocale: string) => {
    router.push(pathname.replace(`/${locale}`, `/${newLocale}`))
  }

  return (
    <select value={locale} onChange={(e) => switchLocale(e.target.value)}>
      <option value="en">English</option>
      <option value="ko">한국어</option>
    </select>
  )
}
```

## Migration Priority

1. Navigation and common UI elements
2. Authentication pages
3. Dashboard
4. Activities pages
5. Error messages

## Related Files

- `prisma/schema.prisma` - UserPreference.language field
- All pages with hardcoded strings
- `src/components/layout/Navigation.tsx`

## Dependencies

**Blocked By:**
- None

**Blocks:**
- None

## Notes

- Consider using locale subpaths (`/en/`, `/ko/`) or domain-based routing
- Translation keys should be TypeScript-typed
- May need to handle date/number formatting per locale
- Consider using a translation management platform later

## Conversation History

| Date | Note |
|------|------|
| 2026-01-18 | Initial creation based on UserPreference analysis |
