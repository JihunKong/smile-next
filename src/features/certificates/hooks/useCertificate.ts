/**
 * useCertificate Hook
 *
 * Manages single certificate fetching and mutations with optimistic updates.
 * Extracted from certificates/[id]/edit/page.tsx for reuse.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import type { CertificateDetails } from '../types'

export interface UseCertificateReturn {
  /** Certificate data */
  certificate: CertificateDetails | null
  /** Loading state */
  loading: boolean
  /** Saving state (during update) */
  saving: boolean
  /** Error state */
  error: Error | null
  /** Whether certificate was not found (404) */
  notFound: boolean
  /** Update certificate fields */
  updateCertificate: (updates: Partial<CertificateDetails>) => Promise<void>
  /** Refetch certificate data */
  refetch: () => Promise<void>
}

/**
 * Hook for fetching and managing a single certificate
 *
 * @param id - Certificate ID to fetch (undefined to skip fetching)
 *
 * @example
 * ```tsx
 * function CertificateEditor({ id }: { id: string }) {
 *   const { certificate, loading, saving, updateCertificate } = useCertificate(id)
 *
 *   if (loading) return <Loading />
 *   if (!certificate) return <NotFound />
 *
 *   const handleSave = async () => {
 *     await updateCertificate({ name: 'New Name' })
 *   }
 *
 *   return (
 *     <div>
 *       <h1>{certificate.name}</h1>
 *       <button onClick={handleSave} disabled={saving}>
 *         {saving ? 'Saving...' : 'Save'}
 *       </button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useCertificate(id: string | undefined): UseCertificateReturn {
  // State
  const [certificate, setCertificate] = useState<CertificateDetails | null>(null)
  const [loading, setLoading] = useState(!!id)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [notFound, setNotFound] = useState(false)

  // Ref to track previous value for rollback
  const previousCertificate = useRef<CertificateDetails | null>(null)

  // Fetch certificate
  const fetchCertificate = useCallback(async (certificateId: string) => {
    setLoading(true)
    setError(null)
    setNotFound(false)

    try {
      const response = await fetch(`/api/certificates/${certificateId}`)

      if (!response.ok) {
        if (response.status === 404) {
          setNotFound(true)
          throw new Error('Certificate not found')
        }
        throw new Error('Failed to fetch certificate')
      }

      const data = await response.json()
      setCertificate(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
      setCertificate(null)
    } finally {
      setLoading(false)
    }
  }, [])

  // Refetch
  const refetch = useCallback(async () => {
    if (id) {
      await fetchCertificate(id)
    }
  }, [id, fetchCertificate])

  // Update certificate with optimistic updates
  const updateCertificate = useCallback(async (updates: Partial<CertificateDetails>) => {
    if (!certificate || !id) {
      throw new Error('No certificate to update')
    }

    // Store previous state for rollback
    previousCertificate.current = certificate

    // Optimistic update
    setCertificate((prev) => prev ? { ...prev, ...updates } : prev)
    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/certificates/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error('Failed to update certificate')
      }

      const data = await response.json()
      setCertificate(data)
    } catch (err) {
      // Rollback on error
      setCertificate(previousCertificate.current)
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      throw error
    } finally {
      setSaving(false)
    }
  }, [certificate, id])

  // Initial fetch when id changes
  useEffect(() => {
    if (id) {
      fetchCertificate(id)
    } else {
      setCertificate(null)
      setLoading(false)
    }
  }, [id, fetchCertificate])

  return {
    certificate,
    loading,
    saving,
    error,
    notFound,
    updateCertificate,
    refetch,
  }
}
