/**
 * BadgePlacer Component Tests
 *
 * TDD tests for the BadgePlacer component that allows placing
 * and positioning badges on a certificate design.
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BadgePlacer } from '@/features/certificates/components/BadgePlacer'
import type { CertificateBadge } from '@/features/certificates/types'

const mockBadges: CertificateBadge[] = [
  {
    id: 'badge-1',
    badgeType: 'completion',
    positionX: 100,
    positionY: 50,
    width: 64,
    height: 64,
  },
  {
    id: 'badge-2',
    badgeType: 'excellence',
    positionX: 200,
    positionY: 50,
    width: 80,
    height: 80,
  },
]

const availableBadgeTypes = [
  { type: 'completion', label: 'Completion Badge', icon: '🏆' },
  { type: 'excellence', label: 'Excellence Badge', icon: '⭐' },
  { type: 'participation', label: 'Participation Badge', icon: '🎯' },
]

describe('BadgePlacer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // Rendering Tests
  // ===========================================================================

  describe('Rendering', () => {
    it('renders badge type selector', () => {
      render(
        <BadgePlacer
          badges={[]}
          availableBadgeTypes={availableBadgeTypes}
          onAddBadge={vi.fn()}
          onRemoveBadge={vi.fn()}
          onUpdatePosition={vi.fn()}
          onUpdateSize={vi.fn()}
        />
      )

      expect(screen.getByText('Add Badge')).toBeInTheDocument()
    })

    it('renders placed badges', () => {
      render(
        <BadgePlacer
          badges={mockBadges}
          availableBadgeTypes={availableBadgeTypes}
          onAddBadge={vi.fn()}
          onRemoveBadge={vi.fn()}
          onUpdatePosition={vi.fn()}
          onUpdateSize={vi.fn()}
        />
      )

      expect(screen.getByText(/completion/i)).toBeInTheDocument()
      expect(screen.getByText(/excellence/i)).toBeInTheDocument()
    })

    it('shows badge count', () => {
      render(
        <BadgePlacer
          badges={mockBadges}
          availableBadgeTypes={availableBadgeTypes}
          onAddBadge={vi.fn()}
          onRemoveBadge={vi.fn()}
          onUpdatePosition={vi.fn()}
          onUpdateSize={vi.fn()}
        />
      )

      expect(screen.getByText(/2 badges/i)).toBeInTheDocument()
    })

    it('shows empty state when no badges', () => {
      render(
        <BadgePlacer
          badges={[]}
          availableBadgeTypes={availableBadgeTypes}
          onAddBadge={vi.fn()}
          onRemoveBadge={vi.fn()}
          onUpdatePosition={vi.fn()}
          onUpdateSize={vi.fn()}
        />
      )

      expect(screen.getByText(/no badges added/i)).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // Add Badge Tests
  // ===========================================================================

  describe('Add Badge', () => {
    it('shows badge type options when Add Badge clicked', () => {
      render(
        <BadgePlacer
          badges={[]}
          availableBadgeTypes={availableBadgeTypes}
          onAddBadge={vi.fn()}
          onRemoveBadge={vi.fn()}
          onUpdatePosition={vi.fn()}
          onUpdateSize={vi.fn()}
        />
      )

      fireEvent.click(screen.getByText('Add Badge'))

      expect(screen.getByText('Completion Badge')).toBeInTheDocument()
      expect(screen.getByText('Excellence Badge')).toBeInTheDocument()
      expect(screen.getByText('Participation Badge')).toBeInTheDocument()
    })

    it('calls onAddBadge when badge type selected', () => {
      const onAddBadge = vi.fn()

      render(
        <BadgePlacer
          badges={[]}
          availableBadgeTypes={availableBadgeTypes}
          onAddBadge={onAddBadge}
          onRemoveBadge={vi.fn()}
          onUpdatePosition={vi.fn()}
          onUpdateSize={vi.fn()}
        />
      )

      fireEvent.click(screen.getByText('Add Badge'))
      fireEvent.click(screen.getByText('Completion Badge'))

      expect(onAddBadge).toHaveBeenCalledWith(
        expect.objectContaining({
          badgeType: 'completion',
        })
      )
    })

    it('closes dropdown after selecting badge', () => {
      render(
        <BadgePlacer
          badges={[]}
          availableBadgeTypes={availableBadgeTypes}
          onAddBadge={vi.fn()}
          onRemoveBadge={vi.fn()}
          onUpdatePosition={vi.fn()}
          onUpdateSize={vi.fn()}
        />
      )

      fireEvent.click(screen.getByText('Add Badge'))
      fireEvent.click(screen.getByText('Completion Badge'))

      expect(screen.queryByText('Excellence Badge')).not.toBeInTheDocument()
    })
  })

  // ===========================================================================
  // Remove Badge Tests
  // ===========================================================================

  describe('Remove Badge', () => {
    it('calls onRemoveBadge when remove button clicked', () => {
      const onRemoveBadge = vi.fn()

      render(
        <BadgePlacer
          badges={mockBadges}
          availableBadgeTypes={availableBadgeTypes}
          onAddBadge={vi.fn()}
          onRemoveBadge={onRemoveBadge}
          onUpdatePosition={vi.fn()}
          onUpdateSize={vi.fn()}
        />
      )

      const removeButtons = screen.getAllByRole('button', { name: /remove/i })
      fireEvent.click(removeButtons[0])

      expect(onRemoveBadge).toHaveBeenCalledWith('badge-1')
    })
  })

  // ===========================================================================
  // Position Controls Tests
  // ===========================================================================

  describe('Position Controls', () => {
    it('shows position inputs for selected badge', () => {
      render(
        <BadgePlacer
          badges={mockBadges}
          availableBadgeTypes={availableBadgeTypes}
          onAddBadge={vi.fn()}
          onRemoveBadge={vi.fn()}
          onUpdatePosition={vi.fn()}
          onUpdateSize={vi.fn()}
          selectedBadgeId="badge-1"
        />
      )

      expect(screen.getByLabelText(/x position/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/y position/i)).toBeInTheDocument()
    })

    it('calls onUpdatePosition when position changed', () => {
      const onUpdatePosition = vi.fn()

      render(
        <BadgePlacer
          badges={mockBadges}
          availableBadgeTypes={availableBadgeTypes}
          onAddBadge={vi.fn()}
          onRemoveBadge={vi.fn()}
          onUpdatePosition={onUpdatePosition}
          onUpdateSize={vi.fn()}
          selectedBadgeId="badge-1"
        />
      )

      fireEvent.change(screen.getByLabelText(/x position/i), {
        target: { value: '150' },
      })

      expect(onUpdatePosition).toHaveBeenCalledWith('badge-1', 150, 50)
    })
  })

  // ===========================================================================
  // Size Controls Tests
  // ===========================================================================

  describe('Size Controls', () => {
    it('shows size inputs for selected badge', () => {
      render(
        <BadgePlacer
          badges={mockBadges}
          availableBadgeTypes={availableBadgeTypes}
          onAddBadge={vi.fn()}
          onRemoveBadge={vi.fn()}
          onUpdatePosition={vi.fn()}
          onUpdateSize={vi.fn()}
          selectedBadgeId="badge-1"
        />
      )

      expect(screen.getByLabelText(/width/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/height/i)).toBeInTheDocument()
    })

    it('calls onUpdateSize when size changed', () => {
      const onUpdateSize = vi.fn()

      render(
        <BadgePlacer
          badges={mockBadges}
          availableBadgeTypes={availableBadgeTypes}
          onAddBadge={vi.fn()}
          onRemoveBadge={vi.fn()}
          onUpdatePosition={vi.fn()}
          onUpdateSize={onUpdateSize}
          selectedBadgeId="badge-1"
        />
      )

      fireEvent.change(screen.getByLabelText(/width/i), {
        target: { value: '100' },
      })

      expect(onUpdateSize).toHaveBeenCalledWith('badge-1', 100, 64)
    })
  })

  // ===========================================================================
  // Selection Tests
  // ===========================================================================

  describe('Badge Selection', () => {
    it('calls onSelectBadge when badge clicked', () => {
      const onSelectBadge = vi.fn()

      render(
        <BadgePlacer
          badges={mockBadges}
          availableBadgeTypes={availableBadgeTypes}
          onAddBadge={vi.fn()}
          onRemoveBadge={vi.fn()}
          onUpdatePosition={vi.fn()}
          onUpdateSize={vi.fn()}
          onSelectBadge={onSelectBadge}
        />
      )

      const badgeItems = screen.getAllByRole('button', { name: /select/i })
      fireEvent.click(badgeItems[0])

      expect(onSelectBadge).toHaveBeenCalledWith('badge-1')
    })

    it('highlights selected badge', () => {
      render(
        <BadgePlacer
          badges={mockBadges}
          availableBadgeTypes={availableBadgeTypes}
          onAddBadge={vi.fn()}
          onRemoveBadge={vi.fn()}
          onUpdatePosition={vi.fn()}
          onUpdateSize={vi.fn()}
          selectedBadgeId="badge-1"
        />
      )

      const selectedItem = screen.getByTestId('badge-item-badge-1')
      expect(selectedItem).toHaveClass('ring-2')
    })
  })
})
