---
id: VIBE-0003G
title: Extract Dashboard CertificateProgress with tests
status: backlog
priority: critical
category: refactoring
component: ui
created: 2026-01-18
updated: 2026-01-18
effort: m
assignee: ai-agent
---

# Extract Dashboard Certificate Progress

## Summary

Extract the certificate progress section from `dashboard/page.tsx`. This is the most complex component with nested activity lists, progress bars, and conditional rendering. Only renders when user has enrolled certificates.

## Current Behavior

Certificate section in `page.tsx` (lines 534-706) - ~175 lines containing:
- Certificate cards with enrollment dates
- Progress bars with percentage
- Nested activity lists with status icons
- Encouraging message footer
- Conditional rendering (only when certificates exist)

## Expected Behavior

```
dashboard/components/
└── CertificateProgress.tsx  (~200 lines) - Certificate cards with activities
```

## Acceptance Criteria

- [ ] Unit tests written FIRST covering all states
- [ ] `CertificateProgress.tsx` returns null when no certificates
- [ ] Renders certificate name and enrollment date
- [ ] Shows progress bar with correct percentage
- [ ] Renders activity list with status icons (passed, failed, in_progress, not_started)
- [ ] Shows completion status badge (Completed/In Progress)
- [ ] Shows encouraging message footer
- [ ] Tests pass: `npm run test -- CertificateProgress`
- [ ] Visual output identical to current

## Technical Approach

### 1. Write Tests First

```typescript
// tests/unit/app/dashboard/components/CertificateProgress.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { CertificateProgress } from '@/app/(dashboard)/dashboard/components'
import type { ProcessedCertificate } from '@/app/(dashboard)/dashboard/types'

const createMockCertificate = (overrides: Partial<ProcessedCertificate> = {}): ProcessedCertificate => ({
  id: 'cert-1',
  name: 'AI Fundamentals',
  status: 'in_progress',
  enrollment_date: new Date('2026-01-01'),
  completion_date: null,
  progress_percentage: 60,
  activities: [
    { activity_id: 'a1', activity_name: 'Intro to ML', required: true, status: 'passed' },
    { activity_id: 'a2', activity_name: 'Neural Networks', required: true, status: 'not_started' },
  ],
  ...overrides,
})

describe('CertificateProgress', () => {
  it('returns null when no certificates', () => {
    const { container } = render(<CertificateProgress certificates={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders certificate name', () => {
    render(<CertificateProgress certificates={[createMockCertificate()]} />)
    expect(screen.getByText('AI Fundamentals')).toBeInTheDocument()
  })

  it('renders My Certificates heading', () => {
    render(<CertificateProgress certificates={[createMockCertificate()]} />)
    expect(screen.getByText('My Certificates')).toBeInTheDocument()
  })

  it('shows View All link', () => {
    render(<CertificateProgress certificates={[createMockCertificate()]} />)
    expect(screen.getByRole('link', { name: /View All/i })).toHaveAttribute('href', '/my-certificates')
  })

  it('shows enrollment date', () => {
    render(<CertificateProgress certificates={[createMockCertificate()]} />)
    expect(screen.getByText(/Enrolled Jan 1, 2026/)).toBeInTheDocument()
  })

  it('shows In Progress badge for incomplete certificate', () => {
    render(<CertificateProgress certificates={[createMockCertificate({ status: 'in_progress' })]} />)
    expect(screen.getByText('In Progress')).toBeInTheDocument()
  })

  it('shows Completed badge for complete certificate', () => {
    render(<CertificateProgress certificates={[createMockCertificate({
      status: 'completed',
      completion_date: new Date('2026-01-15'),
    })]} />)
    expect(screen.getByText('Completed')).toBeInTheDocument()
  })

  it('displays progress percentage', () => {
    render(<CertificateProgress certificates={[createMockCertificate({ progress_percentage: 75 })]} />)
    expect(screen.getByText('75%')).toBeInTheDocument()
  })

  it('renders activity list', () => {
    render(<CertificateProgress certificates={[createMockCertificate()]} />)
    expect(screen.getByText('Intro to ML')).toBeInTheDocument()
    expect(screen.getByText('Neural Networks')).toBeInTheDocument()
  })

  it('shows passed status for completed activities', () => {
    render(<CertificateProgress certificates={[createMockCertificate()]} />)
    expect(screen.getByTitle('Passed')).toBeInTheDocument()
  })

  it('shows Required label for required activities', () => {
    render(<CertificateProgress certificates={[createMockCertificate()]} />)
    expect(screen.getAllByText('Required')).toHaveLength(2)
  })

  it('shows Optional label for optional activities', () => {
    const cert = createMockCertificate({
      activities: [
        { activity_id: 'a1', activity_name: 'Bonus Activity', required: false, status: 'not_started' },
      ],
    })
    render(<CertificateProgress certificates={[cert]} />)
    expect(screen.getByText('Optional')).toBeInTheDocument()
  })

  it('shows Start link for not_started activities', () => {
    render(<CertificateProgress certificates={[createMockCertificate()]} />)
    expect(screen.getByRole('link', { name: /Start →/i })).toBeInTheDocument()
  })

  it('shows encouraging message footer', () => {
    render(<CertificateProgress certificates={[createMockCertificate()]} />)
    expect(screen.getByText('Keep Learning!')).toBeInTheDocument()
  })

  it('links to certificate progress page', () => {
    render(<CertificateProgress certificates={[createMockCertificate({ id: 'cert-123' })]} />)
    expect(screen.getByRole('link', { name: /View Detailed Progress/i })).toHaveAttribute(
      'href',
      '/my-certificates/cert-123/progress'
    )
  })
})
```

