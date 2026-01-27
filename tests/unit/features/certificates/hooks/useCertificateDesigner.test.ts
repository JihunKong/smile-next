/**
 * useCertificateDesigner Hook Tests
 *
 * TDD tests for the useCertificateDesigner hook that manages certificate
 * visual design including logo, background, QR position, and badge placement.
 */

import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  useCertificateDesigner,
  type UseCertificateDesignerOptions,
} from '@/features/certificates/hooks/useCertificateDesigner'
import type { CertificateDesignerData, CertificateBadge } from '@/features/certificates/types'

// Sample test data
const mockBadge1: CertificateBadge = {
  id: 'badge-1',
  badgeType: 'completion',
  positionX: 100,
  positionY: 50,
  width: 80,
  height: 80,
}

const mockBadge2: CertificateBadge = {
  id: 'badge-2',
  badgeType: 'excellence',
  positionX: 200,
  positionY: 50,
  width: 60,
  height: 60,
}

const initialDesignerData: CertificateDesignerData = {
  logoImageUrl: 'https://example.com/logo.png',
  backgroundImageUrl: 'https://example.com/bg.jpg',
  logoPosition: 'top-center',
  qrPosition: 'bottom-right',
  badges: [mockBadge1],
}

describe('useCertificateDesigner', () => {
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
    it('returns default designer data when no initial values provided', () => {
      const { result } = renderHook(() => useCertificateDesigner())

      expect(result.current.designerData).toEqual({
        logoImageUrl: null,
        backgroundImageUrl: null,
        logoPosition: 'top-center',
        qrPosition: 'bottom-right',
        badges: [],
      })
    })

    it('returns provided initial values', () => {
      const { result } = renderHook(() =>
        useCertificateDesigner({ initialData: initialDesignerData })
      )

      expect(result.current.designerData).toEqual(initialDesignerData)
    })

    it('returns isDirty=false initially', () => {
      const { result } = renderHook(() => useCertificateDesigner())

      expect(result.current.isDirty).toBe(false)
    })

    it('returns hasLogo=false when no logo', () => {
      const { result } = renderHook(() => useCertificateDesigner())

      expect(result.current.hasLogo).toBe(false)
    })

    it('returns hasLogo=true when logo is set', () => {
      const { result } = renderHook(() =>
        useCertificateDesigner({ initialData: initialDesignerData })
      )

      expect(result.current.hasLogo).toBe(true)
    })

    it('returns hasBackground=false when no background', () => {
      const { result } = renderHook(() => useCertificateDesigner())

      expect(result.current.hasBackground).toBe(false)
    })

    it('returns hasBackground=true when background is set', () => {
      const { result } = renderHook(() =>
        useCertificateDesigner({ initialData: initialDesignerData })
      )

      expect(result.current.hasBackground).toBe(true)
    })
  })

  // ===========================================================================
  // Logo Management Tests
  // ===========================================================================

  describe('Logo Management', () => {
    it('sets logo image URL', () => {
      const { result } = renderHook(() => useCertificateDesigner())

      act(() => {
        result.current.setLogoImage('https://example.com/new-logo.png')
      })

      expect(result.current.designerData.logoImageUrl).toBe('https://example.com/new-logo.png')
    })

    it('clears logo image when null is passed', () => {
      const { result } = renderHook(() =>
        useCertificateDesigner({ initialData: initialDesignerData })
      )

      expect(result.current.hasLogo).toBe(true)

      act(() => {
        result.current.setLogoImage(null)
      })

      expect(result.current.designerData.logoImageUrl).toBeNull()
      expect(result.current.hasLogo).toBe(false)
    })

    it('sets logo position', () => {
      const { result } = renderHook(() => useCertificateDesigner())

      act(() => {
        result.current.setLogoPosition('top-left')
      })

      expect(result.current.designerData.logoPosition).toBe('top-left')
    })

    it('updates logo position to top-right', () => {
      const { result } = renderHook(() => useCertificateDesigner())

      act(() => {
        result.current.setLogoPosition('top-right')
      })

      expect(result.current.designerData.logoPosition).toBe('top-right')
    })

    it('marks form as dirty after logo change', () => {
      const { result } = renderHook(() => useCertificateDesigner())

      act(() => {
        result.current.setLogoImage('https://example.com/logo.png')
      })

      expect(result.current.isDirty).toBe(true)
    })
  })

  // ===========================================================================
  // Background Management Tests
  // ===========================================================================

  describe('Background Management', () => {
    it('sets background image URL', () => {
      const { result } = renderHook(() => useCertificateDesigner())

      act(() => {
        result.current.setBackgroundImage('https://example.com/bg.jpg')
      })

      expect(result.current.designerData.backgroundImageUrl).toBe('https://example.com/bg.jpg')
    })

    it('clears background image when null is passed', () => {
      const { result } = renderHook(() =>
        useCertificateDesigner({ initialData: initialDesignerData })
      )

      expect(result.current.hasBackground).toBe(true)

      act(() => {
        result.current.setBackgroundImage(null)
      })

      expect(result.current.designerData.backgroundImageUrl).toBeNull()
      expect(result.current.hasBackground).toBe(false)
    })

    it('marks form as dirty after background change', () => {
      const { result } = renderHook(() => useCertificateDesigner())

      act(() => {
        result.current.setBackgroundImage('https://example.com/bg.jpg')
      })

      expect(result.current.isDirty).toBe(true)
    })
  })

  // ===========================================================================
  // QR Position Tests
  // ===========================================================================

  describe('QR Position', () => {
    it('sets QR position to bottom-left', () => {
      const { result } = renderHook(() => useCertificateDesigner())

      act(() => {
        result.current.setQrPosition('bottom-left')
      })

      expect(result.current.designerData.qrPosition).toBe('bottom-left')
    })

    it('sets QR position to bottom-center', () => {
      const { result } = renderHook(() => useCertificateDesigner())

      act(() => {
        result.current.setQrPosition('bottom-center')
      })

      expect(result.current.designerData.qrPosition).toBe('bottom-center')
    })

    it('sets QR position to bottom-right', () => {
      const { result } = renderHook(() =>
        useCertificateDesigner({
          initialData: { ...initialDesignerData, qrPosition: 'bottom-left' },
        })
      )

      act(() => {
        result.current.setQrPosition('bottom-right')
      })

      expect(result.current.designerData.qrPosition).toBe('bottom-right')
    })
  })

  // ===========================================================================
  // Badge Management Tests
  // ===========================================================================

  describe('Badge Management', () => {
    describe('addBadge', () => {
      it('adds a badge to the list', () => {
        const { result } = renderHook(() => useCertificateDesigner())

        act(() => {
          result.current.addBadge({
            badgeType: 'completion',
            positionX: 100,
            positionY: 100,
          })
        })

        expect(result.current.designerData.badges).toHaveLength(1)
        expect(result.current.designerData.badges[0]).toMatchObject({
          badgeType: 'completion',
          positionX: 100,
          positionY: 100,
        })
      })

      it('generates unique ID for new badge', () => {
        const { result } = renderHook(() => useCertificateDesigner())

        act(() => {
          result.current.addBadge({
            badgeType: 'completion',
            positionX: 100,
            positionY: 100,
          })
        })

        act(() => {
          result.current.addBadge({
            badgeType: 'excellence',
            positionX: 200,
            positionY: 100,
          })
        })

        const ids = result.current.designerData.badges.map((b) => b.id)
        expect(ids[0]).not.toBe(ids[1])
      })

      it('uses default width and height if not provided', () => {
        const { result } = renderHook(() => useCertificateDesigner())

        act(() => {
          result.current.addBadge({
            badgeType: 'completion',
            positionX: 100,
            positionY: 100,
          })
        })

        expect(result.current.designerData.badges[0].width).toBe(64)
        expect(result.current.designerData.badges[0].height).toBe(64)
      })

      it('uses provided width and height', () => {
        const { result } = renderHook(() => useCertificateDesigner())

        act(() => {
          result.current.addBadge({
            badgeType: 'completion',
            positionX: 100,
            positionY: 100,
            width: 80,
            height: 80,
          })
        })

        expect(result.current.designerData.badges[0].width).toBe(80)
        expect(result.current.designerData.badges[0].height).toBe(80)
      })
    })

    describe('removeBadge', () => {
      it('removes a badge by ID', () => {
        const { result } = renderHook(() =>
          useCertificateDesigner({
            initialData: { ...initialDesignerData, badges: [mockBadge1, mockBadge2] },
          })
        )

        expect(result.current.designerData.badges).toHaveLength(2)

        act(() => {
          result.current.removeBadge('badge-1')
        })

        expect(result.current.designerData.badges).toHaveLength(1)
        expect(result.current.designerData.badges[0].id).toBe('badge-2')
      })

      it('does nothing if badge not found', () => {
        const { result } = renderHook(() =>
          useCertificateDesigner({ initialData: initialDesignerData })
        )

        const initialBadges = [...result.current.designerData.badges]

        act(() => {
          result.current.removeBadge('non-existent')
        })

        expect(result.current.designerData.badges).toEqual(initialBadges)
      })
    })

    describe('updateBadgePosition', () => {
      it('updates badge position', () => {
        const { result } = renderHook(() =>
          useCertificateDesigner({ initialData: initialDesignerData })
        )

        act(() => {
          result.current.updateBadgePosition('badge-1', 150, 75)
        })

        expect(result.current.designerData.badges[0].positionX).toBe(150)
        expect(result.current.designerData.badges[0].positionY).toBe(75)
      })

      it('does nothing if badge not found', () => {
        const { result } = renderHook(() =>
          useCertificateDesigner({ initialData: initialDesignerData })
        )

        const initialPosition = {
          x: result.current.designerData.badges[0].positionX,
          y: result.current.designerData.badges[0].positionY,
        }

        act(() => {
          result.current.updateBadgePosition('non-existent', 999, 999)
        })

        expect(result.current.designerData.badges[0].positionX).toBe(initialPosition.x)
        expect(result.current.designerData.badges[0].positionY).toBe(initialPosition.y)
      })
    })

    describe('updateBadgeSize', () => {
      it('updates badge size', () => {
        const { result } = renderHook(() =>
          useCertificateDesigner({ initialData: initialDesignerData })
        )

        act(() => {
          result.current.updateBadgeSize('badge-1', 100, 100)
        })

        expect(result.current.designerData.badges[0].width).toBe(100)
        expect(result.current.designerData.badges[0].height).toBe(100)
      })

      it('does nothing if badge not found', () => {
        const { result } = renderHook(() =>
          useCertificateDesigner({ initialData: initialDesignerData })
        )

        const initialSize = {
          width: result.current.designerData.badges[0].width,
          height: result.current.designerData.badges[0].height,
        }

        act(() => {
          result.current.updateBadgeSize('non-existent', 999, 999)
        })

        expect(result.current.designerData.badges[0].width).toBe(initialSize.width)
        expect(result.current.designerData.badges[0].height).toBe(initialSize.height)
      })
    })

    describe('getBadgeById', () => {
      it('returns badge by ID', () => {
        const { result } = renderHook(() =>
          useCertificateDesigner({ initialData: initialDesignerData })
        )

        const badge = result.current.getBadgeById('badge-1')

        expect(badge).toEqual(mockBadge1)
      })

      it('returns undefined if badge not found', () => {
        const { result } = renderHook(() =>
          useCertificateDesigner({ initialData: initialDesignerData })
        )

        const badge = result.current.getBadgeById('non-existent')

        expect(badge).toBeUndefined()
      })
    })

    describe('getBadgeCount', () => {
      it('returns total badge count', () => {
        const { result } = renderHook(() =>
          useCertificateDesigner({
            initialData: { ...initialDesignerData, badges: [mockBadge1, mockBadge2] },
          })
        )

        expect(result.current.getBadgeCount()).toBe(2)
      })

      it('returns 0 for empty badges', () => {
        const { result } = renderHook(() => useCertificateDesigner())

        expect(result.current.getBadgeCount()).toBe(0)
      })
    })
  })

  // ===========================================================================
  // Reset Tests
  // ===========================================================================

  describe('Reset', () => {
    it('resets to default state when no initial data', () => {
      const { result } = renderHook(() => useCertificateDesigner())

      act(() => {
        result.current.setLogoImage('https://example.com/logo.png')
        result.current.setBackgroundImage('https://example.com/bg.jpg')
        result.current.addBadge({ badgeType: 'test', positionX: 0, positionY: 0 })
      })

      expect(result.current.designerData.logoImageUrl).not.toBeNull()

      act(() => {
        result.current.reset()
      })

      expect(result.current.designerData).toEqual({
        logoImageUrl: null,
        backgroundImageUrl: null,
        logoPosition: 'top-center',
        qrPosition: 'bottom-right',
        badges: [],
      })
    })

    it('resets to provided initial data', () => {
      const { result } = renderHook(() =>
        useCertificateDesigner({ initialData: initialDesignerData })
      )

      act(() => {
        result.current.setLogoImage('https://example.com/modified.png')
        result.current.setLogoPosition('top-left')
        result.current.removeBadge('badge-1')
      })

      expect(result.current.designerData.logoImageUrl).toBe('https://example.com/modified.png')

      act(() => {
        result.current.reset()
      })

      expect(result.current.designerData).toEqual(initialDesignerData)
    })

    it('resets isDirty to false', () => {
      const { result } = renderHook(() => useCertificateDesigner())

      act(() => {
        result.current.setLogoImage('https://example.com/logo.png')
      })

      expect(result.current.isDirty).toBe(true)

      act(() => {
        result.current.reset()
      })

      expect(result.current.isDirty).toBe(false)
    })
  })

  // ===========================================================================
  // onChange Callback Tests
  // ===========================================================================

  describe('onChange Callback', () => {
    it('calls onChange when designer data changes', () => {
      const onChange = vi.fn()

      const { result } = renderHook(() => useCertificateDesigner({ onChange }))

      act(() => {
        result.current.setLogoImage('https://example.com/logo.png')
      })

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ logoImageUrl: 'https://example.com/logo.png' })
      )
    })

    it('calls onChange when badge is added', () => {
      const onChange = vi.fn()

      const { result } = renderHook(() => useCertificateDesigner({ onChange }))

      act(() => {
        result.current.addBadge({ badgeType: 'test', positionX: 0, positionY: 0 })
      })

      expect(onChange).toHaveBeenCalled()
      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0]
      expect(lastCall.badges).toHaveLength(1)
    })

    it('does not call onChange on reset', () => {
      const onChange = vi.fn()

      const { result } = renderHook(() =>
        useCertificateDesigner({ onChange, initialData: initialDesignerData })
      )

      act(() => {
        result.current.setLogoImage('https://example.com/modified.png')
      })

      onChange.mockClear()

      act(() => {
        result.current.reset()
      })

      expect(onChange).not.toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // Image Upload Simulation Tests
  // ===========================================================================

  describe('Image Upload Support', () => {
    it('isUploadingLogo returns false initially', () => {
      const { result } = renderHook(() => useCertificateDesigner())

      expect(result.current.isUploadingLogo).toBe(false)
    })

    it('isUploadingBackground returns false initially', () => {
      const { result } = renderHook(() => useCertificateDesigner())

      expect(result.current.isUploadingBackground).toBe(false)
    })

    it('setUploadingLogo updates loading state', () => {
      const { result } = renderHook(() => useCertificateDesigner())

      act(() => {
        result.current.setUploadingLogo(true)
      })

      expect(result.current.isUploadingLogo).toBe(true)

      act(() => {
        result.current.setUploadingLogo(false)
      })

      expect(result.current.isUploadingLogo).toBe(false)
    })

    it('setUploadingBackground updates loading state', () => {
      const { result } = renderHook(() => useCertificateDesigner())

      act(() => {
        result.current.setUploadingBackground(true)
      })

      expect(result.current.isUploadingBackground).toBe(true)

      act(() => {
        result.current.setUploadingBackground(false)
      })

      expect(result.current.isUploadingBackground).toBe(false)
    })
  })
})
