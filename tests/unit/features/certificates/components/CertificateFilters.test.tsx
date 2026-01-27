/**
 * CertificateFilters Component Tests
 *
 * TDD tests for the CertificateFilters component that provides
 * search and sort controls for certificate lists.
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CertificateFilters } from '@/features/certificates/components/CertificateFilters'

describe('CertificateFilters', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // Rendering Tests
  // ===========================================================================

  describe('Rendering', () => {
    it('renders search input', () => {
      render(<CertificateFilters />)

      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument()
    })

    it('renders sort dropdown', () => {
      render(<CertificateFilters />)

      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    it('renders with initial search value', () => {
      render(<CertificateFilters search="web dev" />)

      expect(screen.getByDisplayValue('web dev')).toBeInTheDocument()
    })

    it('renders with initial sort value', () => {
      render(<CertificateFilters sortBy="popular" />)

      expect(screen.getByRole('combobox')).toHaveValue('popular')
    })

    it('renders all sort options', () => {
      render(<CertificateFilters />)

      expect(screen.getByRole('option', { name: /newest/i })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: /popular/i })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: /name/i })).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // Search Tests
  // ===========================================================================

  describe('Search', () => {
    it('calls onSearchChange when typing', () => {
      const onSearchChange = vi.fn()
      render(<CertificateFilters onSearchChange={onSearchChange} />)

      fireEvent.change(screen.getByPlaceholderText(/search/i), {
        target: { value: 'test' },
      })

      expect(onSearchChange).toHaveBeenCalledWith('test')
    })

    it('renders custom placeholder', () => {
      render(<CertificateFilters searchPlaceholder="Find certificates..." />)

      expect(screen.getByPlaceholderText('Find certificates...')).toBeInTheDocument()
    })

    it('shows search icon', () => {
      const { container } = render(<CertificateFilters />)

      // Check for SVG search icon
      expect(container.querySelector('svg')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // Sort Tests
  // ===========================================================================

  describe('Sort', () => {
    it('calls onSortChange when selecting option', () => {
      const onSortChange = vi.fn()
      render(<CertificateFilters onSortChange={onSortChange} />)

      fireEvent.change(screen.getByRole('combobox'), {
        target: { value: 'popular' },
      })

      expect(onSortChange).toHaveBeenCalledWith('popular')
    })

    it('defaults to newest sort', () => {
      render(<CertificateFilters />)

      expect(screen.getByRole('combobox')).toHaveValue('newest')
    })
  })

  // ===========================================================================
  // Results Count Tests
  // ===========================================================================

  describe('Results Count', () => {
    it('shows results count when provided', () => {
      render(<CertificateFilters resultsCount={25} />)

      expect(screen.getByText('25 certificates found')).toBeInTheDocument()
    })

    it('shows loading text when loading', () => {
      render(<CertificateFilters loading />)

      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('shows singular form for 1 result', () => {
      render(<CertificateFilters resultsCount={1} />)

      expect(screen.getByText('1 certificate found')).toBeInTheDocument()
    })

    it('does not show count when not provided', () => {
      render(<CertificateFilters />)

      expect(screen.queryByText(/certificates? found/i)).not.toBeInTheDocument()
    })
  })

  // ===========================================================================
  // Layout Tests
  // ===========================================================================

  describe('Layout', () => {
    it('renders in horizontal layout by default', () => {
      const { container } = render(<CertificateFilters />)

      // The inner div has flex layout
      const innerDiv = container.querySelector('.flex')
      expect(innerDiv).toBeInTheDocument()
    })

    it('applies custom className', () => {
      const { container } = render(<CertificateFilters className="custom-class" />)

      expect(container.firstChild).toHaveClass('custom-class')
    })
  })
})
