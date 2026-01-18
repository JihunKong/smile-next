---
id: VIBE-0002
title: Refactor Case Mode pages for AI-friendly development (3825 total lines)
status: backlog
priority: critical
category: refactoring
component: ui
created: 2026-01-17
updated: 2026-01-17
effort: xl
assignee: ai-agent
---

# Refactor Case Mode Pages for Vibe Coding

## Summary

Case Mode is the most complex feature with **4 mega-files totaling 3,825 lines**. This makes the entire Case Mode experience nearly impossible to modify via AI assistance. A designer wanting to change the Case Mode UI must navigate thousands of lines across multiple files.

| File | Lines | Purpose |
|------|-------|---------|
| `case/configure/page.tsx` | 1096 | Admin: set up case scenarios |
| `case/review/page.tsx` | 935 | Admin: review student attempts |
| `case/take/case-take-client.tsx` | 794 | Student: take case exam |
| `case/[attemptId]/results/page.tsx` | 541 | Student: view results |
| `case/leaderboard/page.tsx` | 440 | Leaderboard display |
| **Total** | **3,806** | |

## Current Behavior

Each file is a monolith containing:
- Inline interface definitions
- 20+ useState declarations
- Complex state machines (especially take experience)
- Timer logic, progress tracking, AI evaluation status
- Inline modals and dialogs
- Drag-and-drop reordering (configure)

## Expected Behavior

Shared Case Mode module with reusable components:

```
features/case-mode/
├── components/
│   ├── ScenarioCard.tsx        (~100 lines) - Display single scenario
│   ├── ScenarioEditor.tsx      (~150 lines) - Edit scenario modal
│   ├── ScenarioList.tsx        (~120 lines) - List with drag reorder
│   ├── CaseTimer.tsx           (~80 lines)  - Timer display
│   ├── CaseProgress.tsx        (~60 lines)  - Progress indicator
│   ├── CaseResultCard.tsx      (~120 lines) - Result display
│   ├── AIGenerationPanel.tsx   (~150 lines) - Generate scenarios
│   └── index.ts
├── hooks/
│   ├── useCaseSettings.ts      (~100 lines) - Configure page logic
│   ├── useCaseAttempt.ts       (~150 lines) - Take experience logic
│   ├── useCaseResults.ts       (~80 lines)  - Results fetching
│   └── index.ts
├── types.ts                    (~80 lines)  - All Case Mode types
└── index.ts

app/(dashboard)/activities/[id]/case/
├── configure/
│   └── page.tsx               (~100 lines) - Composes from features/
├── take/
│   └── page.tsx               (~100 lines)
├── review/
│   └── page.tsx               (~100 lines)
├── [attemptId]/results/
│   └── page.tsx               (~80 lines)
└── leaderboard/
    └── page.tsx               (~80 lines)
```

## Acceptance Criteria

- [ ] Create `src/features/case-mode/` shared module
- [ ] Extract types to `features/case-mode/types.ts`
- [ ] Create reusable `ScenarioCard`, `ScenarioList` components
- [ ] Extract `useCaseSettings` hook for configure page
- [ ] Extract `useCaseAttempt` hook for take experience
- [ ] All page files under 150 lines
- [ ] All component files under 200 lines
- [ ] Existing functionality preserved
- [ ] Case Mode e2e tests pass

## Technical Approach

### 1. Identify Shared Types

```typescript
// src/features/case-mode/types.ts
export interface CaseScenario {
  id: string
  title: string
  content: string
  domain?: string
}

export interface CaseSettings {
  scenarios: CaseScenario[]
  timePerCase: number
  totalTimeLimit: number
  maxAttempts: number
  passThreshold: number
  is_published?: boolean
  source_material?: string
  num_cases_to_show?: number
  difficulty_level?: string
  anonymize_leaderboard?: boolean
}

export interface CaseAttempt {
  id: string
  status: 'in_progress' | 'completed' | 'timed_out'
  startedAt: Date
  responses: CaseResponse[]
}

export interface CaseResponse {
  scenarioId: string
  response: string
  score?: number
  feedback?: string
}
```

