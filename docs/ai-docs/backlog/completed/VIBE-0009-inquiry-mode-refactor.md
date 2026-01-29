---
id: VIBE-0009
title: Refactor Inquiry Mode pages for AI-friendly development (1476 total lines)
status: done
priority: high
category: refactoring
component: ui
created: 2026-01-17
updated: 2026-01-29
effort: m
assignee: ai-agent
completedDate: 2026-01-29
---

# Refactor Inquiry Mode Pages for Vibe Coding

## Summary

Inquiry Mode has **3 pages totaling 1,476 lines**. This is the third activity mode and shares patterns with Exam and Case modes.

| File | Lines | Purpose |
|------|-------|---------|
| `inquiry/take/inquiry-take-client.tsx` | 587 | Student: take inquiry |
| `inquiry/leaderboard/page.tsx` | 501 | Leaderboard display |
| `inquiry/[attemptId]/results/page.tsx` | 388 | View results |
| **Total** | **1,476** | |

## Current Behavior

- Take experience has keyword extraction + validation flow
- Leaderboard displays rankings with filters
- Results show per-question analysis

## Expected Behavior

```
features/inquiry-mode/
├── components/
│   ├── KeywordInput.tsx          (~100 lines) - Keyword entry
│   ├── KeywordValidation.tsx     (~80 lines)  - Show valid/invalid
│   ├── InquiryProgress.tsx       (~60 lines)  - Progress indicator
│   ├── InquiryResultCard.tsx     (~100 lines) - Result display
│   └── index.ts
├── hooks/
│   ├── useInquiryAttempt.ts      (~120 lines) - Take experience
│   ├── useInquiryResults.ts      (~60 lines)
│   └── index.ts
├── types.ts
└── index.ts

app/(dashboard)/activities/[id]/inquiry/
├── take/
│   └── page.tsx                  (~100 lines)
├── leaderboard/
│   └── page.tsx                  (~100 lines) - Reuse shared leaderboard
└── [attemptId]/results/
    └── page.tsx                  (~80 lines)
```

## Acceptance Criteria

- [ ] Create `src/features/inquiry-mode/` module
- [ ] Extract `KeywordInput` component
- [ ] Extract `useInquiryAttempt` hook
- [ ] Leaderboard reuses shared leaderboard component
- [ ] Take page under 120 lines
- [ ] Results page under 100 lines
- [ ] Share timer with Exam/Case modes

## Technical Approach

### 1. Keyword Input Component

```typescript
// features/inquiry-mode/components/KeywordInput.tsx
interface Props {
  keywords: string[]
  onAdd: (keyword: string) => void
  onRemove: (index: number) => void
  maxKeywords?: number
  validatedKeywords?: Record<string, boolean>
}

export function KeywordInput({ 
  keywords, 
  onAdd, 
  onRemove, 
  maxKeywords = 10,
  validatedKeywords 
}: Props) {
  const [input, setInput] = useState('')

  const handleAdd = () => {
    if (input.trim() && keywords.length < maxKeywords) {
      onAdd(input.trim())
      setInput('')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Enter a keyword..."
        />
        <Button onClick={handleAdd} disabled={keywords.length >= maxKeywords}>
          Add
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {keywords.map((keyword, i) => (
          <KeywordBadge
            key={i}
            keyword={keyword}
            isValid={validatedKeywords?.[keyword]}
            onRemove={() => onRemove(i)}
          />
        ))}
      </div>

      <p className="text-sm text-gray-500">
        {keywords.length}/{maxKeywords} keywords
      </p>
    </div>
  )
}
```

### 2. Inquiry Attempt Hook

```typescript
// features/inquiry-mode/hooks/useInquiryAttempt.ts
export function useInquiryAttempt(activityId: string) {
  const [attempt, setAttempt] = useState<InquiryAttempt | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [keywords, setKeywords] = useState<Record<string, string[]>>({})
  const [validations, setValidations] = useState<Record<string, Record<string, boolean>>>({})
  const [submitting, setSubmitting] = useState(false)

  // Start attempt
  const startAttempt = async () => { ... }

  // Keyword management
  const addKeyword = (questionId: string, keyword: string) => {
    setKeywords(prev => ({
      ...prev,
      [questionId]: [...(prev[questionId] || []), keyword]
    }))
  }

  const removeKeyword = (questionId: string, index: number) => { ... }

  // Validate keywords
  const validateKeywords = async (questionId: string) => { ... }

  // Submit
  const submitAttempt = async () => { ... }

  return {
    attempt,
    currentQuestion: attempt?.questions[currentQuestionIndex],
    keywords,
    validations,
    addKeyword,
    removeKeyword,
    validateKeywords,
    submitAttempt,
    submitting,
  }
}
```

### 3. Simplified Take Page

```typescript
// inquiry/take/page.tsx
'use client'

import { useInquiryAttempt } from '@/features/inquiry-mode/hooks'
import { KeywordInput, InquiryProgress } from '@/features/inquiry-mode/components'
import { ActivityTimer } from '@/features/shared/components'

export default function InquiryTakePage() {
  const { id } = useParams()
  const inquiry = useInquiryAttempt(id)

  if (!inquiry.attempt) return <LoadingState />

  const questionId = inquiry.currentQuestion?.id

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex justify-between mb-6">
        <InquiryProgress 
          current={inquiry.currentQuestionIndex + 1}
          total={inquiry.attempt.questions.length}
        />
        {inquiry.attempt.timeLimit && (
          <ActivityTimer
            totalSeconds={inquiry.attempt.timeLimit * 60}
            onTimeUp={inquiry.submitAttempt}
          />
        )}
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-medium mb-4">
          {inquiry.currentQuestion?.text}
        </h2>

        <KeywordInput
          keywords={inquiry.keywords[questionId] || []}
          onAdd={(k) => inquiry.addKeyword(questionId, k)}
          onRemove={(i) => inquiry.removeKeyword(questionId, i)}
          validatedKeywords={inquiry.validations[questionId]}
        />

        <Button 
          onClick={() => inquiry.validateKeywords(questionId)}
          className="mt-4"
        >
          Check Keywords
        </Button>
      </div>

      <div className="flex justify-between mt-6">
        <Button onClick={inquiry.prevQuestion}>Previous</Button>
        <Button onClick={inquiry.nextQuestion}>Next</Button>
      </div>
    </div>
  )
}
```

## Related Files

- `src/app/(dashboard)/activities/[id]/inquiry/` - All inquiry pages
- `src/features/exam-mode/` - Share timer, leaderboard patterns
- `src/features/case-mode/` - Share timer

## Dependencies

**Blocked By:**
- VIBE-0004 (Exam Mode) - share timer component

**Blocks:**
- None

## Notes

- Inquiry mode is simpler than Exam/Case but still benefits from extraction
- Keyword validation is AI-powered - keep API logic in hook
- Leaderboard pattern should be shared across all modes
- Consider `src/features/shared/` for cross-mode components

## Conversation History

| Date | Note |
|------|------|
| 2026-01-17 | Created - Inquiry is third activity mode |
