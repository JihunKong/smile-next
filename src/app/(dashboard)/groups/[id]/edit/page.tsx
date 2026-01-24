'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useGroup, GroupForm, GroupImageUpload } from '@/features/groups'
import { getGradientColors, getGroupInitials, canManageGroup } from '@/lib/groups/utils'
import { GroupRoles, type GroupRole } from '@/types/groups'
import { LoadingSpinner, LoadingState } from '@/components/ui'

export default function GroupEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = use(params)
  const router = useRouter()
  const { data: session } = useSession()

  const { group, membership, loading, error: loadError, refetch } = useGroup({
    groupId,
    includeMembers: false,
    includeActivities: false,
  })

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Message state
  const [success, setSuccess] = useState<string | null>(null)

  const handleImageChange = (url: string | null) => {
    // Trigger refetch to update group data with new image
    refetch()
    setSuccess(url ? 'Image uploaded successfully!' : 'Image removed successfully!')
    setTimeout(() => setSuccess(null), 3000)
  }

  async function handleDeleteGroup() {
    if (deleteConfirmText !== group?.name) return

    setDeleting(true)
    setDeleteError(null)
    try {
      const res = await fetch(`/api/groups/${groupId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete group')
      router.push('/groups')
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete group')
      setDeleting(false)
    }
  }

  if (loading) return <LoadingState fullPage message="Loading group settings..." />

  if (loadError || !group) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">{loadError || 'Group not found'}</p>
          <Link href="/groups" className="text-indigo-600 hover:underline mt-2 inline-block">
            Back to Groups
          </Link>
        </div>
      </div>
    )
  }

  const userRole = membership?.role as GroupRole | undefined
  const canEdit = userRole !== undefined && canManageGroup(userRole, 'edit')
  const canDelete = userRole === GroupRoles.OWNER

  if (!canEdit) {
    router.push(`/groups/${groupId}`)
    return null
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
          <Link href={`/groups/${groupId}`} className="inline-flex items-center gap-1 text-white/80 hover:text-white mb-4">
            ← Back to Group
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

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Success Message */}
        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}

        {/* Group Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">General Settings</h2>
          <GroupForm
            mode="edit"
            groupId={groupId}
            initialData={{
              name: group.name,
              description: group.description || '',
              isPrivate: group.isPrivate,
              requirePasscode: group.requirePasscode || false,
              passcode: group.passcode || '',
              groupImageUrl: group.groupImageUrl,
              autoIconGradient: group.autoIconGradient || '0',
            }}
            onCancel={() => router.back()}
          />
        </div>

        {/* Image Upload */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Group Image</h2>
          <GroupImageUpload
            groupId={groupId}
            currentImage={group.groupImageUrl}
            gradientFallback={
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)` }}
              >
                {initials}
              </div>
            }
            onImageChange={handleImageChange}
          />
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
              className="px-4 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition"
            >
              Delete Group
            </button>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Group</h3>
            <p className="text-gray-600 mb-4">
              This action cannot be undone. Type <strong>{group.name}</strong> to confirm:
            </p>
            {deleteError && (
              <p className="text-red-600 text-sm mb-4">{deleteError}</p>
            )}
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4"
              placeholder="Enter group name"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmText('') }}
                className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteGroup}
                disabled={deleteConfirmText !== group.name || deleting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white font-semibold rounded-lg disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