### 2. Create Component

```typescript
// dashboard/components/CertificateProgress.tsx
import Link from 'next/link'
import type { ProcessedCertificate, CertificateActivity } from '../types'

interface CertificateProgressProps {
  certificates: ProcessedCertificate[]
}

export function CertificateProgress({ certificates }: CertificateProgressProps) {
  if (!certificates || certificates.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
          <i className="fas fa-certificate text-purple-500 mr-2"></i>
          My Certificates
        </h2>
        <Link href="/my-certificates" className="text-purple-600 hover:text-purple-800 text-sm font-medium flex items-center">
          View All
          <i className="fas fa-arrow-right ml-1"></i>
        </Link>
      </div>

      <div className="space-y-6">
        {certificates.map((cert) => (
          <CertificateCard key={cert.id} certificate={cert} />
        ))}
      </div>

      <EncouragingMessage />
    </div>
  )
}

function CertificateCard({ certificate }: { certificate: ProcessedCertificate }) {
  return (
    <div className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
      <CertificateHeader certificate={certificate} />
      <ProgressBar percentage={certificate.progress_percentage} />
      {certificate.activities.length > 0 && (
        <ActivityList activities={certificate.activities} />
      )}
      <ViewDetailsLink certificateId={certificate.id} />
    </div>
  )
}

function CertificateHeader({ certificate }: { certificate: ProcessedCertificate }) { ... }
function ProgressBar({ percentage }: { percentage: number }) { ... }
function ActivityList({ activities }: { activities: CertificateActivity[] }) { ... }
function ActivityItem({ activity }: { activity: CertificateActivity }) { ... }
function StatusIcon({ status }: { status: CertificateActivity['status'] }) { ... }
function StatusBadge({ status }: { status: ProcessedCertificate['status'] }) { ... }
function ViewDetailsLink({ certificateId }: { certificateId: string }) { ... }
function EncouragingMessage() { ... }
```

## Related Files

- `src/app/(dashboard)/dashboard/page.tsx` - Source (lines 534-706)

## Dependencies

**Blocked By:**
- VIBE-0003A (Types)

**Blocks:**
- VIBE-0003H (Final Composition)

## Notes

- Most complex component with nested structures
- Many internal helper components for readability
- Status icons need title attributes for accessibility testing
- Consider extracting StatusIcon to shared components

## Conversation History

| Date | Note |
|------|------|
| 2026-01-18 | Created as part of VIBE-0003 breakdown |
