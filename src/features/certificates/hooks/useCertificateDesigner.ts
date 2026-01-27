/**
 * useCertificateDesigner Hook
 *
 * Manages certificate visual design state including logo, background,
 * QR position, and badge placement.
 */

import { useState, useCallback, useMemo } from 'react'
import type { CertificateDesignerData, CertificateBadge } from '../types'

export type LogoPosition = CertificateDesignerData['logoPosition']
export type QrPosition = CertificateDesignerData['qrPosition']

export interface UseCertificateDesignerOptions {
  /** Initial designer data for editing */
  initialData?: CertificateDesignerData
  /** Callback when designer data changes */
  onChange?: (data: CertificateDesignerData) => void
}

export interface AddBadgeInput {
  badgeType: string
  positionX: number
  positionY: number
  width?: number
  height?: number
}

export interface UseCertificateDesignerReturn {
  /** Current designer data */
  designerData: CertificateDesignerData
  /** Whether designer has been modified */
  isDirty: boolean
  /** Whether logo is set */
  hasLogo: boolean
  /** Whether background is set */
  hasBackground: boolean

  /** Logo upload loading state */
  isUploadingLogo: boolean
  /** Background upload loading state */
  isUploadingBackground: boolean
  /** Set logo uploading state */
  setUploadingLogo: (uploading: boolean) => void
  /** Set background uploading state */
  setUploadingBackground: (uploading: boolean) => void

  /** Set logo image URL */
  setLogoImage: (url: string | null) => void
  /** Set logo position */
  setLogoPosition: (position: LogoPosition) => void
  /** Set background image URL */
  setBackgroundImage: (url: string | null) => void
  /** Set QR code position */
  setQrPosition: (position: QrPosition) => void

  /** Add a badge */
  addBadge: (badge: AddBadgeInput) => void
  /** Remove a badge by ID */
  removeBadge: (badgeId: string) => void
  /** Update badge position */
  updateBadgePosition: (badgeId: string, x: number, y: number) => void
  /** Update badge size */
  updateBadgeSize: (badgeId: string, width: number, height: number) => void
  /** Get badge by ID */
  getBadgeById: (badgeId: string) => CertificateBadge | undefined
  /** Get total badge count */
  getBadgeCount: () => number

  /** Reset to initial state */
  reset: () => void
}

const DEFAULT_BADGE_SIZE = 64

const emptyDesignerData: CertificateDesignerData = {
  logoImageUrl: null,
  backgroundImageUrl: null,
  logoPosition: 'top-center',
  qrPosition: 'bottom-right',
  badges: [],
}

/**
 * Generate a unique ID for badges
 */
