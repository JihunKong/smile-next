'use client'

import { useRef } from 'react'

type ImageType = 'logo' | 'watermark' | 'signature'

const LOGO_POSITIONS = [
  { value: 'top-left', label: 'Top Left' },
  { value: 'top-center', label: 'Top Center' },
  { value: 'top-right', label: 'Top Right' },
]

interface DesignSectionProps {
  logoImageUrl: string | null
  watermarkImageUrl: string | null
  signatureImageUrl: string | null
  logoPosition: string
  onLogoPositionChange: (position: string) => void
  onImageUpload: (file: File, type: ImageType) => void
  onRemoveImage: (type: ImageType) => void
}

export function DesignSection({
  logoImageUrl,
  watermarkImageUrl,
  signatureImageUrl,
  logoPosition,
  onLogoPositionChange,
  onImageUpload,
  onRemoveImage,
}: DesignSectionProps) {
  const logoInputRef = useRef<HTMLInputElement>(null)
  const watermarkInputRef = useRef<HTMLInputElement>(null)
  const signatureInputRef = useRef<HTMLInputElement>(null)

  return (
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
            onChange={(e) => e.target.files?.[0] && onImageUpload(e.target.files[0], 'logo')}
            className="hidden"
          />
          {logoImageUrl ? (
            <div className="flex items-center gap-4">
              <img src={logoImageUrl} alt="Logo" className="w-20 h-20 object-contain border rounded" />
              <button type="button" onClick={() => onRemoveImage('logo')} className="text-red-600 hover:text-red-800 text-sm">
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
            onChange={(e) => onLogoPositionChange(e.target.value)}
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
            onChange={(e) => e.target.files?.[0] && onImageUpload(e.target.files[0], 'watermark')}
            className="hidden"
          />
          {watermarkImageUrl ? (
            <div className="flex items-center gap-4">
              <img src={watermarkImageUrl} alt="Watermark" className="w-20 h-20 object-contain border rounded" />
              <button type="button" onClick={() => onRemoveImage('watermark')} className="text-red-600 hover:text-red-800 text-sm">
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
            onChange={(e) => e.target.files?.[0] && onImageUpload(e.target.files[0], 'signature')}
            className="hidden"
          />
          {signatureImageUrl ? (
            <div className="flex items-center gap-4">
              <img src={signatureImageUrl} alt="Signature" className="w-20 h-20 object-contain border rounded" />
              <button type="button" onClick={() => onRemoveImage('signature')} className="text-red-600 hover:text-red-800 text-sm">
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
  )
}
