---
id: FEAT-0004A
title: i18n Foundation - Install and Configure next-intl
status: backlog
priority: high
category: feature
component: frontend
created: 2026-01-23
updated: 2026-01-23
effort: m
assignee: ai-agent
parent: FEAT-0004
---

# i18n Foundation - Install and Configure next-intl

## Summary

Install and configure `next-intl` library with cookie-based locale detection. This establishes the foundation for multi-language support without changing the existing URL structure.

## Current Behavior

- No i18n library installed
- Korean text hardcoded in various components
- `UserPreference.language` field exists but unused
- E2E tests failing due to Korean text in UI

## Expected Behavior

- `next-intl` installed and configured
- Cookie-based locale detection working
- Translation file structure in place
- English as default locale
- Basic translation provider wrapping the app

## Acceptance Criteria

- [ ] `next-intl` package installed
- [ ] `src/i18n/config.ts` - locale configuration
- [ ] `src/i18n/request.ts` - request config for server components
- [ ] `messages/en.json` - English translation file (stub)
- [ ] `messages/ko.json` - Korean translation file (stub)
- [ ] `src/app/layout.tsx` wrapped with provider
- [ ] `next.config.ts` updated with plugin
- [ ] Basic `useTranslations()` working in one component

## Technical Approach

### 1. Install next-intl

```bash
npm install next-intl
```

### 2. Create i18n Configuration

```typescript
// src/i18n/config.ts
export const locales = ['en', 'ko'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'
```

### 3. Create Request Configuration

```typescript
// src/i18n/request.ts
import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'
import { defaultLocale, locales, type Locale } from './config'

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const localeCookie = cookieStore.get('NEXT_LOCALE')?.value
  const locale = locales.includes(localeCookie as Locale) 
    ? localeCookie as Locale 
    : defaultLocale

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  }
})
```

### 4. Create Translation Files

```json
// messages/en.json
{
  "common": {
    "loading": "Loading...",
    "save": "Save",
    "cancel": "Cancel",
    "error": "An error occurred"
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
    "error": "오류가 발생했습니다"
  }
}
```

### 5. Update Layout

```typescript
// src/app/layout.tsx
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getLocale } from 'next-intl/server'

export default async function RootLayout({ children }) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {/* existing providers */}
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
```

### 6. Update next.config.ts

```typescript
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

export default withNextIntl({
  // existing config
})
```

## Verification

```bash
# 1. Build succeeds
npm run build

# 2. App starts without errors
npm run dev

# 3. Console shows locale detection working
```

## Dependencies

**Blocked By:** None

**Blocks:** 
- FEAT-0004B (Inquiry Mode Migration)
- FEAT-0004C (Korean Text Migration)

## Notes

- Using cookie-based locale detection to preserve existing URL structure
- Can migrate to URL-prefix routing later if SEO becomes a priority
- Default locale is English for consistency with most of the codebase
