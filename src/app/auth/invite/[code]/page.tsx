'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signIn } from 'next-auth/react'
import Link from 'next/link'
import { LoadingSpinner } from '@/components/ui'

interface GroupInfo {
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

interface InviteInfo {
  valid: boolean
  group: GroupInfo | null
  alreadyMember?: boolean
  error?: string
}

export default function InvitePage({ params }: { params: Promise<{ code: string }> }) {
  const { code: inviteCode } = use(params)
  const router = useRouter()
  const { data: session, status } = useSession()

  const [loading, setLoading] = useState(true)
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Registration form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [passwordMatch, setPasswordMatch] = useState<boolean | null>(null)
  const [formError, setFormError] = useState('')

  // Fetch invite info
  useEffect(() => {
    async function fetchInviteInfo() {
      try {
        setLoading(true)
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
        setLoading(false)
      }
    }

    fetchInviteInfo()
  }, [inviteCode])

  // Handle logged-in user joining
  async function handleJoinGroup() {
    if (!session || !inviteInfo?.group) return

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
  }

  // Handle form change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))

    if (name === 'confirmPassword' || name === 'password') {
      if (name === 'confirmPassword') {
        setPasswordMatch(value === formData.password && value.length > 0)
      } else {
        setPasswordMatch(
          formData.confirmPassword === value && formData.confirmPassword.length > 0
        )
      }
    }
  }

  // Validate password
  const validatePassword = (password: string) => {
    if (password.length < 8) return 'Password must be at least 8 characters'
    if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter'
    if (!/[a-z]/.test(password)) return 'Password must contain a lowercase letter'
    if (!/[0-9]/.test(password)) return 'Password must contain a number'
    return null
  }

  // Handle registration form submit
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setFormError('')

