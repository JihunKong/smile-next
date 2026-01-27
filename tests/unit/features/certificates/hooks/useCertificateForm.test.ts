/**
 * useCertificateForm Hook Tests
 *
 * TDD tests for the useCertificateForm hook that manages certificate
 * form state, activity selection, ordering, and validation.
 */

import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  useCertificateForm,
  type UseCertificateFormOptions,
} from '@/features/certificates/hooks/useCertificateForm'
import type { CertificateFormData, SelectedActivity } from '@/features/certificates/types'

// Sample test data
const mockActivity1: SelectedActivity = {
  activityId: 'act-1',
  name: 'Introduction to Web Development',
  activityType: 'lesson',
  sequenceOrder: 1,
  required: true,
}

const mockActivity2: SelectedActivity = {
  activityId: 'act-2',
  name: 'HTML Basics Quiz',
  activityType: 'quiz',
  sequenceOrder: 2,
  required: true,
}

const mockActivity3: SelectedActivity = {
  activityId: 'act-3',
  name: 'CSS Project',
  activityType: 'project',
  sequenceOrder: 3,
  required: false,
}

const initialFormData: CertificateFormData = {
  name: 'Web Development Certificate',
  organizationName: 'Tech Academy',
  programName: 'Full Stack Program',
  signatoryName: 'John Doe',
  certificateStatement: 'This certifies that the student has completed...',
  studentInstructions: 'Complete all required activities to earn this certificate.',
  activities: [mockActivity1, mockActivity2],
}

