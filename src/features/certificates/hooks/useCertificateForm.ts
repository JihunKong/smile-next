/**
 * useCertificateForm Hook
 *
 * Manages certificate form state, activity selection, ordering, and validation.
 * Extracted for reuse in certificate create and edit pages.
 */

import { useState, useCallback, useMemo } from 'react'
import type {
  CertificateFormData,
  CertificateFormErrors,
  SelectedActivity,
} from '../types'

export interface UseCertificateFormOptions {
  /** Initial form data for editing */
  initialData?: CertificateFormData
  /** Callback when form data changes */
  onChange?: (formData: CertificateFormData) => void
}

export interface AddActivityInput {
  activityId: string
  name: string
  activityType: string
  required?: boolean
}

export interface UseCertificateFormReturn {
  /** Current form data */
  formData: CertificateFormData
  /** Validation errors */
  errors: CertificateFormErrors
  /** Whether form has been modified */
  isDirty: boolean
  /** Whether form is currently valid */
  isValid: boolean

  /** Update a single field */
  setField: <K extends keyof Omit<CertificateFormData, 'activities'>>(
    field: K,
    value: CertificateFormData[K]
  ) => void

  /** Add an activity to the list */
  addActivity: (activity: AddActivityInput) => void
  /** Remove an activity by ID */
  removeActivity: (activityId: string) => void
  /** Reorder activities (move from one index to another) */
  reorderActivities: (fromIndex: number, toIndex: number) => void
  /** Update activity required status */
  updateActivityRequired: (activityId: string, required: boolean) => void

  /** Validate the form and return validity */
  validate: () => boolean
  /** Reset form to initial state */
  reset: () => void

  /** Get total activity count */
  getActivityCount: () => number
  /** Get required activity count */
  getRequiredActivityCount: () => number
  /** Check if an activity is already added */
  hasActivity: (activityId: string) => boolean
}

const emptyFormData: CertificateFormData = {
  name: '',
  organizationName: '',
  programName: '',
  signatoryName: '',
  certificateStatement: '',
  studentInstructions: '',
  activities: [],
}

/**
 * Hook for managing certificate form state
 *
 * @example
 * ```tsx
 * function CertificateForm() {
 *   const {
 *     formData,
 *     errors,
 *     isValid,
 *     setField,
 *     addActivity,
 *     removeActivity,
 *     validate,
 *   } = useCertificateForm()
 *
 *   const handleSubmit = () => {
 *     if (validate()) {
 *       // Submit formData
 *     }
 *   }
 *
 *   return (
 *     <form>
 *       <input
 *         value={formData.name}
 *         onChange={e => setField('name', e.target.value)}
 *       />
 *       {errors.name && <span>{errors.name}</span>}
 *     </form>
 *   )
 * }
 * ```
 */