    // Validation
    const passwordError = validatePassword(formData.password)
    if (passwordError) {
      setFormError(passwordError)
      setIsSubmitting(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match')
      setIsSubmitting(false)
      return
    }

    if (!formData.acceptTerms) {
      setFormError('You must accept the terms and conditions')
      setIsSubmitting(false)
      return
    }

    try {
      const res = await fetch(`/api/invites/${inviteCode}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      // Auto sign in after registration
      const signInResult = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (signInResult?.error) {
        // Registration succeeded but sign-in failed, redirect to login
        router.push(`/auth/login?callbackUrl=/groups/${inviteInfo?.group?.id}`)
      } else {
        // Sign-in succeeded, redirect to group
        router.push(`/groups/${inviteInfo?.group?.id}`)
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Registration failed')
      setIsSubmitting(false)
    }
  }

  // Loading state
  if (status === 'loading' || loading) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-lg p-8 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto mb-4" />
          <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto mb-8" />
          <div className="space-y-4">
            <div className="h-12 bg-gray-200 rounded" />
            <div className="h-12 bg-gray-200 rounded" />
            <div className="h-12 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    )
  }

  // Invalid invite
  if (!inviteInfo?.valid || !inviteInfo.group) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invite</h1>
          <p className="text-gray-600 mb-6">
            {error || 'This invite link is invalid or has expired.'}
          </p>
          <div className="space-y-3">
            <Link
              href="/auth/signup"
              className="block w-full py-3 px-4 text-center font-semibold text-white rounded-lg transition"
              style={{ backgroundColor: 'var(--stanford-cardinal)' }}
            >
              Create an Account
            </Link>
            <Link
              href="/auth/login"
              className="block w-full py-3 px-4 text-center font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const group = inviteInfo.group

  // Already a member
  if (inviteInfo.alreadyMember && session) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Already a Member</h1>
          <p className="text-gray-600 mb-2">You are already a member of</p>
          <p className="text-lg font-semibold text-[#8C1515] mb-6">{group.name}</p>
          <Link
            href={`/groups/${group.id}`}
            className="block w-full py-3 px-4 text-center font-semibold text-white rounded-lg transition"
            style={{ backgroundColor: 'var(--stanford-cardinal)' }}
          >
            Go to Group
          </Link>
        </div>
      </div>
    )
  }

  // Logged in user - show join confirmation
  if (session) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Group Header */}
          <div className="bg-gradient-to-br from-[#8C1515] to-[#B83A4B] p-6 text-white text-center">
            <h1 className="text-2xl font-bold mb-2">Join Group</h1>
            <p className="text-white/80">You have been invited to join</p>
          </div>

          <div className="p-6">
            {/* Group Info */}
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">{group.name}</h2>
              {group.description && (
                <p className="text-gray-600 mt-2 text-sm">{group.description}</p>
              )}
            </div>

            {/* Group Stats */}
            <div className="flex justify-center gap-6 mb-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{group.memberCount} members</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>{group.activityCount} activities</span>
              </div>
            </div>

            {/* Creator */}
            <p className="text-center text-sm text-gray-500 mb-6">
              Created by {group.creator.firstName} {group.creator.lastName}
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">
                {error}
              </div>
            )}

            {/* Join Button */}
            <button
              onClick={handleJoinGroup}
              disabled={isSubmitting}
              className="w-full py-3 px-4 font-semibold text-white rounded-lg transition disabled:opacity-50"
              style={{ backgroundColor: 'var(--stanford-cardinal)' }}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" />
                  Joining...
                </span>
              ) : (
                'Join Group'
              )}
            </button>

            <p className="mt-4 text-center text-sm text-gray-500">
              Logged in as {session.user?.email}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Not logged in - show registration form
  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Group Header */}
        <div className="bg-gradient-to-br from-[#8C1515] to-[#B83A4B] p-6 text-white text-center">
          <h1 className="text-xl font-bold mb-1">You are invited to join</h1>
          <p className="text-2xl font-bold">{group.name}</p>
          {group.description && (
            <p className="text-white/80 mt-2 text-sm">{group.description}</p>
          )}
        </div>

        <div className="p-6">
          {/* Group Stats */}
          <div className="flex justify-center gap-6 mb-6 text-sm text-gray-600">
            <span>{group.memberCount} members</span>
            <span>{group.activityCount} activities</span>
          </div>

          {/* Sign in option */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center">
            <p className="text-sm text-gray-600 mb-2">Already have an account?</p>
            <Link
              href={`/auth/login?callbackUrl=/auth/invite/${inviteCode}`}
              className="text-[#8C1515] font-semibold hover:underline"
            >
              Sign in to join
            </Link>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Or create an account</span>
            </div>
          </div>

          {formError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {formError}
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--stanford-cardinal)] focus:border-transparent outline-none transition"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--stanford-cardinal)] focus:border-transparent outline-none transition"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--stanford-cardinal)] focus:border-transparent outline-none transition"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--stanford-cardinal)] focus:border-transparent outline-none transition pr-12"
                  placeholder="Min 8 chars, uppercase, lowercase, number"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className={`w-full px-4 py-3 text-gray-900 bg-white border rounded-lg focus:ring-2 focus:ring-[var(--stanford-cardinal)] focus:border-transparent outline-none transition ${
                  passwordMatch === true
                    ? 'border-green-500'
                    : passwordMatch === false
                    ? 'border-red-500'
                    : 'border-gray-300'
                }`}
              />
              {passwordMatch === true && (
                <p className="mt-1 text-sm text-green-600">Passwords match</p>
              )}
              {passwordMatch === false && (
                <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
              )}
            </div>

            <div className="flex items-start gap-2">
              <input
                id="acceptTerms"
                name="acceptTerms"
                type="checkbox"
                checked={formData.acceptTerms}
                onChange={handleChange}
                className="mt-1 w-4 h-4 text-[#8C1515] border-gray-300 rounded focus:ring-[#8C1515]"
              />
              <label htmlFor="acceptTerms" className="text-sm text-gray-600">
                I accept the{' '}
                <Link href="/terms-of-service" className="text-[#8C1515] hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy-policy" className="text-[#8C1515] hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 font-semibold text-white rounded-lg transition disabled:opacity-50 mt-2"
              style={{ backgroundColor: 'var(--stanford-cardinal)' }}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" />
                  Creating account...
                </span>
              ) : (
                'Create Account & Join'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
