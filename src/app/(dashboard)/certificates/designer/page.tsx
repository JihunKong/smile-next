'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import CertificatePreview from './components/CertificatePreview'
import ActivitySelector from './components/ActivitySelector'

// Feature module imports
import { useCertificateForm, CertificateFormFields } from '@/features/certificates'

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

const LOGO_POSITIONS = [
  { value: 'top-left', label: 'Top Left' },
  { value: 'top-center', label: 'Top Center' },
  { value: 'top-right', label: 'Top Right' },
]

const QR_POSITIONS = [
  { value: 'bottom-left', label: 'Bottom Left' },
  { value: 'bottom-center', label: 'Bottom Center' },
  { value: 'bottom-right', label: 'Bottom Right' },
]

export default function CertificateDesignerPage() {
  const router = useRouter()
  const { data: session } = useSession()

  // Use the certificate form hook for form state management
  const {
    formData,
    errors,
    setField,
    validate,
  } = useCertificateForm()

  // Design state (not in form hook - specific to designer)
  const [logoImageUrl, setLogoImageUrl] = useState<string | null>(null)
  const [watermarkImageUrl, setWatermarkImageUrl] = useState<string | null>(null)
  const [signatureImageUrl, setSignatureImageUrl] = useState<string | null>(null)
  const [logoPosition, setLogoPosition] = useState('top-left')
  const [qrCodeEnabled, setQrCodeEnabled] = useState(true)
  const [qrCodePosition, setQrCodePosition] = useState('bottom-right')

  // Activities state (with mode field for designer)
  const [selectedActivities, setSelectedActivities] = useState<DesignerActivity[]>([])

  // UI state
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [certificateId, setCertificateId] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<'basic' | 'design' | 'activities' | 'qr'>('basic')

  // File input refs
  const logoInputRef = useRef<HTMLInputElement>(null)
  const watermarkInputRef = useRef<HTMLInputElement>(null)
  const signatureInputRef = useRef<HTMLInputElement>(null)

  // Permission check
  const isTeacherOrAdmin = session?.user?.roleId !== undefined && session.user.roleId <= 2

  // Handle image upload
  const handleImageUpload = async (file: File, type: ImageType) => {
    if (!certificateId) {
      // First, create a draft certificate
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
      const res = await fetch(`/api/certificates/${certId}/images`, {
        method: 'POST',
        body: formDataObj,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to upload image')
      }

      const data = await res.json()

      switch (type) {
        case 'logo':
          setLogoImageUrl(data.imageUrl)
          break
        case 'watermark':
          setWatermarkImageUrl(data.imageUrl)
          break
        case 'signature':
          setSignatureImageUrl(data.imageUrl)
          break
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image')
    }
  }

  const handleRemoveImage = async (type: ImageType) => {
    if (!certificateId) return

    try {
      const res = await fetch(`/api/certificates/${certificateId}/images?type=${type}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to remove image')
      }

      switch (type) {
        case 'logo':
          setLogoImageUrl(null)
          break
        case 'watermark':
          setWatermarkImageUrl(null)
          break
        case 'signature':
          setSignatureImageUrl(null)
          break
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove image')
    }
  }

  // Build payload for API
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
    activities: selectedActivities.map((a) => ({
      activityId: a.activityId,
      sequenceOrder: a.sequenceOrder,
      required: a.required,
    })),
  })

  // Save as draft
  const handleSaveDraft = async () => {
    if (!formData.name.trim()) {
      setError('Certificate name is required')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const payload = buildPayload('draft')

      let res: Response
      if (certificateId) {
        res = await fetch(`/api/certificates/${certificateId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch('/api/certificates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save certificate')
      }

      const data = await res.json()
      setCertificateId(data.certificate.id)

      alert('Certificate saved as draft!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save certificate')
    } finally {
      setSaving(false)
    }
  }

  // Submit for approval
  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('Certificate name is required')
      return
    }

    if (selectedActivities.length === 0) {
      setError('At least one activity is required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const payload = buildPayload('pending_approval')

      let res: Response
      if (certificateId) {
        res = await fetch(`/api/certificates/${certificateId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch('/api/certificates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit certificate')
      }

      const data = await res.json()
      router.push(`/certificates/${data.certificate.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit certificate')
    } finally {
      setLoading(false)
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Please sign in to design certificates.</p>
      </div>
    )
  }

  if (!isTeacherOrAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">You do not have permission to design certificates.</p>
          <Link href="/certificates" className="text-[#8C1515] hover:underline">
            Browse Certificates
          </Link>
        </div>
      </div>
    )
  }

  const sections = [
    { id: 'basic' as const, label: 'Basic Info', icon: '1' },
    { id: 'design' as const, label: 'Design', icon: '2' },
    { id: 'activities' as const, label: 'Activities', icon: '3' },
    { id: 'qr' as const, label: 'QR Code', icon: '4' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-[#8C1515] to-[#B83A4B] text-white py-6 px-4">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/certificates"
            className="inline-flex items-center gap-1 text-white/80 hover:text-white mb-3"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Certificates
          </Link>
          <h1 className="text-2xl font-bold">Certificate Designer</h1>
          <p className="text-white/80 mt-1">Create a new certificate program with visual customization</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start gap-3">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Form */}
          <div className="space-y-6">
            {/* Section Navigation */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex flex-wrap gap-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                      activeSection === section.id
                        ? 'bg-[#8C1515] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                      activeSection === section.id ? 'bg-white text-[#8C1515]' : 'bg-gray-300 text-gray-600'
                    }`}>
                      {section.icon}
                    </span>
                    {section.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Basic Information Section - Using Feature Component */}
            {activeSection === 'basic' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Basic Information & Content</h2>
                <CertificateFormFields
                  formData={formData}
                  errors={errors}
                  onChange={setField}
                  disabled={loading || saving}
                />
              </div>
            )}

            {/* Design Section */}
            {activeSection === 'design' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Visual Design</h2>

                <div className="space-y-6">
                  {/* Logo Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Logo Image</label>
                    <input
                      type="file"
                      ref={logoInputRef}
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'logo')}
                      className="hidden"
                    />
                    {logoImageUrl ? (
                      <div className="flex items-center gap-4">
                        <img src={logoImageUrl} alt="Logo" className="w-20 h-20 object-contain border rounded" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage('logo')}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 text-gray-600 text-sm"
                      >
                        Upload Logo
                      </button>
                    )}
                  </div>

                  {/* Logo Position */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Logo Position</label>
                    <select
                      value={logoPosition}
                      onChange={(e) => setLogoPosition(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8C1515] focus:border-transparent outline-none transition"
                    >
                      {LOGO_POSITIONS.map((pos) => (
                        <option key={pos.value} value={pos.value}>{pos.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Watermark Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Watermark Image</label>
                    <input
                      type="file"
                      ref={watermarkInputRef}
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'watermark')}
                      className="hidden"
                    />
                    {watermarkImageUrl ? (
                      <div className="flex items-center gap-4">
                        <img src={watermarkImageUrl} alt="Watermark" className="w-20 h-20 object-contain border rounded" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage('watermark')}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => watermarkInputRef.current?.click()}
                        className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 text-gray-600 text-sm"
                      >
                        Upload Watermark
                      </button>
                    )}
                  </div>

                  {/* Signature Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Signature Image</label>
                    <input
                      type="file"
                      ref={signatureInputRef}
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'signature')}
                      className="hidden"
                    />
                    {signatureImageUrl ? (
                      <div className="flex items-center gap-4">
                        <img src={signatureImageUrl} alt="Signature" className="w-20 h-20 object-contain border rounded" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage('signature')}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => signatureInputRef.current?.click()}
                        className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 text-gray-600 text-sm"
                      >
                        Upload Signature
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Activities Section */}
            {activeSection === 'activities' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  Required Activities <span className="text-red-500">*</span>
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  Add activities that students must complete to earn this certificate.
                </p>

                <ActivitySelector
                  selectedActivities={selectedActivities}
                  onActivitiesChange={setSelectedActivities}
                />
              </div>
            )}

            {/* QR Code Section */}
            {activeSection === 'qr' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">QR Code Settings</h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Enable QR Code</label>
                      <p className="text-xs text-gray-500">
                        Display a QR code for certificate verification
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={qrCodeEnabled}
                        onChange={(e) => setQrCodeEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#8C1515]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8C1515]"></div>
                    </label>
                  </div>

                  {qrCodeEnabled && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        QR Code Position
                      </label>
                      <select
                        value={qrCodePosition}
                        onChange={(e) => setQrCodePosition(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8C1515] focus:border-transparent outline-none transition"
                      >
                        {QR_POSITIONS.map((pos) => (
                          <option key={pos.value} value={pos.value}>{pos.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex flex-wrap items-center justify-end gap-3">
                <Link
                  href="/certificates"
                  className="px-6 py-2.5 text-gray-700 font-medium hover:text-gray-900 transition"
                >
                  Cancel
                </Link>
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={saving}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 transition flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      Save Draft
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2.5 bg-[#8C1515] text-white font-semibold rounded-lg hover:bg-[#6D1010] disabled:opacity-50 transition flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Submit for Approval
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Preview */}
          <div className="lg:sticky lg:top-6 h-fit">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Live Preview
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                A4 Landscape format - Preview updates as you edit
              </p>

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

              {/* Status Badge */}
              <div className="mt-4 flex items-center justify-between">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {certificateId ? 'Draft Saved' : 'New Certificate'}
                </span>
                <span className="text-xs text-gray-500">
                  {selectedActivities.length} activities selected
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
