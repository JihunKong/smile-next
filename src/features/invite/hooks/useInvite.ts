'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import type { InviteInfo, RegistrationFormData, UseInviteReturn } from '../types'

/**
 * Hook for managing invite state and actions
 *
 * Handles invite validation, group joining, and registration.
 */
export function useInvite(inviteCode: string): UseInviteReturn {
  const router = useRouter()
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch invite info on mount
  useEffect(() => {
    async function fetchInviteInfo() {
      try {
        setIsLoading(true)
        const res = await fetch(`/api/invites/${inviteCode}`)
        const data = await res.json()

        if (!res.ok) {
          setError(data.error || 'Invalid invite code')
          setInviteInfo({ valid: false, group: null, error: data.error })
        } else {
          setInviteInfo(data)
        }
      } catch {
        setError('Failed to validate invite code')
        setInviteInfo({ valid: false, group: null })
      } finally {
        setIsLoading(false)
      }
    }

    fetchInviteInfo()
  }, [inviteCode])

  // Join group (for logged-in users)
  const joinGroup = useCallback(async () => {
    if (!inviteInfo?.group) return

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`/api/invites/${inviteCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to join group')
      }

      router.push(`/groups/${inviteInfo.group.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join group')
      setIsSubmitting(false)
    }
  }, [inviteCode, inviteInfo?.group, router])

  // Register and join (for new users)
  const register = useCallback(
    async (data: RegistrationFormData) => {
      if (!inviteInfo?.group) return

      setIsSubmitting(true)
      setError(null)

      try {
        const res = await fetch(`/api/invites/${inviteCode}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            password: data.password,
          }),
        })

        const result = await res.json()

        if (!res.ok) {
          throw new Error(result.error || 'Registration failed')
        }

        // Auto sign in after registration
        const signInResult = await signIn('credentials', {
          email: data.email,
          password: data.password,
          redirect: false,
        })

        if (signInResult?.error) {
          // Registration succeeded but sign-in failed, redirect to login
          router.push(`/auth/login?callbackUrl=/groups/${inviteInfo.group.id}`)
        } else {
          // Sign-in succeeded, redirect to group
          router.push(`/groups/${inviteInfo.group.id}`)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Registration failed')
        setIsSubmitting(false)
      }
    },
    [inviteCode, inviteInfo?.group, router]
  )

  return {
    inviteInfo,
    isLoading,
    error,
    isSubmitting,
    joinGroup,
    register,
  }
}
