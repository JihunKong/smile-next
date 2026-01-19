'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { GroupRoles, type GroupRole } from '@/types/groups'
import { getRoleLabel, getGradientColors, getGroupInitials, canManageGroup } from '@/lib/groups/utils'
import { LoadingSpinner, LoadingState } from '@/components/ui'

interface GroupData {
  id: string
  name: string
  description: string | null
  isPrivate: boolean
  requirePasscode: boolean
  passcode: string | null
  inviteCode: string | null
  autoIconGradient: string | null
  groupImageUrl: string | null
  createdAt: string
  creator: {
    id: string
    firstName: string | null
    lastName: string | null
  }
}

interface MembershipData {
  role: number
}

export default function GroupEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = use(params)
  const router = useRouter()
  const { data: session } = useSession()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [group, setGroup] = useState<GroupData | null>(null)
  const [membership, setMembership] = useState<MembershipData | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [requirePasscode, setRequirePasscode] = useState(false)
  const [passcode, setPasscode] = useState('')

  // Delete confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  // Image upload
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  useEffect(() => {
    if (session) {
      loadGroupData()
    }
  }, [session, groupId])

  async function loadGroupData() {
    try {
      setLoading(true)
      setError(null)

      // Fetch group data
      const res = await fetch(`/api/groups/${groupId}`)
      if (!res.ok) {
        if (res.status === 404) {
          router.push('/groups')
          return
        }
        throw new Error('Failed to load group')
      }
      const data = await res.json()
      setGroup(data.group)
      setMembership(data.membership)

      // Check permissions
      if (!data.membership || !canManageGroup(data.membership.role as GroupRole, 'edit')) {
        router.push(`/groups/${groupId}`)
        return
      }

      // Initialize form
      setName(data.group.name)
      setDescription(data.group.description || '')
      setIsPrivate(data.group.isPrivate)
      setRequirePasscode(data.group.requirePasscode)
      setPasscode(data.group.passcode || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load group')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || null,
          isPrivate,
          requirePasscode,
          passcode: requirePasscode ? passcode : null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update group')
      }

      setSuccess('Group settings saved successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update group')
    } finally {
      setSaving(false)
    }
  }

  async function handleRegenerateInviteCode() {
    try {
      const res = await fetch(`/api/groups/${groupId}/regenerate-invite`, {
        method: 'POST',
      })

      if (!res.ok) {
        throw new Error('Failed to regenerate invite code')
      }

      const data = await res.json()
      setGroup((prev) => (prev ? { ...prev, inviteCode: data.inviteCode } : null))
      setSuccess('Invite code regenerated!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate invite code')
    }
  }

  async function handleDeleteGroup() {
    if (deleteConfirmText !== group?.name) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('Failed to delete group')
      }

      router.push('/groups')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete group')
      setDeleting(false)
    }
  }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
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
      setImagePreview(event.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload
    setUploadingImage(true)
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
      setGroup((prev) => (prev ? { ...prev, groupImageUrl: data.imageUrl } : null))
      setImagePreview(null)
      setSuccess('Image uploaded successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image')
      setImagePreview(null)
    } finally {
      setUploadingImage(false)
      // Reset the file input
      e.target.value = ''
    }
  }

  async function handleImageDelete() {
    if (!group?.groupImageUrl) return

    setUploadingImage(true)
    setError(null)

    try {
      const res = await fetch(`/api/groups/${groupId}/image`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('Failed to delete image')
      }

      setGroup((prev) => (prev ? { ...prev, groupImageUrl: null } : null))
      setSuccess('Image removed successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete image')
    } finally {
      setUploadingImage(false)
    }
  }

  const userRole = membership?.role as GroupRole | undefined
  const canDelete = userRole === GroupRoles.OWNER

  if (loading) {
    return (
      <LoadingState fullPage message="Loading group settings..." />
    )
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Group not found</p>
          <Link href="/groups" className="text-indigo-600 hover:underline mt-2 inline-block">
            Back to Groups
          </Link>
        </div>
      </div>
    )
  }

  const gradientIndex = parseInt(group.autoIconGradient || '0') || 0
  const gradient = getGradientColors(gradientIndex)
  const initials = getGroupInitials(group.name)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section
        className="relative py-8 px-4 text-white"
        style={{
          background: group.groupImageUrl
            ? `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${group.groupImageUrl}) center/cover`
            : `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)`,
        }}
      >
        <div className="max-w-4xl mx-auto">
          <Link
            href={`/groups/${groupId}`}
            className="inline-flex items-center gap-1 text-white/80 hover:text-white mb-4"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Group
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center text-2xl font-bold">
              {initials}
            </div>
            <div>
              <h1 className="text-2xl font-bold">Edit Group Settings</h1>
              <p className="text-white/80">{group.name}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Success/Error Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {success}
          </div>
        )}

        {/* Main Settings Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">General Settings</h2>

          {/* Group Name */}
          <div className="mb-6">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Group Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              placeholder="Enter group name"
            />
          </div>

          {/* Description */}
          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition resize-none"
              placeholder="Describe what this group is about..."
            />
            <p className="text-xs text-gray-500 mt-1">{description.length}/500 characters</p>
          </div>

          {/* Privacy Setting */}
          <div className="mb-6 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Group Privacy</h3>
                <p className="text-sm text-gray-500 mt-1">Control who can find and join your group</p>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={!isPrivate}
                    onChange={() => setIsPrivate(false)}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Public</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={isPrivate}
                    onChange={() => setIsPrivate(true)}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Private</span>
                </label>
              </div>
            </div>
          </div>

          {/* Passcode Setting */}
          <div className="mb-6 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Passcode Protection</h3>
                <p className="text-sm text-gray-500 mt-1">Require a passcode to join this group</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={requirePasscode}
                  onChange={(e) => setRequirePasscode(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {requirePasscode && (
              <div className="mt-4">
                <label htmlFor="passcode" className="block text-sm font-medium text-gray-700 mb-1">
                  Passcode
                </label>
                <input
                  id="passcode"
                  type="text"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  minLength={4}
                  maxLength={20}
                  required={requirePasscode}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  placeholder="Enter passcode (4-20 characters)"
                />
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition flex items-center gap-2"
              style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
            >
              {saving ? (
                <>
                  <LoadingSpinner size="sm" />
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>

        {/* Group Image Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Group Image</h2>
          <p className="text-sm text-gray-600 mb-4">
            Upload a custom image for your group. This will be displayed on the group card and header.
          </p>

          <div className="flex items-start gap-6">
            {/* Current Image Preview */}
            <div className="flex-shrink-0">
              <div
                className="w-32 h-32 rounded-xl overflow-hidden flex items-center justify-center text-white text-3xl font-bold"
                style={{
                  background: imagePreview
                    ? `url(${imagePreview}) center/cover`
                    : group.groupImageUrl
                      ? `url(${group.groupImageUrl}) center/cover`
                      : `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)`,
                }}
              >
                {!imagePreview && !group.groupImageUrl && initials}
              </div>
            </div>

            {/* Upload Controls */}
            <div className="flex-1">
              <div className="flex flex-wrap gap-3">
                <label className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition cursor-pointer flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {uploadingImage ? 'Uploading...' : 'Upload Image'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleImageSelect}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                </label>

                {group.groupImageUrl && (
                  <button
                    onClick={handleImageDelete}
                    disabled={uploadingImage}
                    className="px-4 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-lg transition flex items-center gap-2 disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Remove
                  </button>
                )}
              </div>

              <p className="text-xs text-gray-500 mt-3">
                Supported formats: JPEG, PNG, GIF, WebP. Maximum size: 8MB.
              </p>

              {uploadingImage && (
                <div className="mt-3 flex items-center gap-2 text-sm text-indigo-600">
                  <LoadingSpinner size="sm" />
                  Processing image...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Invite Code Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Invite Code</h2>
          <p className="text-sm text-gray-600 mb-4">
            Share this code with others to invite them to your group.
          </p>
          <div className="flex items-center gap-4">
            <code className="flex-1 px-4 py-3 bg-gray-100 rounded-lg font-mono text-lg text-center">
              {group.inviteCode || 'No invite code'}
            </code>
            <button
              onClick={handleRegenerateInviteCode}
              className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Regenerate
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Note: Regenerating the code will invalidate the previous code.
          </p>
        </div>

        {/* Danger Zone */}
        {canDelete && (
          <div className="bg-white rounded-lg shadow-md p-6 border-2 border-red-200">
            <h2 className="text-xl font-bold text-red-600 mb-4">Danger Zone</h2>
            <p className="text-sm text-gray-600 mb-4">
              Once you delete a group, there is no going back. Please be certain.
            </p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition flex items-center gap-2"
              style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Delete Group
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Delete Group</h3>
              <p className="text-gray-600 mt-2">
                This action cannot be undone. All activities and data associated with this group will be
                permanently deleted.
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type <strong>{group.name}</strong> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
                placeholder="Enter group name"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeleteConfirmText('')
                }}
                className="flex-1 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteGroup}
                disabled={deleteConfirmText !== group.name || deleting}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: deleteConfirmText === group.name ? '#dc2626' : undefined }}
              >
                {deleting ? 'Deleting...' : 'Delete Group'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
