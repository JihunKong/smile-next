---
id: VIBE-0008-WI05
title: Refactor Settings Page
status: backlog
effort: s
dependencies: [VIBE-0008-WI02, VIBE-0008-WI04]
---

# WI-05: Refactor Settings Page

## Description

Reduce `settings/page.tsx` from 663 lines to under 120 lines by composing new components.

## Implementation

```typescript
// settings/page.tsx (~100 lines)
'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useUserSettings } from '@/features/user/hooks'
import {
  SettingsSidebar,
  AccountSettings,
  PasswordSettings,
  NotificationSettings,
  PrivacySettings,
  DisplaySettings,
  DangerZone,
} from '@/features/user/components/settings'
import { LoadingSpinner } from '@/components/ui'

export default function SettingsPage() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'account')
  
  const {
    user,
    preferences,
    loading,
    saving,
    message,
    updateProfile,
    updatePreferences,
    updatePassword,
    deleteAccount,
    clearMessage,
  } = useUserSettings()

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-[#2E2D29] mb-8">Settings</h1>
        
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${...}`}>{message.text}</div>
        )}

        <div className="flex flex-col md:flex-row gap-8">
          <SettingsSidebar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
          
          <div className="flex-1 bg-white rounded-lg shadow p-6">
            {activeTab === 'account' && (
              <AccountSettings user={user} onSave={updateProfile} saving={saving} />
            )}
            {activeTab === 'password' && (
              <PasswordSettings onSave={updatePassword} saving={saving} />
            )}
            {activeTab === 'notifications' && (
              <NotificationSettings 
                preferences={preferences} 
                onSave={(prefs) => updatePreferences(prefs)}
                saving={saving} 
              />
            )}
            {/* ... other tabs */}
          </div>
        </div>
      </div>
    </div>
  )
}
```

## Files to Modify

- `src/app/(dashboard)/settings/page.tsx` (major refactor)

## Acceptance Criteria

- [ ] Page is under 120 lines
- [ ] Uses `useUserSettings` hook
- [ ] All tabs functional
- [ ] No visual regressions
- [ ] All tests still pass
