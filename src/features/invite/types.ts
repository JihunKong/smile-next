/**
 * Invite Feature Types
 *
 * Type definitions for group invite functionality.
 */

/**
 * Group information displayed on invite page
 */
export interface GroupInfo {
  id: string
  name: string
  description: string | null
  memberCount: number
  activityCount: number
  creator: {
    firstName: string | null
    lastName: string | null
  }
}

/**
 * Invite validation result
 */
export interface InviteInfo {
  valid: boolean
  group: GroupInfo | null
  alreadyMember?: boolean
  error?: string
}

/**
 * Registration form data
 */
export interface RegistrationFormData {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
  acceptTerms: boolean
}

/**
 * Form message for feedback
 */
export interface FormMessage {
  type: 'success' | 'error'
  text: string
}

/**
 * Invite hook return type
 */
export interface UseInviteReturn {
  // State
  inviteInfo: InviteInfo | null
  isLoading: boolean
  error: string | null
  isSubmitting: boolean

  // Actions
  joinGroup: () => Promise<void>
  register: (data: RegistrationFormData) => Promise<void>
}
