/**
 * CertificateFormFields Component Tests
 *
 * TDD tests for the CertificateFormFields component that renders
 * form input fields for certificate creation/editing.
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CertificateFormFields } from '@/features/certificates/components/CertificateFormFields'
import type { CertificateFormData, CertificateFormErrors } from '@/features/certificates/types'

const mockFormData: CertificateFormData = {
  name: 'Web Development Certificate',
  organizationName: 'Tech Academy',
  programName: 'Full Stack Program',
  signatoryName: 'John Doe',
  certificateStatement: 'This certifies that the student has completed...',
  studentInstructions: 'Complete all activities to earn this certificate.',
  activities: [],
}

const mockErrors: CertificateFormErrors = {}

describe('CertificateFormFields', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // Rendering Tests
  // ===========================================================================

  describe('Rendering', () => {
    it('renders name field', () => {
      render(
        <CertificateFormFields
          formData={mockFormData}
          errors={mockErrors}
          onChange={vi.fn()}
        />
      )

      expect(screen.getByLabelText(/certificate name/i)).toBeInTheDocument()
    })

    it('renders organization name field', () => {
      render(
        <CertificateFormFields
          formData={mockFormData}
          errors={mockErrors}
          onChange={vi.fn()}
        />
      )

      expect(screen.getByLabelText(/organization/i)).toBeInTheDocument()
    })

    it('renders program name field', () => {
      render(
        <CertificateFormFields
          formData={mockFormData}
          errors={mockErrors}
          onChange={vi.fn()}
        />
      )

      expect(screen.getByLabelText(/program/i)).toBeInTheDocument()
    })

    it('renders signatory name field', () => {
      render(
        <CertificateFormFields
          formData={mockFormData}
          errors={mockErrors}
          onChange={vi.fn()}
        />
      )

      expect(screen.getByLabelText(/signatory/i)).toBeInTheDocument()
    })

    it('renders certificate statement field', () => {
      render(
        <CertificateFormFields
          formData={mockFormData}
          errors={mockErrors}
          onChange={vi.fn()}
        />
      )

      expect(screen.getByLabelText(/certificate statement/i)).toBeInTheDocument()
    })

    it('renders student instructions field', () => {
      render(
        <CertificateFormFields
          formData={mockFormData}
          errors={mockErrors}
          onChange={vi.fn()}
        />
      )

      expect(screen.getByLabelText(/student instructions/i)).toBeInTheDocument()
    })

    it('displays form values correctly', () => {
      render(
        <CertificateFormFields
          formData={mockFormData}
          errors={mockErrors}
          onChange={vi.fn()}
        />
      )

      expect(screen.getByDisplayValue('Web Development Certificate')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Tech Academy')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Full Stack Program')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // Change Handling Tests
  // ===========================================================================

  describe('Change Handling', () => {
    it('calls onChange with name when name is changed', () => {
      const onChange = vi.fn()

      render(
        <CertificateFormFields
          formData={mockFormData}
          errors={mockErrors}
          onChange={onChange}
        />
      )

      fireEvent.change(screen.getByLabelText(/certificate name/i), {
        target: { value: 'New Name' },
      })

      expect(onChange).toHaveBeenCalledWith('name', 'New Name')
    })

    it('calls onChange with organizationName when org is changed', () => {
      const onChange = vi.fn()

      render(
        <CertificateFormFields
          formData={mockFormData}
          errors={mockErrors}
          onChange={onChange}
        />
      )

      fireEvent.change(screen.getByLabelText(/organization/i), {
        target: { value: 'New Org' },
      })

      expect(onChange).toHaveBeenCalledWith('organizationName', 'New Org')
    })

    it('calls onChange with programName when program is changed', () => {
      const onChange = vi.fn()

      render(
        <CertificateFormFields
          formData={mockFormData}
          errors={mockErrors}
          onChange={onChange}
        />
      )

      fireEvent.change(screen.getByLabelText(/program/i), {
        target: { value: 'New Program' },
      })

      expect(onChange).toHaveBeenCalledWith('programName', 'New Program')
    })

    it('calls onChange with certificateStatement when statement is changed', () => {
      const onChange = vi.fn()

      render(
        <CertificateFormFields
          formData={mockFormData}
          errors={mockErrors}
          onChange={onChange}
        />
      )

      fireEvent.change(screen.getByLabelText(/certificate statement/i), {
        target: { value: 'New statement' },
      })

      expect(onChange).toHaveBeenCalledWith('certificateStatement', 'New statement')
    })
  })

  // ===========================================================================
  // Error Display Tests
  // ===========================================================================

  describe('Error Display', () => {
    it('shows error for name field', () => {
      const errors: CertificateFormErrors = {
        name: 'Certificate name is required',
      }

      render(
        <CertificateFormFields
          formData={{ ...mockFormData, name: '' }}
          errors={errors}
          onChange={vi.fn()}
        />
      )

      expect(screen.getByText('Certificate name is required')).toBeInTheDocument()
    })

    it('shows error for organizationName field', () => {
      const errors: CertificateFormErrors = {
        organizationName: 'Organization name is required',
      }

      render(
        <CertificateFormFields
          formData={{ ...mockFormData, organizationName: '' }}
          errors={errors}
          onChange={vi.fn()}
        />
      )

      expect(screen.getByText('Organization name is required')).toBeInTheDocument()
    })

    it('applies error styling to field with error', () => {
      const errors: CertificateFormErrors = {
        name: 'Certificate name is required',
      }

      render(
        <CertificateFormFields
          formData={{ ...mockFormData, name: '' }}
          errors={errors}
          onChange={vi.fn()}
        />
      )

      const input = screen.getByLabelText(/certificate name/i)
      expect(input).toHaveClass('border-red-500')
    })

    it('shows general error message', () => {
      const errors: CertificateFormErrors = {
        general: 'Something went wrong',
      }

      render(
        <CertificateFormFields
          formData={mockFormData}
          errors={errors}
          onChange={vi.fn()}
        />
      )

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // Required Field Indicators Tests
  // ===========================================================================

  describe('Required Fields', () => {
    it('shows required indicator for name field', () => {
      render(
        <CertificateFormFields
          formData={mockFormData}
          errors={mockErrors}
          onChange={vi.fn()}
        />
      )

      const label = screen.getByText(/certificate name/i)
      expect(label.closest('label')?.querySelector('.text-red-500')).toBeInTheDocument()
    })

    it('shows required indicator for organization field', () => {
      render(
        <CertificateFormFields
          formData={mockFormData}
          errors={mockErrors}
          onChange={vi.fn()}
        />
      )

      const label = screen.getByText(/organization/i)
      expect(label.closest('label')?.querySelector('.text-red-500')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // Disabled State Tests
  // ===========================================================================

  describe('Disabled State', () => {
    it('disables all fields when disabled prop is true', () => {
      render(
        <CertificateFormFields
          formData={mockFormData}
          errors={mockErrors}
          onChange={vi.fn()}
          disabled
        />
      )

      expect(screen.getByLabelText(/certificate name/i)).toBeDisabled()
      expect(screen.getByLabelText(/organization/i)).toBeDisabled()
      expect(screen.getByLabelText(/program/i)).toBeDisabled()
    })
  })
})
