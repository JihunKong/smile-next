---
id: FEAT-0004D
title: i18n - Language Switcher and User Preference Integration
status: backlog
priority: medium
category: feature
component: frontend
created: 2026-01-23
updated: 2026-01-23
effort: s
assignee: ai-agent
parent: FEAT-0004
---

# i18n - Language Switcher and User Preference Integration

## Summary

Add a language switcher component and integrate with the existing `UserPreference.language` database field to persist user language selection.

## Current Behavior

- `UserPreference.language` field exists (defaults to 'ko')
- No UI to change language
- No connection between DB preference and i18n locale

## Expected Behavior

- Language switcher in settings page or header
- Language preference saved to database
- Locale cookie set based on user preference
- Returning users see their preferred language

## Acceptance Criteria

- [ ] Language switcher component created
- [ ] Switcher added to settings page
- [ ] Language change updates `UserPreference.language` in DB
- [ ] Language change sets `NEXT_LOCALE` cookie
- [ ] On login, locale cookie set from user preference
- [ ] Anonymous users can still switch language (cookie only)

## Technical Approach

### 1. Create Language Switcher Component

```typescript
// src/components/LanguageSwitcher.tsx
'use client'

import { useLocale } from 'next-intl'
import { useTransition } from 'react'
import { setLocale } from '@/actions/locale'

const languages = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
]

export function LanguageSwitcher() {
  const locale = useLocale()
  const [isPending, startTransition] = useTransition()

  const handleChange = (newLocale: string) => {
    startTransition(async () => {
      await setLocale(newLocale)
    })
  }

  return (
    <select 
      value={locale} 
      onChange={(e) => handleChange(e.target.value)}
      disabled={isPending}
    >
      {languages.map(lang => (
        <option key={lang.code} value={lang.code}>
          {lang.flag} {lang.label}
        </option>
      ))}
    </select>
  )
}
```

### 2. Create Locale Server Action

```typescript
// src/actions/locale.ts
'use server'

import { cookies } from 'next/headers'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { locales, type Locale } from '@/i18n/config'

export async function setLocale(locale: string) {
  if (!locales.includes(locale as Locale)) {
    throw new Error('Invalid locale')
  }

  // Set cookie
  const cookieStore = await cookies()
  cookieStore.set('NEXT_LOCALE', locale, {
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: '/',
  })

  // Update DB if logged in
  const session = await auth()
  if (session?.user?.id) {
    await prisma.userPreference.upsert({
      where: { userId: session.user.id },
      update: { language: locale },
      create: { userId: session.user.id, language: locale },
    })
  }
}
```

### 3. Sync on Login

```typescript
// In auth callback or login action
async function onLogin(userId: string) {
  const prefs = await prisma.userPreference.findUnique({
    where: { userId },
    select: { language: true }
  })
  
  if (prefs?.language) {
    const cookieStore = await cookies()
    cookieStore.set('NEXT_LOCALE', prefs.language, {
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
    })
  }
}
```

### 4. Add to Settings Page

```typescript
// In settings page
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

<section>
  <h3>Language / 언어</h3>
  <LanguageSwitcher />
</section>
```

## Verification

### Manual Testing

1. **Anonymous User**
   - Visit site, verify English default
   - Switch to Korean, verify UI updates
   - Refresh page, verify Korean persists

2. **Logged In User**
   - Switch language in settings
   - Log out, log back in
   - Verify language preference persisted

3. **Database Check**
   ```sql
   SELECT language FROM "UserPreference" WHERE userId = 'xxx';
   ```

## Dependencies

**Blocked By:**
- FEAT-0004A (Foundation)

**Blocks:** None

## Files to Create/Modify

- `src/components/LanguageSwitcher.tsx` [NEW]
- `src/actions/locale.ts` [NEW]
- `src/app/(dashboard)/settings/page.tsx` [MODIFY]
- Auth callback (login flow) [MODIFY]

## Notes

- Keep the switcher simple (dropdown) for now
- Could add to header/navigation later for quicker access
- Consider adding locale to URL for SEO in future iteration
