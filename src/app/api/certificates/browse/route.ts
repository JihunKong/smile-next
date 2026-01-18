import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { Prisma } from '@prisma/client'

/**
 * GET /api/certificates/browse
 * List active certificates with search, filter, and pagination
 *
 * Query params:
 * - q: Search query (searches name and organizationName)
 * - sort: 'newest' | 'popular' | 'name' (default: 'newest')
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 12)
 *
 * Returns: certificates with enrollment status for current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const searchParams = request.nextUrl.searchParams

    const q = searchParams.get('q') || ''
    const sort = searchParams.get('sort') || 'newest'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12')))

    const skip = (page - 1) * limit

    // Build where clause - only show active certificates
    const where: Prisma.CertificateWhereInput = {
      status: 'active',
    }

    // Search by name or organization
    if (q.trim()) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { organizationName: { contains: q, mode: 'insensitive' } },
        { programName: { contains: q, mode: 'insensitive' } },
      ]
    }

    // Build orderBy clause
    type OrderByInput = Prisma.CertificateOrderByWithRelationInput
    let orderBy: OrderByInput | OrderByInput[]

    switch (sort) {
      case 'popular':
        orderBy = { studentCertificates: { _count: 'desc' } }
        break
      case 'name':
        orderBy = { name: 'asc' }
        break
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' }
        break
    }

    // Fetch certificates
    const [certificates, totalCount] = await Promise.all([
      prisma.certificate.findMany({
        where,
        include: {
          _count: {
            select: {
              activities: true,
              studentCertificates: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.certificate.count({ where }),
    ])

    // If user is logged in, check enrollment status for each certificate
    const enrollmentMap: Map<string, { isEnrolled: boolean; status: string }> = new Map()

    if (session?.user?.id) {
      const enrollments = await prisma.studentCertificate.findMany({
        where: {
          studentId: session.user.id,
          certificateId: {
            in: certificates.map((c) => c.id),
          },
        },
        select: {
          certificateId: true,
          status: true,
        },
      })

      enrollments.forEach((e) => {
        enrollmentMap.set(e.certificateId, {
          isEnrolled: true,
          status: e.status,
        })
      })
    }

    // Add enrollment info to certificates
    const certificatesWithEnrollment = certificates.map((cert) => {
      const enrollment = enrollmentMap.get(cert.id)
      return {
        ...cert,
        isEnrolled: enrollment?.isEnrolled || false,
        enrollmentStatus: enrollment?.status || null,
      }
    })

    return NextResponse.json({
      certificates: certificatesWithEnrollment,
      pagination: {
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit,
        hasMore: page * limit < totalCount,
      },
    })
  } catch (error) {
    console.error('Failed to browse certificates:', error)
    return NextResponse.json(
      { error: 'Failed to browse certificates' },
      { status: 500 }
    )
  }
}
