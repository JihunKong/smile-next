'use client'

import { useState, useRef } from 'react'
import { LoadingSpinner } from '@/components/ui'

interface GroupImageUploadProps {
    groupId: string
    currentImage: string | null
    gradientFallback: React.ReactNode
    onImageChange: (url: string | null) => void
}

export function GroupImageUpload({
    groupId,
    currentImage,
    gradientFallback,
    onImageChange,
}: GroupImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if (!allowedTypes.includes(file.type)) {
            setError('Invalid file type. Please upload JPEG, PNG, GIF, or WebP.')
            return
        }

        // Validate file size (8MB max)
        if (file.size > 8 * 1024 * 1024) {
            setError('File too large. Maximum size is 8MB.')
            return
        }

        // Show preview
        const reader = new FileReader()
        reader.onload = (event) => {
            setPreview(event.target?.result as string)
        }
        reader.readAsDataURL(file)

        // Upload
        setIsUploading(true)
        setError(null)

        try {
            const formData = new FormData()
            formData.append('file', file)

            const res = await fetch(`/api/groups/${groupId}/image`, {
                method: 'POST',
                body: formData,
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to upload image')
            }

            const data = await res.json()
            onImageChange(data.imageUrl)
            setPreview(null)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to upload image')
            setPreview(null)
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    async function handleDelete() {
        if (!currentImage) return

        setIsUploading(true)
        setError(null)

        try {
            const res = await fetch(`/api/groups/${groupId}/image`, {
                method: 'DELETE',
            })

            if (!res.ok) {
                throw new Error('Failed to delete image')
            }

            onImageChange(null)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete image')
        } finally {
            setIsUploading(false)
        }
    }

    const displayImage = preview || currentImage

    return (
        <div className="space-y-4">
            {/* Preview */}
            <div
                className="w-32 h-32 rounded-xl overflow-hidden flex items-center justify-center text-white text-3xl font-bold"
                style={{
                    background: displayImage
                        ? `url(${displayImage}) center/cover`
                        : undefined,
                }}
            >
                {!displayImage && gradientFallback}
            </div>

            {/* Controls */}
            <div className="flex flex-wrap gap-3">
                <label className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition cursor-pointer flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {isUploading ? 'Uploading...' : 'Upload Image'}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={handleFileSelect}
                        disabled={isUploading}
                        className="hidden"
                    />
                </label>

                {currentImage && (
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isUploading}
                        className="px-4 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-lg transition flex items-center gap-2 disabled:opacity-50"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Remove
                    </button>
                )}
            </div>

            {/* Error */}
            {error && (
                <p className="text-sm text-red-600">{error}</p>
            )}

            {/* Format info */}
            <p className="text-xs text-gray-500">
                Supported formats: JPEG, PNG, GIF, WebP. Maximum size: 8MB.
            </p>

            {/* Loading indicator */}
            {isUploading && (
                <div className="flex items-center gap-2 text-sm text-indigo-600">
                    <LoadingSpinner size="sm" />
                    Processing image...
                </div>
            )}
        </div>
    )
}