describe('useCertificateForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ===========================================================================
  // Initial State Tests
  // ===========================================================================

  describe('Initial State', () => {
    it('returns empty form data when no initial values provided', () => {
      const { result } = renderHook(() => useCertificateForm())

      expect(result.current.formData).toEqual({
        name: '',
        organizationName: '',
        programName: '',
        signatoryName: '',
        certificateStatement: '',
        studentInstructions: '',
        activities: [],
      })
    })

    it('returns provided initial values', () => {
      const { result } = renderHook(() =>
        useCertificateForm({ initialData: initialFormData })
      )

      expect(result.current.formData).toEqual(initialFormData)
    })

    it('returns empty errors initially', () => {
      const { result } = renderHook(() => useCertificateForm())

      expect(result.current.errors).toEqual({})
    })

    it('returns isDirty=false initially', () => {
      const { result } = renderHook(() => useCertificateForm())

      expect(result.current.isDirty).toBe(false)
    })

    it('returns isValid=false when form is empty', () => {
      const { result } = renderHook(() => useCertificateForm())

      expect(result.current.isValid).toBe(false)
    })

    it('returns isValid=true when required fields are filled', () => {
      const { result } = renderHook(() =>
        useCertificateForm({ initialData: initialFormData })
      )

      expect(result.current.isValid).toBe(true)
    })
  })

  // ===========================================================================
  // Field Update Tests
  // ===========================================================================

  describe('Field Updates', () => {
    it('updates name field', () => {
      const { result } = renderHook(() => useCertificateForm())

      act(() => {
        result.current.setField('name', 'New Certificate Name')
      })

      expect(result.current.formData.name).toBe('New Certificate Name')
    })

    it('updates organizationName field', () => {
      const { result } = renderHook(() => useCertificateForm())

      act(() => {
        result.current.setField('organizationName', 'New Org')
      })

      expect(result.current.formData.organizationName).toBe('New Org')
    })

    it('updates programName field', () => {
      const { result } = renderHook(() => useCertificateForm())

      act(() => {
        result.current.setField('programName', 'New Program')
      })

      expect(result.current.formData.programName).toBe('New Program')
    })

    it('updates signatoryName field', () => {
      const { result } = renderHook(() => useCertificateForm())

      act(() => {
        result.current.setField('signatoryName', 'Jane Smith')
      })

      expect(result.current.formData.signatoryName).toBe('Jane Smith')
    })

    it('updates certificateStatement field', () => {
      const { result } = renderHook(() => useCertificateForm())

      act(() => {
        result.current.setField('certificateStatement', 'New statement')
      })

      expect(result.current.formData.certificateStatement).toBe('New statement')
    })

    it('updates studentInstructions field', () => {
      const { result } = renderHook(() => useCertificateForm())

      act(() => {
        result.current.setField('studentInstructions', 'New instructions')
      })

      expect(result.current.formData.studentInstructions).toBe('New instructions')
    })

    it('marks form as dirty after update', () => {
      const { result } = renderHook(() => useCertificateForm())

      expect(result.current.isDirty).toBe(false)

      act(() => {
        result.current.setField('name', 'Test')
      })

      expect(result.current.isDirty).toBe(true)
    })

    it('clears field-specific error when field is updated', () => {
      const { result } = renderHook(() => useCertificateForm())

      // Trigger validation to create errors
      act(() => {
        result.current.validate()
      })

      expect(result.current.errors.name).toBeDefined()

      // Update the field
      act(() => {
        result.current.setField('name', 'Valid Name')
      })

      expect(result.current.errors.name).toBeUndefined()
    })
  })

  // ===========================================================================
  // Activity Management Tests
  // ===========================================================================

  describe('Activity Management', () => {
    describe('addActivity', () => {
      it('adds an activity to the list', () => {
        const { result } = renderHook(() => useCertificateForm())

        act(() => {
          result.current.addActivity({
            activityId: 'act-1',
            name: 'New Activity',
            activityType: 'lesson',
          })
        })

        expect(result.current.formData.activities).toHaveLength(1)
        expect(result.current.formData.activities[0]).toMatchObject({
          activityId: 'act-1',
          name: 'New Activity',
          activityType: 'lesson',
          sequenceOrder: 1,
          required: true, // default
        })
      })

      it('assigns correct sequence order to new activities', () => {
        const { result } = renderHook(() => useCertificateForm())

        act(() => {
          result.current.addActivity({
            activityId: 'act-1',
            name: 'First',
            activityType: 'lesson',
          })
        })

        act(() => {
          result.current.addActivity({
            activityId: 'act-2',
            name: 'Second',
            activityType: 'quiz',
          })
        })

        expect(result.current.formData.activities[0].sequenceOrder).toBe(1)
        expect(result.current.formData.activities[1].sequenceOrder).toBe(2)
      })

      it('does not add duplicate activity', () => {
        const { result } = renderHook(() =>
          useCertificateForm({ initialData: { ...initialFormData, activities: [mockActivity1] } })
        )

        act(() => {
          result.current.addActivity({
            activityId: 'act-1', // Same as mockActivity1
            name: 'Duplicate',
            activityType: 'lesson',
          })
        })

        expect(result.current.formData.activities).toHaveLength(1)
      })

      it('allows adding activity with custom required value', () => {
        const { result } = renderHook(() => useCertificateForm())

        act(() => {
          result.current.addActivity({
            activityId: 'act-1',
            name: 'Optional Activity',
            activityType: 'project',
            required: false,
          })
        })

        expect(result.current.formData.activities[0].required).toBe(false)
      })
    })

    describe('removeActivity', () => {
      it('removes an activity from the list', () => {
        const { result } = renderHook(() =>
          useCertificateForm({ initialData: initialFormData })
        )

        const initialLength = result.current.formData.activities.length

        act(() => {
          result.current.removeActivity('act-1')
        })

        expect(result.current.formData.activities).toHaveLength(initialLength - 1)
        expect(
          result.current.formData.activities.find((a) => a.activityId === 'act-1')
        ).toBeUndefined()
      })

      it('reorders remaining activities after removal', () => {
        const { result } = renderHook(() =>
          useCertificateForm({
            initialData: {
              ...initialFormData,
              activities: [mockActivity1, mockActivity2, mockActivity3],
            },
          })
        )

        act(() => {
          result.current.removeActivity('act-2') // Remove middle one
        })

        expect(result.current.formData.activities).toHaveLength(2)
        expect(result.current.formData.activities[0].sequenceOrder).toBe(1)
        expect(result.current.formData.activities[1].sequenceOrder).toBe(2)
      })

      it('does nothing if activity not found', () => {
        const { result } = renderHook(() =>
          useCertificateForm({ initialData: initialFormData })
        )

        const initialActivities = [...result.current.formData.activities]

        act(() => {
          result.current.removeActivity('non-existent')
        })

        expect(result.current.formData.activities).toEqual(initialActivities)
      })
    })

    describe('reorderActivities', () => {
      it('moves activity from one position to another', () => {
        const { result } = renderHook(() =>
          useCertificateForm({
            initialData: {
              ...initialFormData,
              activities: [mockActivity1, mockActivity2, mockActivity3],
            },
          })
        )

        act(() => {
          result.current.reorderActivities(0, 2) // Move first to last
        })

        const activities = result.current.formData.activities
        expect(activities[0].activityId).toBe('act-2')
        expect(activities[1].activityId).toBe('act-3')
        expect(activities[2].activityId).toBe('act-1')
      })

      it('updates sequence orders after reorder', () => {
        const { result } = renderHook(() =>
          useCertificateForm({
            initialData: {
              ...initialFormData,
              activities: [mockActivity1, mockActivity2, mockActivity3],
            },
          })
        )

        act(() => {
          result.current.reorderActivities(2, 0) // Move last to first
        })

        const activities = result.current.formData.activities
        expect(activities[0].sequenceOrder).toBe(1)
        expect(activities[1].sequenceOrder).toBe(2)
        expect(activities[2].sequenceOrder).toBe(3)
      })

      it('handles invalid indices gracefully', () => {
        const { result } = renderHook(() =>
          useCertificateForm({
            initialData: {
              ...initialFormData,
              activities: [mockActivity1, mockActivity2],
            },
          })
        )

        const initialActivities = [...result.current.formData.activities]

        act(() => {
          result.current.reorderActivities(-1, 5) // Invalid indices
        })

        expect(result.current.formData.activities).toEqual(initialActivities)
      })
    })

    describe('updateActivityRequired', () => {
      it('updates required status of an activity', () => {
        const { result } = renderHook(() =>
          useCertificateForm({ initialData: initialFormData })
        )

        expect(result.current.formData.activities[0].required).toBe(true)

        act(() => {
          result.current.updateActivityRequired('act-1', false)
        })

        expect(result.current.formData.activities[0].required).toBe(false)
      })

      it('does nothing if activity not found', () => {
        const { result } = renderHook(() =>
          useCertificateForm({ initialData: initialFormData })
        )

        const initialActivities = JSON.stringify(result.current.formData.activities)

        act(() => {
          result.current.updateActivityRequired('non-existent', false)
        })

        expect(JSON.stringify(result.current.formData.activities)).toBe(initialActivities)
      })
    })
  })

  // ===========================================================================
  // Validation Tests
  // ===========================================================================

  describe('Validation', () => {
    it('returns error for empty name', () => {
      const { result } = renderHook(() => useCertificateForm())

      act(() => {
        result.current.validate()
      })

      expect(result.current.errors.name).toBe('Certificate name is required')
    })

    it('returns error for empty organizationName', () => {
      const { result } = renderHook(() =>
        useCertificateForm({
          initialData: { ...initialFormData, organizationName: '' },
        })
      )

      act(() => {
        result.current.validate()
      })

      expect(result.current.errors.organizationName).toBe('Organization name is required')
    })

    it('returns error when no activities selected', () => {
      const { result } = renderHook(() =>
        useCertificateForm({
          initialData: { ...initialFormData, activities: [] },
        })
      )

      act(() => {
        result.current.validate()
      })

      expect(result.current.errors.activities).toBe('At least one activity is required')
    })

    it('returns no errors for valid form', () => {
      const { result } = renderHook(() =>
        useCertificateForm({ initialData: initialFormData })
      )

      act(() => {
        result.current.validate()
      })

      expect(result.current.errors).toEqual({})
    })

    it('validate returns true for valid form', () => {
      const { result } = renderHook(() =>
        useCertificateForm({ initialData: initialFormData })
      )

      let isValid: boolean = false
      act(() => {
        isValid = result.current.validate()
      })

      expect(isValid).toBe(true)
    })

    it('validate returns false for invalid form', () => {
      const { result } = renderHook(() => useCertificateForm())

      let isValid: boolean = true
      act(() => {
        isValid = result.current.validate()
      })

      expect(isValid).toBe(false)
    })

    it('updates isValid after validation', () => {
      const { result } = renderHook(() => useCertificateForm())

      expect(result.current.isValid).toBe(false)

      act(() => {
        result.current.setField('name', 'Test Certificate')
        result.current.setField('organizationName', 'Test Org')
        result.current.addActivity({
          activityId: 'act-1',
          name: 'Test Activity',
          activityType: 'lesson',
        })
      })

      expect(result.current.isValid).toBe(true)
    })
  })

  // ===========================================================================
  // Form Reset Tests
  // ===========================================================================

  describe('Reset', () => {
    it('resets form to initial empty state', () => {
      const { result } = renderHook(() => useCertificateForm())

      act(() => {
        result.current.setField('name', 'Modified Name')
        result.current.addActivity({
          activityId: 'act-1',
          name: 'Activity',
          activityType: 'lesson',
        })
      })

      expect(result.current.formData.name).toBe('Modified Name')
      expect(result.current.formData.activities).toHaveLength(1)

      act(() => {
        result.current.reset()
      })

      expect(result.current.formData.name).toBe('')
      expect(result.current.formData.activities).toHaveLength(0)
    })

    it('resets form to provided initial data', () => {
      const { result } = renderHook(() =>
        useCertificateForm({ initialData: initialFormData })
      )

      act(() => {
        result.current.setField('name', 'Modified Name')
        result.current.removeActivity('act-1')
      })

      expect(result.current.formData.name).toBe('Modified Name')

      act(() => {
        result.current.reset()
      })

      expect(result.current.formData.name).toBe(initialFormData.name)
      expect(result.current.formData.activities).toHaveLength(initialFormData.activities.length)
    })

    it('clears errors on reset', () => {
      const { result } = renderHook(() => useCertificateForm())

      act(() => {
        result.current.validate() // Create errors
      })

      expect(Object.keys(result.current.errors).length).toBeGreaterThan(0)

      act(() => {
        result.current.reset()
      })

      expect(result.current.errors).toEqual({})
    })

    it('resets isDirty to false', () => {
      const { result } = renderHook(() => useCertificateForm())

      act(() => {
        result.current.setField('name', 'Modified')
      })

      expect(result.current.isDirty).toBe(true)

      act(() => {
        result.current.reset()
      })

      expect(result.current.isDirty).toBe(false)
    })
  })

  // ===========================================================================
  // Helper Function Tests
  // ===========================================================================

  describe('Helper Functions', () => {
    describe('getActivityCount', () => {
      it('returns total activity count', () => {
        const { result } = renderHook(() =>
          useCertificateForm({ initialData: initialFormData })
        )

        expect(result.current.getActivityCount()).toBe(2)
      })

      it('returns 0 for empty activities', () => {
        const { result } = renderHook(() => useCertificateForm())

        expect(result.current.getActivityCount()).toBe(0)
      })
    })

    describe('getRequiredActivityCount', () => {
      it('returns count of required activities', () => {
        const { result } = renderHook(() =>
          useCertificateForm({
            initialData: {
              ...initialFormData,
              activities: [mockActivity1, mockActivity2, mockActivity3],
            },
          })
        )

        // mockActivity1 and mockActivity2 are required, mockActivity3 is not
        expect(result.current.getRequiredActivityCount()).toBe(2)
      })
    })

    describe('hasActivity', () => {
      it('returns true if activity exists', () => {
        const { result } = renderHook(() =>
          useCertificateForm({ initialData: initialFormData })
        )

        expect(result.current.hasActivity('act-1')).toBe(true)
      })

      it('returns false if activity does not exist', () => {
        const { result } = renderHook(() =>
          useCertificateForm({ initialData: initialFormData })
        )

        expect(result.current.hasActivity('non-existent')).toBe(false)
      })
    })
  })

  // ===========================================================================
  // onChange Callback Tests
  // ===========================================================================

  describe('onChange Callback', () => {
    it('calls onChange when form data changes', () => {
      const onChange = vi.fn()

      const { result } = renderHook(() =>
        useCertificateForm({ onChange })
      )

      act(() => {
        result.current.setField('name', 'New Name')
      })

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'New Name' })
      )
    })

    it('calls onChange when activity is added', () => {
      const onChange = vi.fn()

      const { result } = renderHook(() =>
        useCertificateForm({ onChange })
      )

      act(() => {
        result.current.addActivity({
          activityId: 'act-1',
          name: 'New Activity',
          activityType: 'lesson',
        })
      })

      expect(onChange).toHaveBeenCalled()
      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0]
      expect(lastCall.activities).toHaveLength(1)
    })

    it('does not call onChange on reset', () => {
      const onChange = vi.fn()

      const { result } = renderHook(() =>
        useCertificateForm({ onChange, initialData: initialFormData })
      )

      act(() => {
        result.current.setField('name', 'Modified')
      })

      onChange.mockClear()

      act(() => {
        result.current.reset()
      })

      expect(onChange).not.toHaveBeenCalled()
    })
  })
})
