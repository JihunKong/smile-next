/**
 * CertificateGrid Component Tests
 *
 * TDD tests for the CertificateGrid component that displays
 * a grid of certificate cards with loading and empty states.
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { CertificateGrid } from '@/features/certificates/components/CertificateGrid'
import type { Certificate } from '@/features/certificates/types'

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

const mockCertificates: Certificate[] = [
  {
    id: 'cert-1',
    name: 'Web Development Certificate',
    organizationName: 'Tech Academy',
    programName: null,
    certificateStatement: null,
    studentInstructions: null,
    signatoryName: null,
    logoImageUrl: null,
    backgroundImageUrl: null,
    qrPosition: null,
    logoPosition: null,
    status: 'published',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    createdById: 'user-1',
    _count: { activities: 5, studentCertificates: 100 },
    isEnrolled: false,
  },
  {
    id: 'cert-2',
    name: 'Data Science Fundamentals',
    organizationName: 'Data Institute',
    programName: null,
    certificateStatement: null,
    studentInstructions: null,
    signatoryName: null,
    logoImageUrl: null,
    backgroundImageUrl: null,
    qrPosition: null,
    logoPosition: null,
    status: 'published',
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-01-20T10:00:00Z',
    createdById: 'user-1',
    _count: { activities: 8, studentCertificates: 50 },
    isEnrolled: true,
  },
]

describe('CertificateGrid', () => {
  // ===========================================================================
  // Rendering Tests
  // ===========================================================================

  describe('Rendering', () => {
    it('renders certificate cards', () => {
      render(<CertificateGrid certificates={mockCertificates} />)

      expect(screen.getByText('Web Development Certificate')).toBeInTheDocument()
      expect(screen.getByText('Data Science Fundamentals')).toBeInTheDocument()
    })

    it('renders correct number of cards', () => {
      const { container } = render(<CertificateGrid certificates={mockCertificates} />)

      const cards = container.querySelectorAll('[data-testid="certificate-card"]')
      expect(cards).toHaveLength(2)
    })

    it('renders in 3-column grid layout on large screens', () => {
      const { container } = render(<CertificateGrid certificates={mockCertificates} />)

      expect(container.firstChild).toHaveClass('grid')
      expect(container.firstChild).toHaveClass('lg:grid-cols-3')
    })
  })

  // ===========================================================================
  // Loading State Tests
  // ===========================================================================

  describe('Loading State', () => {
    it('renders skeleton cards when loading', () => {
      const { container } = render(<CertificateGrid certificates={[]} loading />)

      const skeletons = container.querySelectorAll('[data-testid="certificate-skeleton"]')
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('renders specified number of skeleton cards', () => {
      const { container } = render(
        <CertificateGrid certificates={[]} loading skeletonCount={4} />
      )

      const skeletons = container.querySelectorAll('[data-testid="certificate-skeleton"]')
      expect(skeletons).toHaveLength(4)
    })

    it('renders 6 skeleton cards by default', () => {
      const { container } = render(<CertificateGrid certificates={[]} loading />)

      const skeletons = container.querySelectorAll('[data-testid="certificate-skeleton"]')
      expect(skeletons).toHaveLength(6)
    })

    it('does not render certificates when loading', () => {
      render(<CertificateGrid certificates={mockCertificates} loading />)

      expect(screen.queryByText('Web Development Certificate')).not.toBeInTheDocument()
    })
  })

  // ===========================================================================
  // Empty State Tests
  // ===========================================================================

  describe('Empty State', () => {
    it('renders empty state when no certificates', () => {
      render(<CertificateGrid certificates={[]} />)

      expect(screen.getByText('No certificates found')).toBeInTheDocument()
    })

    it('renders custom empty message', () => {
      render(
        <CertificateGrid
          certificates={[]}
          emptyMessage="No results for your search"
        />
      )

      expect(screen.getByText('No results for your search')).toBeInTheDocument()
    })

    it('renders clear search button when searchQuery provided', () => {
      const onClearSearch = vi.fn()
      render(
        <CertificateGrid
          certificates={[]}
          searchQuery="test"
          onClearSearch={onClearSearch}
        />
      )

      expect(screen.getByText('Clear search')).toBeInTheDocument()
    })

    it('does not render clear search button when no searchQuery', () => {
      render(<CertificateGrid certificates={[]} />)

      expect(screen.queryByText('Clear search')).not.toBeInTheDocument()
    })
  })

  // ===========================================================================
  // Enrollment Tests
  // ===========================================================================

  describe('Enrollment', () => {
    it('passes onEnroll to certificate cards', () => {
      const onEnroll = vi.fn()
      render(
        <CertificateGrid
          certificates={mockCertificates}
          onEnroll={onEnroll}
        />
      )

      // Find and click enroll button on first card (not enrolled)
      const enrollButton = screen.getByText('Enroll')
      enrollButton.click()

      expect(onEnroll).toHaveBeenCalledWith('cert-1')
    })

    it('shows loading state for enrolling certificate', () => {
      render(
        <CertificateGrid
          certificates={mockCertificates}
          enrollingId="cert-1"
        />
      )

      expect(screen.getByText('Enrolling...')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // Column Configuration Tests
  // ===========================================================================

  describe('Column Configuration', () => {
    it('renders with 2 columns when cols=2', () => {
      const { container } = render(
        <CertificateGrid certificates={mockCertificates} cols={2} />
      )

      expect(container.firstChild).toHaveClass('lg:grid-cols-2')
    })

    it('renders with 4 columns when cols=4', () => {
      const { container } = render(
        <CertificateGrid certificates={mockCertificates} cols={4} />
      )

      expect(container.firstChild).toHaveClass('lg:grid-cols-4')
    })
  })
})
