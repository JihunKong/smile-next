/**
 * Certificate Hooks
 *
 * Custom React hooks for certificate data fetching and state management.
 */

export { useCertificates } from './useCertificates'
export type { UseCertificatesOptions, UseCertificatesReturn } from './useCertificates'

export { useCertificate } from './useCertificate'
export type { UseCertificateReturn } from './useCertificate'

export { useCertificateProgress } from './useCertificateProgress'
export type {
  UseCertificateProgressOptions,
  UseCertificateProgressReturn,
} from './useCertificateProgress'

export { useCertificateForm } from './useCertificateForm'
export type {
  UseCertificateFormOptions,
  UseCertificateFormReturn,
  AddActivityInput,
} from './useCertificateForm'

// Future hooks:
// export { useCertificateDesigner } from './useCertificateDesigner'
