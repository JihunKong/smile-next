'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

interface AvatarUploaderProps {
  currentAvatarUrl: string | null
  initials: string
  onUpload: (file: File) => Promise<{ success: boolean; error?: string }>
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}

const sizeClasses = {
  sm: 'w-16 h-16 text-lg',
  md: 'w-20 h-20 text-2xl',
  lg: 'w-24 h-24 text-3xl',
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

/**
 * Avatar upload component with preview and validation
 *
 * Allows users to select, preview, and upload avatar images.
 * Validates file type and size before upload.
 */
export function AvatarUploader({
  currentAvatarUrl,
  initials,
  onUpload,
  size = 'md',
  disabled = false,
}: AvatarUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const handleButtonClick = useCallback(() => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }, [disabled])

  const validateFile = useCallback((file: File): string | null => {
    if (!file.type.startsWith('image/')) {
      return 'Please select an image file'
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 5MB'
    }
    return null
  }, [])

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      // Clear previous states
      setError(null)
      setSuccessMessage(null)

      // Validate file
      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        return
      }

      // Create preview
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      setSelectedFile(file)
    },
    [validateFile]
  )

  const handleCancel = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    setSelectedFile(null)
    setError(null)
    setSuccessMessage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [previewUrl])

  const handleSave = useCallback(async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setError(null)

    try {
      const result = await onUpload(selectedFile)

      if (result.success) {
        setSuccessMessage('Avatar updated successfully!')
        // Clear preview after successful upload
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl)
        }
        setPreviewUrl(null)
        setSelectedFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        setError(result.error || 'Upload failed')
      }
    } catch {
      setError('Upload failed')
    } finally {
      setIsUploading(false)
    }
  }, [selectedFile, onUpload, previewUrl])

  // Determine what to display
  const displayUrl = previewUrl || currentAvatarUrl

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Avatar Display */}
      <div className="relative">
        <div
          data-testid="avatar-container"
          className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg overflow-hidden`}
        >
          {displayUrl ? (
            <img
              src={displayUrl}
              alt={previewUrl ? 'Avatar preview' : 'Avatar'}
              className="w-full h-full object-cover"
            />
          ) : (
            initials
          )}
        </div>

        {/* Camera Icon Overlay */}
        {!previewUrl && !disabled && (
          <button
            type="button"
            onClick={handleButtonClick}
            className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 shadow-md hover:bg-gray-100 transition-colors"
            aria-label="Change avatar"
          >
            <svg
              className="w-4 h-4 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        data-testid="avatar-file-input"
        disabled={disabled}
      />

      {/* Action Buttons */}
      {previewUrl && selectedFile && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={isUploading}
            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isUploading ? 'Uploading...' : 'Save'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isUploading}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Change Avatar Button (when no preview) */}
      {!previewUrl && (
        <button
          type="button"
          onClick={handleButtonClick}
          disabled={disabled}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          Change avatar
        </button>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {/* Success Message */}
      {successMessage && (
        <p className="text-sm text-green-600" role="status">
          {successMessage}
        </p>
      )}
    </div>
  )
}
