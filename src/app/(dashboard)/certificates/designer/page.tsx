'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import CertificatePreview from './components/CertificatePreview'
import ActivitySelector from './components/ActivitySelector'

import {
  useCertificateForm,
  CertificateFormFields,
  DesignerHeader,
  SectionNavigation,
  DesignSection,
  QRCodeSection,
  DesignerActions,
  type SectionId,
} from '@/features/certificates'

type ImageType = 'logo' | 'watermark' | 'signature'

interface DesignerActivity {
  activityId: string
  name: string
  activityType: string
  mode: number
  sequenceOrder: number
  required: boolean
  groupName?: string
}

export default function CertificateDesignerPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { formData, errors, setField, validate } = useCertificateForm()

  const [logoImageUrl, setLogoImageUrl] = useState<string | null>(null)
  const [watermarkImageUrl, setWatermarkImageUrl] = useState<string | null>(null)
  const [signatureImageUrl, setSignatureImageUrl] = useState<string | null>(null)
  const [logoPosition, setLogoPosition] = useState('top-left')
  const [qrCodeEnabled, setQrCodeEnabled] = useState(true)
  const [qrCodePosition, setQrCodePosition] = useState('bottom-right')
  const [selectedActivities, setSelectedActivities] = useState<DesignerActivity[]>([])

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [certificateId, setCertificateId] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<SectionId>('basic')

  const isTeacherOrAdmin = session?.user?.roleId !== undefined && session.user.roleId <= 2

  const handleImageUpload = async (file: File, type: ImageType) => {
    if (!certificateId) {
      try {
        const res = await fetch('/api/certificates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name || 'Untitled Certificate',
            status: 'draft',
            organizationName: formData.organizationName || null,
            programName: formData.programName || null,
            signatoryName: formData.signatoryName || null,
            certificateStatement: formData.certificateStatement || null,
            studentInstructions: formData.studentInstructions || null,
            activities: [],
          }),
        })
        if (!res.ok) throw new Error('Failed to create draft certificate')
        const data = await res.json()
        setCertificateId(data.certificate.id)
        await uploadImage(data.certificate.id, file, type)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to upload image')
      }
    } else {
      await uploadImage(certificateId, file, type)
    }
  }

  const uploadImage = async (certId: string, file: File, type: ImageType) => {
    const formDataObj = new FormData()
    formDataObj.append('file', file)
    formDataObj.append('type', type)

    try {
      const res = await fetch(`/api/certificates/${certId}/images`, { method: 'POST', body: formDataObj })
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'Failed to upload image') }
      const data = await res.json()
      switch (type) {
        case 'logo': setLogoImageUrl(data.imageUrl); break
        case 'watermark': setWatermarkImageUrl(data.imageUrl); break
        case 'signature': setSignatureImageUrl(data.imageUrl); break
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image')
    }
  }

  const handleRemoveImage = async (type: ImageType) => {
    if (!certificateId) return
    try {
      const res = await fetch(`/api/certificates/${certificateId}/images?type=${type}`, { method: 'DELETE' })
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'Failed to remove image') }
      switch (type) {
        case 'logo': setLogoImageUrl(null); break
        case 'watermark': setWatermarkImageUrl(null); break
        case 'signature': setSignatureImageUrl(null); break
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove image')
    }
  }

  const buildPayload = (status: string) => ({
    name: formData.name,
    status,
    organizationName: formData.organizationName || null,
    programName: formData.programName || null,
    signatoryName: formData.signatoryName || null,
    certificateStatement: formData.certificateStatement || null,
    studentInstructions: formData.studentInstructions || null,
    logoPosition,
    qrCodeEnabled,
    qrCodePosition,
    activities: selectedActivities.map((a) => ({ activityId: a.activityId, sequenceOrder: a.sequenceOrder, required: a.required })),
  })

  const handleSaveDraft = async () => {
    if (!formData.name.trim()) { setError('Certificate name is required'); return }
    setSaving(true)
    setError(null)
    try {
      const payload = buildPayload('draft')
      const res = certificateId
        ? await fetch(`/api/certificates/${certificateId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        : await fetch('/api/certificates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'Failed to save certificate') }
      const data = await res.json()
      setCertificateId(data.certificate.id)
      alert('Certificate saved as draft!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save certificate')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) { setError('Certificate name is required'); return }
    if (selectedActivities.length === 0) { setError('At least one activity is required'); return }
    setLoading(true)
    setError(null)
    try {
      const payload = buildPayload('pending_approval')
      const res = certificateId
        ? await fetch(`/api/certificates/${certificateId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        : await fetch('/api/certificates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'Failed to submit certificate') }
      const data = await res.json()
      router.push(`/certificates/${data.certificate.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit certificate')
    } finally {
      setLoading(false)
    }
  }

  if (!session) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-600">Please sign in to design certificates.</p></div>
  }

  if (!isTeacherOrAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">You do not have permission to design certificates.</p>
          <Link href="/certificates" className="text-[#8C1515] hover:underline">Browse Certificates</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DesignerHeader />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start gap-3">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div><p className="font-medium">Error</p><p className="text-sm">{error}</p></div>
            <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <SectionNavigation activeSection={activeSection} onSectionChange={setActiveSection} />

            {activeSection === 'basic' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Basic Information & Content</h2>
                <CertificateFormFields formData={formData} errors={errors} onChange={setField} disabled={loading || saving} />
              </div>
            )}

            {activeSection === 'design' && (
              <DesignSection
                logoImageUrl={logoImageUrl}
                watermarkImageUrl={watermarkImageUrl}
                signatureImageUrl={signatureImageUrl}
                logoPosition={logoPosition}
                onLogoPositionChange={setLogoPosition}
                onImageUpload={handleImageUpload}
                onRemoveImage={handleRemoveImage}
              />
            )}

            {activeSection === 'activities' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Required Activities <span className="text-red-500">*</span></h2>
                <p className="text-sm text-gray-600 mb-4">Add activities that students must complete to earn this certificate.</p>
                <ActivitySelector selectedActivities={selectedActivities} onActivitiesChange={setSelectedActivities} />
              </div>
            )}

            {activeSection === 'qr' && (
              <QRCodeSection
                qrCodeEnabled={qrCodeEnabled}
                qrCodePosition={qrCodePosition}
                onQrCodeEnabledChange={setQrCodeEnabled}
                onQrCodePositionChange={setQrCodePosition}
              />
            )}

            <DesignerActions saving={saving} loading={loading} onSaveDraft={handleSaveDraft} onSubmit={handleSubmit} />
          </div>

          <div className="lg:sticky lg:top-6 h-fit">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Live Preview
              </h2>
              <p className="text-sm text-gray-500 mb-4">A4 Landscape format - Preview updates as you edit</p>
              <CertificatePreview
                name={formData.name}
                organizationName={formData.organizationName}
                programName={formData.programName}
                certificateStatement={formData.certificateStatement}
                signatoryName={formData.signatoryName}
                logoImageUrl={logoImageUrl}
                watermarkImageUrl={watermarkImageUrl}
                signatureImageUrl={signatureImageUrl}
                logoPosition={logoPosition}
                qrCodeEnabled={qrCodeEnabled}
                qrCodePosition={qrCodePosition}
              />
              <div className="mt-4 flex items-center justify-between">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {certificateId ? 'Draft Saved' : 'New Certificate'}
                </span>
                <span className="text-xs text-gray-500">{selectedActivities.length} activities selected</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
