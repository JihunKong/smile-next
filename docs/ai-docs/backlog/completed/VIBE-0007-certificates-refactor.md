---
id: VIBE-0007
title: Refactor Certificates pages for AI-friendly development (2333 total lines)
status: backlog
priority: high
category: refactoring
component: ui
created: 2026-01-17
updated: 2026-01-17
effort: m
assignee: ai-agent
---

# Refactor Certificates Pages for Vibe Coding

## Summary

Certificates feature has **5 pages totaling 2,333 lines**. The certificate designer is particularly complex with drag-and-drop badge placement, image uploads, and preview generation.

| File | Lines | Purpose |
|------|-------|---------|
| `certificates/designer/page.tsx` | 858 | Design certificate template |
| `certificates/[id]/edit/page.tsx` | 577 | Edit existing certificate |
| `certificates/create/page.tsx` | 455 | Create new certificate |
| `certificates/browse/page.tsx` | 428 | Browse available certificates |
| `my-certificates/[id]/progress/page.tsx` | 415 | Track progress toward cert |
| **Total** | **2,333** | |

## Current Behavior

- Designer has complex canvas/positioning logic
- Create/edit duplicate form patterns
- Browse has filtering and search inline
- Progress page has multiple progress indicators

## Expected Behavior

```
features/certificates/
├── components/
│   ├── CertificateCard.tsx       (~80 lines)
│   ├── CertificateForm.tsx       (~150 lines) - Create/edit form
│   ├── CertificatePreview.tsx    (~120 lines) - Preview rendering
│   ├── BadgePlacer.tsx           (~150 lines) - Drag-drop badges
│   ├── RequirementsEditor.tsx    (~120 lines) - Edit requirements
│   ├── ProgressTracker.tsx       (~100 lines) - Progress display
│   ├── RequirementProgress.tsx   (~80 lines)  - Single requirement
│   └── index.ts
├── hooks/
│   ├── useCertificate.ts         (~80 lines)
│   ├── useCertificates.ts        (~60 lines)
│   ├── useCertificateProgress.ts (~80 lines)
│   └── index.ts
└── types.ts

app/(dashboard)/certificates/
├── browse/page.tsx              (~100 lines)
├── create/page.tsx              (~80 lines)
├── designer/page.tsx            (~150 lines) - Complex, but composed
├── [id]/
│   ├── page.tsx                 (~80 lines)
│   └── edit/page.tsx            (~80 lines)

app/(dashboard)/my-certificates/
├── page.tsx
└── [id]/progress/page.tsx       (~100 lines)
```

## Acceptance Criteria

- [ ] Create `src/features/certificates/` module
- [ ] Extract `CertificateForm` shared between create/edit
- [ ] Extract `BadgePlacer` for designer canvas
- [ ] Extract `ProgressTracker` for my-certificates
- [ ] Designer page under 200 lines (canvas is complex)
- [ ] All other pages under 120 lines
- [ ] Browse uses extracted `CertificateCard`

## Technical Approach

### 1. Certificate Form Component

```typescript
// features/certificates/components/CertificateForm.tsx
interface Props {
  certificate?: Certificate  // Undefined for create
  onSubmit: (data: CertificateFormData) => Promise<void>
  isSubmitting?: boolean
}

export function CertificateForm({ certificate, onSubmit, isSubmitting }: Props) {
  const [formData, setFormData] = useState<CertificateFormData>({
    name: certificate?.name || '',
    description: certificate?.description || '',
    category: certificate?.category || 'academic',
    requirements: certificate?.requirements || [],
  })

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData) }}>
      <div className="space-y-6">
        <Input
          label="Certificate Name"
          value={formData.name}
          onChange={(e) => setFormData(d => ({ ...d, name: e.target.value }))}
          required
        />
        
        <Textarea
          label="Description"
          value={formData.description}
          onChange={(e) => setFormData(d => ({ ...d, description: e.target.value }))}
        />

        <CategorySelector
          value={formData.category}
          onChange={(cat) => setFormData(d => ({ ...d, category: cat }))}
        />

        <RequirementsEditor
          requirements={formData.requirements}
          onChange={(reqs) => setFormData(d => ({ ...d, requirements: reqs }))}
        />
      </div>

      <Button type="submit" isLoading={isSubmitting} className="mt-6">
        {certificate ? 'Save Changes' : 'Create Certificate'}
      </Button>
    </form>
  )
}
```

### 2. Progress Tracker Component

```typescript
// features/certificates/components/ProgressTracker.tsx
interface Props {
  certificate: Certificate
  progress: CertificateProgress
}

export function ProgressTracker({ certificate, progress }: Props) {
  const overallPercent = Math.round(
    (progress.completedRequirements / certificate.requirements.length) * 100
  )

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">{certificate.name}</h2>
        <span className="text-2xl font-bold text-primary">{overallPercent}%</span>
      </div>

      <ProgressBar value={overallPercent} className="mb-6" />

      <div className="space-y-4">
        {certificate.requirements.map((req, i) => (
          <RequirementProgress
            key={req.id}
            requirement={req}
            progress={progress.requirements[i]}
          />
        ))}
      </div>

      {overallPercent === 100 && (
        <Button variant="primary" className="w-full mt-6">
          Claim Certificate
        </Button>
      )}
    </div>
  )
}
```

### 3. Simplified Designer Page

```typescript
// certificates/designer/page.tsx
'use client'

import { useCertificate } from '@/features/certificates/hooks'
import { 
  CertificatePreview, 
  BadgePlacer, 
  RequirementsEditor 
} from '@/features/certificates/components'

export default function CertificateDesignerPage() {
  const { id } = useParams()
  const { certificate, loading, updateCertificate } = useCertificate(id)
  const [activeTab, setActiveTab] = useState<'design' | 'requirements'>('design')

  if (loading) return <LoadingState />

  return (
    <div className="max-w-6xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Certificate Designer</h1>

      {/* Tab navigation */}
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tab value="design">Visual Design</Tab>
        <Tab value="requirements">Requirements</Tab>
      </Tabs>

      <div className="grid grid-cols-2 gap-8 mt-6">
        {/* Left: Editor */}
        <div>
          {activeTab === 'design' ? (
            <BadgePlacer
              badges={certificate.badges}
              onChange={(badges) => updateCertificate({ badges })}
            />
          ) : (
            <RequirementsEditor
              requirements={certificate.requirements}
              onChange={(reqs) => updateCertificate({ requirements: reqs })}
            />
          )}
        </div>

        {/* Right: Preview */}
        <div className="sticky top-8">
          <CertificatePreview certificate={certificate} />
        </div>
      </div>
    </div>
  )
}
```

## Related Files

- `src/app/(dashboard)/certificates/` - All certificate pages
- `src/app/(dashboard)/my-certificates/` - User's earned certificates
- `src/lib/certificates/` - Certificate utilities

## Dependencies

**Blocked By:**
- None

**Blocks:**
- None

## Notes

- Designer is legitimately complex - 200 lines is acceptable
- BadgePlacer may need canvas or drag-drop library
- Consider using react-dnd or @dnd-kit for drag-drop
- Preview component should match actual PDF output

## Conversation History

| Date | Note |
|------|------|
| 2026-01-17 | Created - Certificates are a key feature |
