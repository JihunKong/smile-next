'use client'

import { useRef, useEffect } from 'react'

interface CertificatePreviewProps {
  name: string
  organizationName: string
  programName: string
  certificateStatement: string
  signatoryName: string
  logoImageUrl: string | null
  watermarkImageUrl: string | null
  signatureImageUrl: string | null
  logoPosition: string
  qrCodeEnabled: boolean
  qrCodePosition: string
  studentName?: string
}

const LOGO_POSITIONS: Record<string, { top?: string; left?: string; right?: string; bottom?: string }> = {
  'top-left': { top: '24px', left: '32px' },
  'top-center': { top: '24px', left: '50%' },
  'top-right': { top: '24px', right: '32px' },
}

const QR_POSITIONS: Record<string, { top?: string; left?: string; right?: string; bottom?: string }> = {
  'bottom-left': { bottom: '24px', left: '32px' },
  'bottom-center': { bottom: '24px', left: '50%' },
  'bottom-right': { bottom: '24px', right: '32px' },
}

export default function CertificatePreview({
  name,
  organizationName,
  programName,
  certificateStatement,
  signatoryName,
  logoImageUrl,
  watermarkImageUrl,
  signatureImageUrl,
  logoPosition,
  qrCodeEnabled,
  qrCodePosition,
  studentName = '[Student Name]',
}: CertificatePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // A4 landscape ratio: 297mm x 210mm = 1.414:1
  const aspectRatio = 297 / 210

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const parent = containerRef.current.parentElement
        if (parent) {
          const width = parent.clientWidth
          containerRef.current.style.height = `${width / aspectRatio}px`
        }
      }
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [aspectRatio])

  const logoPos = LOGO_POSITIONS[logoPosition] || LOGO_POSITIONS['top-left']
  const qrPos = QR_POSITIONS[qrCodePosition] || QR_POSITIONS['bottom-right']

  return (
    <div className="w-full overflow-hidden rounded-lg shadow-lg border border-gray-200">
      <div
        ref={containerRef}
        className="relative w-full bg-white"
        style={{
          minHeight: '280px',
          backgroundImage: watermarkImageUrl ? `url(${watermarkImageUrl})` : undefined,
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Watermark overlay for opacity */}
        {watermarkImageUrl && (
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: `url(${watermarkImageUrl})`,
              backgroundSize: '60%',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          />
        )}

        {/* Border Frame */}
        <div className="absolute inset-3 border-2 border-[#8C1515] pointer-events-none" />
        <div className="absolute inset-4 border border-[#8C1515]/50 pointer-events-none" />

        {/* Logo */}
        {logoImageUrl && (
          <div
            className="absolute"
            style={{
              ...logoPos,
              transform: logoPosition === 'top-center' ? 'translateX(-50%)' : undefined,
            }}
          >
            <img
              src={logoImageUrl}
              alt="Logo"
              className="h-12 w-auto object-contain"
            />
          </div>
        )}

        {/* Main Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 pt-20 pb-24 text-center">
          {/* Organization Name */}
          {organizationName && (
            <p className="text-sm font-medium text-[#8C1515] tracking-widest uppercase mb-1">
              {organizationName}
            </p>
          )}

          {/* Program Name */}
          {programName && (
            <p className="text-xs text-gray-600 mb-4">{programName}</p>
          )}

          {/* Certificate Title */}
          <h1 className="text-2xl md:text-3xl font-bold text-[#2E2D29] mb-2">
            Certificate of Completion
          </h1>

          {/* Certificate Name */}
          <h2 className="text-lg md:text-xl font-semibold text-[#8C1515] mb-4">
            {name || 'Certificate Name'}
          </h2>

          {/* Presented To */}
          <p className="text-xs text-gray-500 mb-1">This certificate is presented to</p>

          {/* Student Name */}
          <p className="text-xl md:text-2xl font-serif italic text-[#2E2D29] border-b border-gray-300 pb-1 px-8 mb-4">
            {studentName}
          </p>

          {/* Certificate Statement */}
          {certificateStatement && (
            <p className="text-xs text-gray-600 max-w-md leading-relaxed mb-4">
              {certificateStatement}
            </p>
          )}

          {/* Date */}
          <p className="text-xs text-gray-500 mb-6">
            Issued on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          {/* Signature Section */}
          <div className="flex flex-col items-center">
            {signatureImageUrl ? (
              <img
                src={signatureImageUrl}
                alt="Signature"
                className="h-10 w-auto object-contain mb-1"
              />
            ) : (
              <div className="h-10 w-32 border-b border-gray-400 mb-1" />
            )}
            {signatoryName && (
              <p className="text-xs font-medium text-gray-700">{signatoryName}</p>
            )}
          </div>
        </div>

        {/* QR Code Placeholder */}
        {qrCodeEnabled && (
          <div
            className="absolute"
            style={{
              ...qrPos,
              transform: qrCodePosition === 'bottom-center' ? 'translateX(-50%)' : undefined,
            }}
          >
            <div className="w-12 h-12 bg-gray-200 border border-gray-300 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5h-2zM3 13h6v6H3v-6zm2 2v2h2v-2H5zm13-2h3v2h-3v-2zm-5 0h2v2h-2v-2zm2 2h2v2h-2v-2zm2 2h3v3h-3v-3zm-2 0h2v3h-2v-3zm-2 2h2v1h-2v-1z" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
