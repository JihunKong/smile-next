'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { LoadingSpinner } from '@/components/ui'
import type { GroupInfo, RegistrationFormData } from '../types'
import { GroupStats } from './GroupStats'

interface RegistrationFormProps {
  group: GroupInfo
  inviteCode: string
  error: string | null
  isSubmitting: boolean
  onRegister: (data: RegistrationFormData) => void
}

/**
 * Registration form for new users joining via invite
 */
export function RegistrationForm({
  group,
  inviteCode,
  error,
  isSubmitting,
  onRegister,
}: RegistrationFormProps) {
  const [formData, setFormData] = useState<RegistrationFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [passwordMatch, setPasswordMatch] = useState<boolean | null>(null)
  const [formError, setFormError] = useState('')

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
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
    },
    [formData.password, formData.confirmPassword]
  )

  const validatePassword = useCallback((password: string) => {
    if (password.length < 8) return 'Password must be at least 8 characters'
    if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter'
    if (!/[a-z]/.test(password)) return 'Password must contain a lowercase letter'
    if (!/[0-9]/.test(password)) return 'Password must contain a number'
    return null
  }, [])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      setFormError('')

      // Validation
      const passwordError = validatePassword(formData.password)
      if (passwordError) {
        setFormError(passwordError)
        return
      }

      if (formData.password !== formData.confirmPassword) {
        setFormError('Passwords do not match')
        return
      }

      if (!formData.acceptTerms) {
        setFormError('You must accept the terms and conditions')
        return
      }

      onRegister(formData)
    },
    [formData, validatePassword, onRegister]
  )

  const displayError = formError || error

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
          <div className="mb-6">
            <GroupStats
              memberCount={group.memberCount}
              activityCount={group.activityCount}
              showIcons={false}
            />
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

          {displayError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {displayError}
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
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
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
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
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
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
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
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
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
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
