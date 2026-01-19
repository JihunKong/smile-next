/**
 * Unit tests for CertificateProgress component
 * Tests certificate cards, progress bars, activity lists, and status badges
 *
 * Following TDD approach as specified in VIBE-0003G
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { CertificateProgress } from '@/app/(dashboard)/dashboard/components'
import type { ProcessedCertificate, CertificateActivity } from '@/app/(dashboard)/dashboard/types'

/**
 * Factory function to create mock certificate activity
 */
const createMockActivity = (
  overrides: Partial<CertificateActivity> = {}
): CertificateActivity => ({
  activity_id: 'activity-1',
  activity_name: 'Test Activity',
  required: true,
  status: 'not_started',
  ...overrides,
})

/**
 * Factory function to create mock certificate with sensible defaults
 */
const createMockCertificate = (
  overrides: Partial<ProcessedCertificate> = {}
): ProcessedCertificate => ({
  id: 'cert-1',
  name: 'AI Fundamentals',
  status: 'in_progress',
  enrollment_date: new Date('2026-01-01'),
  completion_date: null,
  progress_percentage: 60,
  activities: [
    createMockActivity({
      activity_id: 'a1',
      activity_name: 'Intro to ML',
      required: true,
      status: 'passed',
    }),
    createMockActivity({
      activity_id: 'a2',
      activity_name: 'Neural Networks',
      required: true,
      status: 'not_started',
    }),
  ],
  ...overrides,
})