export function useCertificateForm(
  options: UseCertificateFormOptions = {}
): UseCertificateFormReturn {
  const { initialData, onChange } = options

  const getInitialData = useCallback((): CertificateFormData => {
    return initialData ? { ...initialData } : { ...emptyFormData }
  }, [initialData])

  const [formData, setFormData] = useState<CertificateFormData>(getInitialData)
  const [errors, setErrors] = useState<CertificateFormErrors>({})
  const [isDirty, setIsDirty] = useState(false)

  // Update form data and trigger onChange
  const updateFormData = useCallback(
    (updater: (prev: CertificateFormData) => CertificateFormData) => {
      setFormData((prev) => {
        const newData = updater(prev)
        setIsDirty(true)
        onChange?.(newData)
        return newData
      })
    },
    [onChange]
  )

  // Validate the form
  const validateForm = useCallback((data: CertificateFormData): CertificateFormErrors => {
    const newErrors: CertificateFormErrors = {}

    if (!data.name.trim()) {
      newErrors.name = 'Certificate name is required'
    }

    if (!data.organizationName.trim()) {
      newErrors.organizationName = 'Organization name is required'
    }

    if (data.activities.length === 0) {
      newErrors.activities = 'At least one activity is required'
    }

    return newErrors
  }, [])

  // Compute isValid based on current form data
  const isValid = useMemo(() => {
    const validationErrors = validateForm(formData)
    return Object.keys(validationErrors).length === 0
  }, [formData, validateForm])

  // Set a single field value
  const setField = useCallback(
    <K extends keyof Omit<CertificateFormData, 'activities'>>(
      field: K,
      value: CertificateFormData[K]
    ) => {
      updateFormData((prev) => ({
        ...prev,
        [field]: value,
      }))

      // Clear field-specific error
      setErrors((prev) => {
        if (prev[field as keyof CertificateFormErrors]) {
          const { [field as keyof CertificateFormErrors]: _, ...rest } = prev
          return rest
        }
        return prev
      })
    },
    [updateFormData]
  )

  // Reorder sequence numbers
  const resequenceActivities = useCallback(
    (activities: SelectedActivity[]): SelectedActivity[] => {
      return activities.map((activity, index) => ({
        ...activity,
        sequenceOrder: index + 1,
      }))
    },
    []
  )

  // Add an activity
  const addActivity = useCallback(
    (input: AddActivityInput) => {
      updateFormData((prev) => {
        // Check for duplicate
        if (prev.activities.some((a) => a.activityId === input.activityId)) {
          return prev
        }

        const newActivity: SelectedActivity = {
          activityId: input.activityId,
          name: input.name,
          activityType: input.activityType,
          sequenceOrder: prev.activities.length + 1,
          required: input.required ?? true,
        }

        return {
          ...prev,
          activities: [...prev.activities, newActivity],
        }
      })
    },
    [updateFormData]
  )

  // Remove an activity
  const removeActivity = useCallback(
    (activityId: string) => {
      updateFormData((prev) => {
        const filtered = prev.activities.filter((a) => a.activityId !== activityId)

        // No change if activity not found
        if (filtered.length === prev.activities.length) {
          return prev
        }

        return {
          ...prev,
          activities: resequenceActivities(filtered),
        }
      })
    },
    [updateFormData, resequenceActivities]
  )

  // Reorder activities
  const reorderActivities = useCallback(
    (fromIndex: number, toIndex: number) => {
      updateFormData((prev) => {
        const activities = [...prev.activities]

        // Validate indices
        if (
          fromIndex < 0 ||
          fromIndex >= activities.length ||
          toIndex < 0 ||
          toIndex >= activities.length
        ) {
          return prev
        }

        // Remove and insert
        const [moved] = activities.splice(fromIndex, 1)
        activities.splice(toIndex, 0, moved)

        return {
          ...prev,
          activities: resequenceActivities(activities),
        }
      })
    },
    [updateFormData, resequenceActivities]
  )

  // Update activity required status
  const updateActivityRequired = useCallback(
    (activityId: string, required: boolean) => {
      updateFormData((prev) => {
        const index = prev.activities.findIndex((a) => a.activityId === activityId)
        if (index === -1) {
          return prev
        }

        const activities = [...prev.activities]
        activities[index] = { ...activities[index], required }

        return {
          ...prev,
          activities,
        }
      })
    },
    [updateFormData]
  )

  // Validate and update errors
  const validate = useCallback((): boolean => {
    const validationErrors = validateForm(formData)
    setErrors(validationErrors)
    return Object.keys(validationErrors).length === 0
  }, [formData, validateForm])

  // Reset form to initial state
  const reset = useCallback(() => {
    setFormData(getInitialData())
    setErrors({})
    setIsDirty(false)
    // Note: onChange is not called on reset
  }, [getInitialData])

  // Helper functions
  const getActivityCount = useCallback(() => {
    return formData.activities.length
  }, [formData.activities])

  const getRequiredActivityCount = useCallback(() => {
    return formData.activities.filter((a) => a.required).length
  }, [formData.activities])

  const hasActivity = useCallback(
    (activityId: string) => {
      return formData.activities.some((a) => a.activityId === activityId)
    },
    [formData.activities]
  )

  return {
    formData,
    errors,
    isDirty,
    isValid,
    setField,
    addActivity,
    removeActivity,
    reorderActivities,
    updateActivityRequired,
    validate,
    reset,
    getActivityCount,
    getRequiredActivityCount,
    hasActivity,
  }
}