### 2. Extract Scenario Components

```typescript
// src/features/case-mode/components/ScenarioCard.tsx
import { CaseScenario } from '../types'

interface Props {
  scenario: CaseScenario
  onEdit?: () => void
  onDelete?: () => void
  isDragging?: boolean
}

export function ScenarioCard({ scenario, onEdit, onDelete, isDragging }: Props) {
  return (
    <div className={`bg-white rounded-lg border p-4 ${isDragging ? 'opacity-50' : ''}`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium text-gray-900">{scenario.title}</h3>
          {scenario.domain && (
            <span className="text-xs text-gray-500">{scenario.domain}</span>
          )}
        </div>
        <div className="flex gap-2">
          {onEdit && (
            <button onClick={onEdit} className="text-gray-400 hover:text-gray-600">
              Edit
            </button>
          )}
          {onDelete && (
            <button onClick={onDelete} className="text-red-400 hover:text-red-600">
              Delete
            </button>
          )}
        </div>
      </div>
      <p className="mt-2 text-sm text-gray-600 line-clamp-3">
        {scenario.content}
      </p>
    </div>
  )
}
```

### 3. Extract Configure Hook

```typescript
// src/features/case-mode/hooks/useCaseSettings.ts
export function useCaseSettings(activityId: string) {
  const [settings, setSettings] = useState<CaseSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch settings
  const fetchSettings = useCallback(async () => { ... }, [activityId])

  // Save settings
  const saveSettings = async (updates: Partial<CaseSettings>) => { ... }

  // Scenario CRUD
  const addScenario = async (scenario: Omit<CaseScenario, 'id'>) => { ... }
  const updateScenario = async (id: string, updates: Partial<CaseScenario>) => { ... }
  const deleteScenario = async (id: string) => { ... }
  const reorderScenarios = async (fromIndex: number, toIndex: number) => { ... }

  // AI generation
  const generateScenarios = async (sourceMaterial: string, count: number) => { ... }

  return {
    settings,
    loading,
    saving,
    error,
    saveSettings,
    addScenario,
    updateScenario,
    deleteScenario,
    reorderScenarios,
    generateScenarios,
  }
}
```

### 4. Simplified Configure Page

```typescript
// activities/[id]/case/configure/page.tsx
'use client'

import { useCaseSettings } from '@/features/case-mode/hooks'
import { ScenarioList, AIGenerationPanel } from '@/features/case-mode/components'
import { LoadingState, ErrorState } from '@/components/ui'

export default function CaseConfigurePage() {
  const { id } = useParams()
  const { 
    settings, loading, error, 
    saveSettings, addScenario, deleteScenario, reorderScenarios,
    generateScenarios 
  } = useCaseSettings(id)

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} />

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Configure Case Mode</h1>
      
      <AIGenerationPanel onGenerate={generateScenarios} />
      
      <ScenarioList 
        scenarios={settings.scenarios}
        onAdd={addScenario}
        onDelete={deleteScenario}
        onReorder={reorderScenarios}
      />
      
      <SettingsForm settings={settings} onSave={saveSettings} />
    </div>
  )
}
```

## Related Files

- `src/app/(dashboard)/activities/[id]/case/` - All case mode pages
- `src/components/modes/` - Some shared mode components exist

## Dependencies

**Blocked By:**
- None

**Blocks:**
- VIBE-0006 (Exam Mode) - can share timer/progress components
- VIBE-0008 (Inquiry Mode) - similar patterns

## Notes

- Case Mode is the most complex feature - this is a significant refactor
- Consider breaking into sub-tasks: Types → Hooks → Components → Pages
- The take experience has complex state machine logic - preserve carefully
- AI generation panel can be shared with other modes

## Conversation History

| Date | Note |
|------|------|
| 2026-01-17 | Created - Case Mode identified as highest complexity area |
