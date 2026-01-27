/**
 * CertificateCard Component Tests
 *
 * TDD tests for the CertificateCard component that displays
 * a certificate in a card format with actions.
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CertificateCard } from '@/features/certificates/components/CertificateCard'
import type { Certificate } from '@/features/certificates/types'

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

const mockCertificate: Certificate = {
  id: 'cert-1',
  name: 'Web Development Certificate',
  organizationName: 'Tech Academy',
  programName: 'Full Stack Program',
  certificateStatement: 'This certifies completion...',
  studentInstructions: 'Complete all activities',
  signatoryName: 'John Doe',
  logoImageUrl: null,
  backgroundImageUrl: null,
  qrPosition: null,
  logoPosition: null,
  status: 'published',
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
  createdById: 'user-1',
  _count: {
    activities: 5,
    studentCertificates: 100,
  },
  isEnrolled: false,
}

describe('CertificateCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // Rendering Tests
  // ===========================================================================

  describe('Rendering', () => {
    it('renders certificate name', () => {
      render(<CertificateCard certificate={mockCertificate} />)

      expect(screen.getByText('Web Development Certificate')).toBeInTheDocument()
    })

    it('renders organization name when provided', () => {
      render(<CertificateCard certificate={mockCertificate} />)

      expect(screen.getByText('Tech Academy')).toBeInTheDocument()
    })

    it('does not render organization when null', () => {
      const cert = { ...mockCertificate, organizationName: null }
      render(<CertificateCard certificate={cert} />)

      expect(screen.queryByText('Tech Academy')).not.toBeInTheDocument()
    })

    it('renders activity count', () => {
      render(<CertificateCard certificate={mockCertificate} />)

      expect(screen.getByText('5 activities')).toBeInTheDocument()
    })

    it('renders enrollment count', () => {
      render(<CertificateCard certificate={mockCertificate} />)

      expect(screen.getByText('100 enrolled')).toBeInTheDocument()
    })

    it('renders logo image when provided', () => {
      const cert = { ...mockCertificate, logoImageUrl: 'https://example.com/logo.png' }
      render(<CertificateCard certificate={cert} />)

      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('src', 'https://example.com/logo.png')
    })

    it('renders placeholder icon when no logo', () => {
      render(<CertificateCard certificate={mockCertificate} />)

      // Check for SVG placeholder (certificate icon)
      expect(screen.queryByRole('img')).not.toBeInTheDocument()
    })
  })

  // ===========================================================================
  // Enrolled State Tests
  // ===========================================================================

  describe('Enrolled State', () => {
    it('shows enrolled badge when isEnrolled is true', () => {
      const cert = { ...mockCertificate, isEnrolled: true }
      render(<CertificateCard certificate={cert} />)

      expect(screen.getByText('Enrolled')).toBeInTheDocument()
    })

    it('does not show enrolled badge when isEnrolled is false', () => {
      render(<CertificateCard certificate={mockCertificate} />)

      expect(screen.queryByText('Enrolled')).not.toBeInTheDocument()
    })

    it('shows "View Progress" button when enrolled', () => {
      const cert = { ...mockCertificate, isEnrolled: true }
      render(<CertificateCard certificate={cert} />)

      expect(screen.getByText('View Progress')).toBeInTheDocument()
    })

    it('shows "View Details" and "Enroll" buttons when not enrolled', () => {
      render(<CertificateCard certificate={mockCertificate} />)

      expect(screen.getByText('View Details')).toBeInTheDocument()
      expect(screen.getByText('Enroll')).toBeInTheDocument()
    })

    it('links to certificate page when enrolled', () => {
      const cert = { ...mockCertificate, isEnrolled: true }
      render(<CertificateCard certificate={cert} />)

      const link = screen.getByRole('link', { name: /View Progress/i })
      expect(link).toHaveAttribute('href', '/certificates/cert-1')
    })
  })

  // ===========================================================================
  // Action Tests
  // ===========================================================================

  describe('Actions', () => {
    it('calls onEnroll when Enroll button is clicked', () => {
      const onEnroll = vi.fn()
      render(<CertificateCard certificate={mockCertificate} onEnroll={onEnroll} />)

      fireEvent.click(screen.getByText('Enroll'))

      expect(onEnroll).toHaveBeenCalledWith('cert-1')
    })

    it('shows loading state when isEnrolling is true', () => {
      render(
        <CertificateCard
          certificate={mockCertificate}
          isEnrolling={true}
        />
      )

      expect(screen.getByText('Enrolling...')).toBeInTheDocument()
    })

    it('disables Enroll button when isEnrolling is true', () => {
      render(
        <CertificateCard
          certificate={mockCertificate}
          isEnrolling={true}
        />
      )

      const button = screen.getByRole('button', { name: /Enrolling/i })
      expect(button).toBeDisabled()
    })

    it('links View Details to certificate page', () => {
      render(<CertificateCard certificate={mockCertificate} />)

      const link = screen.getByRole('link', { name: /View Details/i })
      expect(link).toHaveAttribute('href', '/certificates/cert-1')
    })
  })

  // ===========================================================================
  // Compact Mode Tests
  // ===========================================================================

  describe('Compact Mode', () => {
    it('renders in compact mode when compact prop is true', () => {
      const { container } = render(
        <CertificateCard certificate={mockCertificate} compact />
      )

      // Compact mode should have smaller dimensions
      expect(container.firstChild).toHaveClass('compact')
    })

    it('hides enrollment count in compact mode', () => {
      render(<CertificateCard certificate={mockCertificate} compact />)

      expect(screen.queryByText('100 enrolled')).not.toBeInTheDocument()
    })
  })
})