function generateBadgeId(): string {
  return `badge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Hook for managing certificate designer state
 *
 * @example
 * ```tsx
 * function CertificateDesigner() {
 *   const {
 *     designerData,
 *     setLogoImage,
 *     setLogoPosition,
 *     addBadge,
 *     removeBadge,
 *   } = useCertificateDesigner()
 *
 *   return (
 *     <div>
 *       <ImageUploader onUpload={setLogoImage} />
 *       <PositionSelector
 *         value={designerData.logoPosition}
 *         onChange={setLogoPosition}
 *       />
 *     </div>
 *   )
 * }
 * ```
 */
export function useCertificateDesigner(
  options: UseCertificateDesignerOptions = {}
): UseCertificateDesignerReturn {
  const { initialData, onChange } = options

  const getInitialData = useCallback((): CertificateDesignerData => {
    return initialData ? { ...initialData, badges: [...initialData.badges] } : { ...emptyDesignerData }
  }, [initialData])

  const [designerData, setDesignerData] = useState<CertificateDesignerData>(getInitialData)
  const [isDirty, setIsDirty] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isUploadingBackground, setIsUploadingBackground] = useState(false)

  // Computed properties
  const hasLogo = useMemo(() => designerData.logoImageUrl !== null, [designerData.logoImageUrl])
  const hasBackground = useMemo(
    () => designerData.backgroundImageUrl !== null,
    [designerData.backgroundImageUrl]
  )

  // Update designer data and trigger onChange
  const updateDesignerData = useCallback(
    (updater: (prev: CertificateDesignerData) => CertificateDesignerData) => {
      setDesignerData((prev) => {
        const newData = updater(prev)
        setIsDirty(true)
        onChange?.(newData)
        return newData
      })
    },
    [onChange]
  )

  // Logo management
  const setLogoImage = useCallback(
    (url: string | null) => {
      updateDesignerData((prev) => ({
        ...prev,
        logoImageUrl: url,
      }))
    },
    [updateDesignerData]
  )

  const setLogoPosition = useCallback(
    (position: LogoPosition) => {
      updateDesignerData((prev) => ({
        ...prev,
        logoPosition: position,
      }))
    },
    [updateDesignerData]
  )

  // Background management
  const setBackgroundImage = useCallback(
    (url: string | null) => {
      updateDesignerData((prev) => ({
        ...prev,
        backgroundImageUrl: url,
      }))
    },
    [updateDesignerData]
  )

  // QR position
  const setQrPosition = useCallback(
    (position: QrPosition) => {
      updateDesignerData((prev) => ({
        ...prev,
        qrPosition: position,
      }))
    },
    [updateDesignerData]
  )

  // Badge management
  const addBadge = useCallback(
    (input: AddBadgeInput) => {
      const newBadge: CertificateBadge = {
        id: generateBadgeId(),
        badgeType: input.badgeType,
        positionX: input.positionX,
        positionY: input.positionY,
        width: input.width ?? DEFAULT_BADGE_SIZE,
        height: input.height ?? DEFAULT_BADGE_SIZE,
      }

      updateDesignerData((prev) => ({
        ...prev,
        badges: [...prev.badges, newBadge],
      }))
    },
    [updateDesignerData]
  )

  const removeBadge = useCallback(
    (badgeId: string) => {
      updateDesignerData((prev) => {
        const filtered = prev.badges.filter((b) => b.id !== badgeId)
        if (filtered.length === prev.badges.length) {
          return prev // No change
        }
        return {
          ...prev,
          badges: filtered,
        }
      })
    },
    [updateDesignerData]
  )

  const updateBadgePosition = useCallback(
    (badgeId: string, x: number, y: number) => {
      updateDesignerData((prev) => {
        const index = prev.badges.findIndex((b) => b.id === badgeId)
        if (index === -1) {
          return prev
        }

        const badges = [...prev.badges]
        badges[index] = { ...badges[index], positionX: x, positionY: y }

        return {
          ...prev,
          badges,
        }
      })
    },
    [updateDesignerData]
  )

  const updateBadgeSize = useCallback(
    (badgeId: string, width: number, height: number) => {
      updateDesignerData((prev) => {
        const index = prev.badges.findIndex((b) => b.id === badgeId)
        if (index === -1) {
          return prev
        }

        const badges = [...prev.badges]
        badges[index] = { ...badges[index], width, height }

        return {
          ...prev,
          badges,
        }
      })
    },
    [updateDesignerData]
  )

  const getBadgeById = useCallback(
    (badgeId: string): CertificateBadge | undefined => {
      return designerData.badges.find((b) => b.id === badgeId)
    },
    [designerData.badges]
  )

  const getBadgeCount = useCallback(() => {
    return designerData.badges.length
  }, [designerData.badges])

  // Upload state setters
  const setUploadingLogo = useCallback((uploading: boolean) => {
    setIsUploadingLogo(uploading)
  }, [])

  const setUploadingBackground = useCallback((uploading: boolean) => {
    setIsUploadingBackground(uploading)
  }, [])

  // Reset
  const reset = useCallback(() => {
    setDesignerData(getInitialData())
    setIsDirty(false)
    // Note: onChange is not called on reset
  }, [getInitialData])

  return {
    designerData,
    isDirty,
    hasLogo,
    hasBackground,
    isUploadingLogo,
    isUploadingBackground,
    setUploadingLogo,
    setUploadingBackground,
    setLogoImage,
    setLogoPosition,
    setBackgroundImage,
    setQrPosition,
    addBadge,
    removeBadge,
    updateBadgePosition,
    updateBadgeSize,
    getBadgeById,
    getBadgeCount,
    reset,
  }
}
