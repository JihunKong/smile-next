'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createGroup } from '../actions'
import { LoadingSpinner } from '@/components/ui'

export default function CreateGroupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isPrivate, setIsPrivate] = useState(true)
  const [requirePasscode, setRequirePasscode] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (max 8MB)
      if (file.size > 8 * 1024 * 1024) {
        setError('Image must be less than 8MB')
        return
      }
      // Validate file type
      if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
        setError('Image must be JPEG, PNG, GIF, or WebP')
        return
      }
      setSelectedImage(file)
      setImagePreview(URL.createObjectURL(file))
      setError('')
    }
  }

  function handleRemoveImage() {
    setSelectedImage(null)
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
    }
    setImagePreview(null)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    formData.set('isPrivate', isPrivate.toString())
    formData.set('requirePasscode', requirePasscode.toString())

    const result = await createGroup(formData)

    if (result.success && result.data?.groupId) {
      // Upload image if selected
      if (selectedImage) {
        const imageFormData = new FormData()
        imageFormData.append('file', selectedImage)

        try {
          await fetch(`/api/groups/${result.data.groupId}/image`, {
            method: 'POST',
            body: imageFormData,
          })
        } catch {
          // Image upload failed, but group was created - continue
          console.error('Failed to upload group image')
        }
      }
      router.push(`/groups/${result.data.groupId}`)
    } else {
      setError(result.error || 'Failed to create group')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/groups" className="inline-flex items-center gap-1 text-white/80 hover:text-white mb-4">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Groups
          </Link>
          <h1 className="text-2xl font-bold">Create a New Group</h1>
          <p className="text-white/80 mt-1">Set up a learning group for your students</p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Group Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Group Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              maxLength={100}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--stanford-cardinal)] focus:border-transparent outline-none transition"
              placeholder="e.g., Science Class 101"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              maxLength={500}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--stanford-cardinal)] focus:border-transparent outline-none transition resize-none"
              placeholder="Describe what this group is about..."
            />
            <p className="text-xs text-gray-500 mt-1">Optional. Maximum 500 characters.</p>
          </div>

          {/* Contact Information */}
          <div>
            <label htmlFor="contacts" className="block text-sm font-medium text-gray-700 mb-1">
              Contact Information
            </label>
            <input
              id="contacts"
              name="contacts"
              type="text"
              maxLength={200}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--stanford-cardinal)] focus:border-transparent outline-none transition"
              placeholder="Email or phone for group inquiries"
            />
            <p className="text-xs text-gray-500 mt-1">Optional. How members can contact you about this group.</p>
          </div>

          {/* Group Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group Image
            </label>
            <div className="flex items-start gap-4">
              {imagePreview ? (
                <div className="relative">
                  <Image
                    src={imagePreview}
                    alt="Group preview"
                    width={128}
                    height={128}
                    className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <label className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs text-gray-500 mt-1">Upload</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
              <div className="text-sm text-gray-500">
                <p>Optional. Upload a group cover image.</p>
                <p className="mt-1">Supported formats: JPEG, PNG, GIF, WebP</p>
                <p>Maximum size: 8MB</p>
              </div>
            </div>
          </div>

          {/* Privacy Setting */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">Group Privacy</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Choose who can find and join your group
                </p>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="privacyOption"
                    checked={!isPrivate}
                    onChange={() => setIsPrivate(false)}
                    className="w-4 h-4 text-[var(--stanford-cardinal)] focus:ring-[var(--stanford-cardinal)]"
                  />
                  <span className="text-sm font-medium text-gray-700">Public</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="privacyOption"
                    checked={isPrivate}
                    onChange={() => setIsPrivate(true)}
                    className="w-4 h-4 text-[var(--stanford-cardinal)] focus:ring-[var(--stanford-cardinal)]"
                  />
                  <span className="text-sm font-medium text-gray-700">Private</span>
                </label>
              </div>
            </div>

            {/* Privacy Info Box */}
            <div className={`mt-4 p-3 rounded-lg ${isPrivate ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}`}>
              {isPrivate ? (
                <div className="flex items-start gap-2 text-yellow-800">
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <div className="text-sm">
                    <p className="font-medium">Private Group</p>
                    <p className="mt-0.5">Only users with an invite code can join. The group won&apos;t appear in search results.</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2 text-green-800">
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm">
                    <p className="font-medium">Public Group</p>
                    <p className="mt-0.5">Anyone can find and join this group. It will appear in the public groups list.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Passcode Option */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Passcode Protection</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Require a passcode to join this group
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={requirePasscode}
                  onChange={(e) => setRequirePasscode(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--stanford-cardinal)]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--stanford-cardinal)]"></div>
              </label>
            </div>

            {requirePasscode && (
              <div className="mt-4">
                <label htmlFor="passcode" className="block text-sm font-medium text-gray-700 mb-1">
                  Passcode
                </label>
                <input
                  id="passcode"
                  name="passcode"
                  type="text"
                  minLength={4}
                  maxLength={20}
                  required={requirePasscode}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--stanford-cardinal)] focus:border-transparent outline-none transition"
                  placeholder="Enter a passcode (4-20 characters)"
                />
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
            <Link
              href="/groups"
              className="px-6 py-2.5 text-gray-700 font-medium hover:text-gray-900 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 bg-[var(--stanford-cardinal)] text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  Creating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Group
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
