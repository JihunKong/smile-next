/**
 * Certificate Feature Types
 *
 * Shared type definitions for the certificates feature module.
 * Extracted from existing pages to enable code reuse across components and hooks.
 */

// =============================================================================
// Certificate Core Types
// =============================================================================

export type CertificateStatus = 'draft' | 'published' | 'archived'

export type SortOption = 'newest' | 'popular' | 'name'

export type EnrollmentStatus = 'enrolled' | 'in_progress' | 'completed' | 'expired'

export type ActivityProgressStatus = 'not_started' | 'in_progress' | 'completed'

// =============================================================================
// Certificate Data Types
// =============================================================================

/**
 * Certificate as returned from browse/list APIs
 */
export interface Certificate {
  id: string
  name: string
  organizationName: string | null
  programName: string | null
  certificateStatement: string | null
  studentInstructions: string | null
  signatoryName: string | null
  logoImageUrl: string | null
  backgroundImageUrl: string | null
  qrPosition: string | null
  logoPosition: string | null
  status: CertificateStatus
  createdAt: string
  updatedAt: string
  createdById: string
  _count: {
    activities: number
    studentCertificates: number
  }
  isEnrolled?: boolean
  enrollmentStatus?: EnrollmentStatus
}

/**
 * Certificate with full details including activities
 */
export interface CertificateDetails extends Certificate {
  activities: CertificateActivity[]
  badges?: CertificateBadge[]
  creator?: {
    id: string
    name: string | null
    email: string
  }
}

/**
 * Activity linked to a certificate
 */
export interface CertificateActivity {
  id: string
  activityId: string
  certificateId: string
  sequenceOrder: number
  required: boolean
  activity: {
    id: string
    name: string
    description: string | null
    activityType: string
    owningGroupId: string
    owningGroup?: {
      id: string
      name: string
    } | null
  }
}

/**
 * Badge placed on certificate design
 */
export interface CertificateBadge {
  id: string
  badgeType: string
  positionX: number
  positionY: number
  width: number
  height: number
}

// =============================================================================
// Activity Types (for selection)
// =============================================================================

/**
 * Activity available for selection
 */
export interface Activity {
  id: string
  name: string
  description: string | null
  activityType: string
  owningGroup: {
    id: string
    name: string
  } | null
}

/**
 * Selected activity in certificate form
 */
export interface SelectedActivity {
  activityId: string
  name: string
  activityType: string
  sequenceOrder: number
  required: boolean
}

// =============================================================================
// Progress Types
// =============================================================================

/**
 * Activity progress within a certificate enrollment
 */
export interface ActivityProgress {
  id: string
  activity: {
    id: string
    name: string
    description: string | null
    activityType: string
    owningGroupId: string
  }
  sequenceOrder: number
  required: boolean
  status: ActivityProgressStatus
  score?: number
  completedAt?: string
}

/**
 * User's certificate enrollment progress
 */
export interface CertificateProgress {
  id: string
  status: EnrollmentStatus
  enrollmentDate: string
  completionDate: string | null
  verificationCode: string
  certificate: {
    id: string
    name: string
    organizationName: string | null
    programName: string | null
    certificateStatement: string | null
    logoImageUrl: string | null
  }
  activities: ActivityProgress[]
  progress: {
    completed: number
    inProgress: number
    notStarted: number
    total: number
    percentage: number
  }
}

/**
 * Student certificate enrollment for list view (my-certificates page)
 */
export interface StudentCertificateEnrollment {
  id: string
  status: EnrollmentStatus | string
  enrollmentDate: string
  completionDate: string | null
  verificationCode: string
  certificate: {
    id: string
    name: string
    organizationName: string | null
    logoImageUrl: string | null
    _count: {
      activities: number
    }
  }
  progress: {
    completed: number
    total: number
    percentage: number
  }
}

// =============================================================================
// Form Types
// =============================================================================

/**
 * Certificate form data for create/edit
 */
export interface CertificateFormData {
  name: string
  organizationName: string
  programName: string
  signatoryName: string
  certificateStatement: string
  studentInstructions: string
  activities: SelectedActivity[]
}

/**
 * Certificate designer form data
 */
export interface CertificateDesignerData {
  logoImageUrl: string | null
  backgroundImageUrl: string | null
  logoPosition: 'top-left' | 'top-center' | 'top-right'
  qrPosition: 'bottom-left' | 'bottom-center' | 'bottom-right'
  badges: CertificateBadge[]
}

// =============================================================================
// API Response Types
// =============================================================================

/**
 * Paginated certificates response
 */
export interface CertificatesResponse {
  certificates: Certificate[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

/**
 * Single certificate response
 */
export interface CertificateResponse {
  certificate: CertificateDetails
}

/**
 * Certificate progress response
 */
export interface CertificateProgressResponse {
  progress: CertificateProgress
}

// =============================================================================
// Filter/Sort Types
// =============================================================================

/**
 * Certificate filter options
 */
export interface CertificateFilterOptions {
  search?: string
  status?: CertificateStatus | 'all'
  sortBy?: SortOption
  page?: number
  limit?: number
}

// =============================================================================
// Validation Types
// =============================================================================

/**
 * Form validation errors
 */
export interface CertificateFormErrors {
  name?: string
  organizationName?: string
  activities?: string
  general?: string
}