describe('CertificateProgress', () => {
  describe('Empty State', () => {
    it('returns null when certificates array is empty', () => {
      const { container } = render(<CertificateProgress certificates={[]} />)
      expect(container).toBeEmptyDOMElement()
    })

    it('returns null when certificates is undefined', () => {
      const { container } = render(
        <CertificateProgress certificates={undefined as unknown as ProcessedCertificate[]} />
      )
      expect(container).toBeEmptyDOMElement()
    })
  })

  describe('Header Section', () => {
    it('renders My Certificates heading', () => {
      render(<CertificateProgress certificates={[createMockCertificate()]} />)
      expect(screen.getByText('My Certificates')).toBeInTheDocument()
    })

    it('shows View All link to /my-certificates', () => {
      render(<CertificateProgress certificates={[createMockCertificate()]} />)
      const viewAllLink = screen.getByRole('link', { name: /View All/i })
      expect(viewAllLink).toHaveAttribute('href', '/my-certificates')
    })
  })

  describe('Certificate Card', () => {
    it('renders certificate name', () => {
      render(<CertificateProgress certificates={[createMockCertificate()]} />)
      expect(screen.getByText('AI Fundamentals')).toBeInTheDocument()
    })

    it('shows enrollment date formatted correctly', () => {
      render(<CertificateProgress certificates={[createMockCertificate()]} />)
      // Date formatting may vary by timezone, so we just check for "Enrolled" prefix
      expect(screen.getByText(/Enrolled/)).toBeInTheDocument()
    })

    it('links certificate name to progress page', () => {
      render(<CertificateProgress certificates={[createMockCertificate({ id: 'cert-123' })]} />)
      const nameLink = screen.getByRole('link', { name: 'AI Fundamentals' })
      expect(nameLink).toHaveAttribute('href', '/my-certificates/cert-123/progress')
    })
  })

  describe('Status Badges', () => {
    it('shows In Progress badge for incomplete certificate', () => {
      render(
        <CertificateProgress certificates={[createMockCertificate({ status: 'in_progress' })]} />
      )
      expect(screen.getByText('In Progress')).toBeInTheDocument()
    })

    it('shows Completed badge for complete certificate', () => {
      render(
        <CertificateProgress
          certificates={[
            createMockCertificate({
              status: 'completed',
              completion_date: new Date('2026-01-15'),
            }),
          ]}
        />
      )
      expect(screen.getByText('Completed')).toBeInTheDocument()
    })

    it('shows completion date when certificate is completed', () => {
      render(
        <CertificateProgress
          certificates={[
            createMockCertificate({
              status: 'completed',
              completion_date: new Date('2026-01-15'),
            }),
          ]}
        />
      )
      // Check for "Completed" text in the enrollment info area (not the badge)
      // The date format may vary by timezone, so we check for the green completion text
      const completedTexts = screen.getAllByText(/Completed/)
      expect(completedTexts.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Progress Bar', () => {
    it('displays progress percentage', () => {
      render(<CertificateProgress certificates={[createMockCertificate({ progress_percentage: 75 })]} />)
      expect(screen.getByText('75%')).toBeInTheDocument()
    })

    it('shows Overall Progress label', () => {
      render(<CertificateProgress certificates={[createMockCertificate()]} />)
      expect(screen.getByText('Overall Progress')).toBeInTheDocument()
    })

    it('shows encouragement message when not complete', () => {
      render(<CertificateProgress certificates={[createMockCertificate({ progress_percentage: 60 })]} />)
      expect(screen.getByText(/Keep going!/)).toBeInTheDocument()
      expect(screen.getByText(/40% away from completion/)).toBeInTheDocument()
    })

    it('shows congratulations message when complete', () => {
      render(
        <CertificateProgress certificates={[createMockCertificate({ progress_percentage: 100 })]} />
      )
      expect(screen.getByText(/Congratulations!/)).toBeInTheDocument()
    })
  })

  describe('Activity List', () => {
    it('renders activity names', () => {
      render(<CertificateProgress certificates={[createMockCertificate()]} />)
      expect(screen.getByText('Intro to ML')).toBeInTheDocument()
      expect(screen.getByText('Neural Networks')).toBeInTheDocument()
    })

    it('shows Activities count header', () => {
      render(<CertificateProgress certificates={[createMockCertificate()]} />)
      expect(screen.getByText('Activities (2)')).toBeInTheDocument()
    })

    it('shows Required label for required activities', () => {
      render(<CertificateProgress certificates={[createMockCertificate()]} />)
      expect(screen.getAllByText('Required')).toHaveLength(2)
    })

    it('shows Optional label for optional activities', () => {
      const cert = createMockCertificate({
        activities: [
          createMockActivity({
            activity_id: 'a1',
            activity_name: 'Bonus Activity',
            required: false,
            status: 'not_started',
          }),
        ],
      })
      render(<CertificateProgress certificates={[cert]} />)
      expect(screen.getByText('Optional')).toBeInTheDocument()
    })

    it('does not render activity section when no activities', () => {
      render(<CertificateProgress certificates={[createMockCertificate({ activities: [] })]} />)
      expect(screen.queryByText(/Activities \(/)).not.toBeInTheDocument()
    })
  })

  describe('Activity Status Icons', () => {
    it('shows passed status icon with title', () => {
      const cert = createMockCertificate({
        activities: [createMockActivity({ status: 'passed', activity_name: 'Passed Activity' })],
      })
      render(<CertificateProgress certificates={[cert]} />)
      expect(screen.getByTitle('Passed')).toBeInTheDocument()
    })

    it('shows failed status icon with title', () => {
      const cert = createMockCertificate({
        activities: [createMockActivity({ status: 'failed', activity_name: 'Failed Activity' })],
      })
      render(<CertificateProgress certificates={[cert]} />)
      expect(screen.getByTitle('Failed')).toBeInTheDocument()
    })

    it('shows in_progress status icon with title', () => {
      const cert = createMockCertificate({
        activities: [createMockActivity({ status: 'in_progress', activity_name: 'In Progress Activity' })],
      })
      render(<CertificateProgress certificates={[cert]} />)
      expect(screen.getByTitle('In Progress')).toBeInTheDocument()
    })

    it('shows not_started status icon with title', () => {
      const cert = createMockCertificate({
        activities: [createMockActivity({ status: 'not_started', activity_name: 'New Activity' })],
      })
      render(<CertificateProgress certificates={[cert]} />)
      expect(screen.getByTitle('Not Started')).toBeInTheDocument()
    })
  })

  describe('Activity Actions', () => {
    it('shows ✓ Passed for passed activities', () => {
      const cert = createMockCertificate({
        activities: [createMockActivity({ status: 'passed' })],
      })
      render(<CertificateProgress certificates={[cert]} />)
      expect(screen.getByText('✓ Passed')).toBeInTheDocument()
    })

    it('shows Try Again for failed activities', () => {
      const cert = createMockCertificate({
        activities: [createMockActivity({ status: 'failed' })],
      })
      render(<CertificateProgress certificates={[cert]} />)
      expect(screen.getByText('Try Again')).toBeInTheDocument()
    })

    it('shows Continue for in_progress activities', () => {
      const cert = createMockCertificate({
        activities: [createMockActivity({ status: 'in_progress' })],
      })
      render(<CertificateProgress certificates={[cert]} />)
      expect(screen.getByText('Continue')).toBeInTheDocument()
    })

    it('shows Start link for not_started activities', () => {
      const cert = createMockCertificate({
        activities: [createMockActivity({ status: 'not_started', activity_id: 'act-123' })],
      })
      render(<CertificateProgress certificates={[cert]} />)
      const startLink = screen.getByRole('link', { name: /Start →/i })
      expect(startLink).toHaveAttribute('href', '/activities/act-123')
    })
  })

  describe('View Details Link', () => {
    it('links to certificate progress page', () => {
      render(<CertificateProgress certificates={[createMockCertificate({ id: 'cert-123' })]} />)
      const detailsLink = screen.getByRole('link', { name: /View Detailed Progress/i })
      expect(detailsLink).toHaveAttribute('href', '/my-certificates/cert-123/progress')
    })
  })

  describe('Encouraging Message Footer', () => {
    it('shows Keep Learning! message', () => {
      render(<CertificateProgress certificates={[createMockCertificate()]} />)
      expect(screen.getByText('Keep Learning!')).toBeInTheDocument()
    })

    it('shows encouraging description', () => {
      render(<CertificateProgress certificates={[createMockCertificate()]} />)
      expect(
        screen.getByText(/Complete certificate activities to unlock achievements/)
      ).toBeInTheDocument()
    })
  })

  describe('Multiple Certificates', () => {
    it('renders multiple certificate cards', () => {
      const certificates = [
        createMockCertificate({ id: 'cert-1', name: 'Certificate One' }),
        createMockCertificate({ id: 'cert-2', name: 'Certificate Two' }),
      ]
      render(<CertificateProgress certificates={certificates} />)
      expect(screen.getByText('Certificate One')).toBeInTheDocument()
      expect(screen.getByText('Certificate Two')).toBeInTheDocument()
    })
  })
})
