'use client'

import { useRouter } from 'next/navigation'
import { useGroupForm } from '../hooks/useGroupForm'
import { getGradientColors, getGroupInitials } from '@/lib/groups/utils'
import type { GroupFormData } from '../types'

interface GroupFormProps {
    mode: 'create' | 'edit'
    groupId?: string
    initialData?: Partial<GroupFormData>
    onCancel?: () => void
}

export function GroupForm({ mode, groupId, initialData, onCancel }: GroupFormProps) {
    const router = useRouter()

    const {
        formData,
        errors,
        isSubmitting,
        submitError,
        updateField,
        submit,
    } = useGroupForm({
        mode,
        groupId,
        initialData,
        onSuccess: (id) => router.push(`/groups/${id}`),
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await submit()
    }

    const gradientIndex = parseInt(formData.autoIconGradient || '0')
    const gradient = getGradientColors(gradientIndex)
    const initials = getGroupInitials(formData.name || 'New Group')

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Group Icon Preview & Gradient Picker */}
            <div className="flex items-center gap-6">
                <div
                    className="w-24 h-24 rounded-xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
                    style={{
                        background: formData.groupImageUrl
                            ? `url(${formData.groupImageUrl}) center/cover`
                            : `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)`,
                    }}
                >
                    {!formData.groupImageUrl && initials}
                </div>

                {/* Gradient Picker */}
                <div className="flex gap-2 flex-wrap">
                    {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
                        const g = getGradientColors(i)
                        return (
                            <button
                                key={i}
                                type="button"
                                onClick={() => updateField('autoIconGradient', String(i))}
                                className={`w-8 h-8 rounded-full transition ${gradientIndex === i ? 'ring-2 ring-offset-2 ring-gray-400' : 'hover:scale-110'}`}
                                style={{ background: `linear-gradient(135deg, ${g.from}, ${g.to})` }}
                            />
                        )
                    })}
                </div>
            </div>

            {/* Name */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Group Name <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    maxLength={100}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Enter group name"
                />
                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
            </div>

            {/* Description */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                </label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    rows={3}
                    maxLength={500}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition resize-none"
                    placeholder="Describe what this group is about..."
                />
                <p className="text-xs text-gray-500 mt-1">{formData.description.length}/500 characters</p>
            </div>

            {/* Privacy Toggle */}
            <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="font-medium text-gray-900">Group Privacy</h3>
                        <p className="text-sm text-gray-500 mt-1">Control who can find and join</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="isPrivate"
                                checked={!formData.isPrivate}
                                onChange={() => updateField('isPrivate', false)}
                                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm font-medium text-gray-700">Public</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="isPrivate"
                                checked={formData.isPrivate}
                                onChange={() => updateField('isPrivate', true)}
                                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm font-medium text-gray-700">Private</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Passcode Setting */}
            <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-medium text-gray-900">Passcode Protection</h3>
                        <p className="text-sm text-gray-500 mt-1">Require a passcode to join</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.requirePasscode}
                            onChange={(e) => updateField('requirePasscode', e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                </div>

                {formData.requirePasscode && (
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Passcode
                        </label>
                        <input
                            type="text"
                            name="passcode"
                            value={formData.passcode}
                            onChange={(e) => updateField('passcode', e.target.value)}
                            minLength={4}
                            maxLength={20}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition ${errors.passcode ? 'border-red-500' : 'border-gray-300'}`}
                            placeholder="Enter passcode (4-20 characters)"
                        />
                        {errors.passcode && <p className="text-sm text-red-500 mt-1">{errors.passcode}</p>}
                    </div>
                )}
            </div>

            {/* Submit Error */}
            {submitError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {submitError}
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition flex items-center gap-2"
                >
                    {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Group' : 'Save Changes'}
                </button>

                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition"
                    >
                        Cancel
                    </button>
                )}
            </div>
        </form>
    )
}
