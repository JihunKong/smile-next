/**
 * CertificateFormFields Component
 *
 * Renders form input fields for certificate creation/editing.
 * Handles validation errors and required field indicators.
 */

'use client'

import type { CertificateFormData, CertificateFormErrors } from '../types'

export interface CertificateFormFieldsProps {
  /** Current form data */
  formData: CertificateFormData
  /** Validation errors */
  errors: CertificateFormErrors
  /** Called when a field value changes */
  onChange: (field: keyof Omit<CertificateFormData, 'activities'>, value: string) => void
  /** Whether form is disabled */
  disabled?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Form field wrapper with label and error display
 */
function FormField({
  label,
  required,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}

export function CertificateFormFields({
  formData,
  errors,
  onChange,
  disabled = false,
  className = '',
}: CertificateFormFieldsProps) {
  const inputClasses = (hasError: boolean) =>
    `w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#8C1515] focus:border-transparent outline-none transition ${
      hasError ? 'border-red-500' : 'border-gray-300'
    } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`

  const textareaClasses = (hasError: boolean) =>
    `w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#8C1515] focus:border-transparent outline-none transition resize-none ${
      hasError ? 'border-red-500' : 'border-gray-300'
    } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`

  return (
    <div className={`space-y-4 ${className}`}>
      {/* General Error */}
      {errors.general && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {errors.general}
        </div>
      )}

      {/* Certificate Name */}
      <FormField label="Certificate Name" required error={errors.name}>
        <input
          type="text"
          id="name"
          aria-label="Certificate Name"
          value={formData.name}
          onChange={(e) => onChange('name', e.target.value)}
          disabled={disabled}
          placeholder="e.g., Web Development Certificate"
          className={inputClasses(!!errors.name)}
        />
      </FormField>

      {/* Organization Name */}
      <FormField label="Organization Name" required error={errors.organizationName}>
        <input
          type="text"
          id="organizationName"
          aria-label="Organization Name"
          value={formData.organizationName}
          onChange={(e) => onChange('organizationName', e.target.value)}
          disabled={disabled}
          placeholder="e.g., Tech Academy"
          className={inputClasses(!!errors.organizationName)}
        />
      </FormField>

      {/* Program Name */}
      <FormField label="Program Name">
        <input
          type="text"
          id="programName"
          aria-label="Program Name"
          value={formData.programName}
          onChange={(e) => onChange('programName', e.target.value)}
          disabled={disabled}
          placeholder="e.g., Full Stack Development Program"
          className={inputClasses(false)}
        />
      </FormField>

      {/* Signatory Name */}
      <FormField label="Signatory Name">
        <input
          type="text"
          id="signatoryName"
          aria-label="Signatory Name"
          value={formData.signatoryName}
          onChange={(e) => onChange('signatoryName', e.target.value)}
          disabled={disabled}
          placeholder="e.g., Dr. Jane Smith, Director"
          className={inputClasses(false)}
        />
      </FormField>

      {/* Certificate Statement */}
      <FormField label="Certificate Statement">
        <textarea
          id="certificateStatement"
          aria-label="Certificate Statement"
          value={formData.certificateStatement}
          onChange={(e) => onChange('certificateStatement', e.target.value)}
          disabled={disabled}
          rows={3}
          placeholder="This certifies that the student has successfully completed..."
          className={textareaClasses(false)}
        />
      </FormField>

      {/* Student Instructions */}
      <FormField label="Student Instructions">
        <textarea
          id="studentInstructions"
          aria-label="Student Instructions"
          value={formData.studentInstructions}
          onChange={(e) => onChange('studentInstructions', e.target.value)}
          disabled={disabled}
          rows={3}
          placeholder="Complete all required activities to earn this certificate..."
          className={textareaClasses(false)}
        />
      </FormField>
    </div>
  )
}
