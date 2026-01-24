'use client'

import { useState, useCallback } from 'react'
import type { GroupFormData } from '../types'

interface UseGroupFormOptions {
    mode: 'create' | 'edit'
    groupId?: string
    initialData?: Partial<GroupFormData>
    onSuccess?: (groupId: string) => void
}

const defaultFormData: GroupFormData = {
    name: '',
    description: '',
    isPrivate: false,
    requirePasscode: false,
    passcode: '',
    groupImageUrl: null,
    autoIconGradient: '0',
}

export function useGroupForm({
    mode,
    groupId,
    initialData,
    onSuccess,
}: UseGroupFormOptions) {
    const [formData, setFormData] = useState<GroupFormData>({
        ...defaultFormData,
        ...initialData,
    })
    const [errors, setErrors] = useState<Partial<Record<keyof GroupFormData, string>>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)

    const updateField = useCallback(<K extends keyof GroupFormData>(
        field: K,
        value: GroupFormData[K]
    ) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        // Clear field error on change
        setErrors(prev => {
            if (prev[field]) {
                const { [field]: _, ...rest } = prev
                return rest
            }
            return prev
        })
    }, [])

    const validate = useCallback((): boolean => {
        const newErrors: Partial<Record<keyof GroupFormData, string>> = {}

        if (!formData.name.trim()) {
            newErrors.name = 'Group name is required'
        } else if (formData.name.length > 100) {
            newErrors.name = 'Name must be 100 characters or less'
        }

        if (formData.description && formData.description.length > 500) {
            newErrors.description = 'Description must be 500 characters or less'
        }

        if (formData.isPrivate && formData.requirePasscode && !formData.passcode) {
            newErrors.passcode = 'Passcode is required when enabled'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }, [formData])

    const submit = useCallback(async (): Promise<boolean> => {
        if (!validate()) return false

        setIsSubmitting(true)
        setSubmitError(null)

        try {
            const url = mode === 'create'
                ? '/api/groups'
                : `/api/groups/${groupId}`

            const response = await fetch(url, {
                method: mode === 'create' ? 'POST' : 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to save group')
            }

            const data = await response.json()
            onSuccess?.(data.id || groupId!)
            return true
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : 'Unknown error')
            return false
        } finally {
            setIsSubmitting(false)
        }
    }, [formData, mode, groupId, validate, onSuccess])

    return {
        formData,
        errors,
        isSubmitting,
        submitError,
        updateField,
        setFormData,
        validate,
        submit,
    }
}
