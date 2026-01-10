import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    // Get all active certificates
    const certificates = await prisma.certificate.findMany({
      where: {
        status: 'active',
      },
      include: {
        _count: {
          select: {
            activities: true,
            studentCertificates: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ certificates })
  } catch (error) {
    console.error('Failed to fetch certificates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch certificates' },
      { status: 500 }
    )
  }
}

interface CertificateActivity {
  activityId: string
  sequenceOrder: number
  required: boolean
}

/**
 * POST /api/certificates
 * Create a new certificate
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is teacher or admin (roleId <= 2)
    if (session.user.roleId === undefined || session.user.roleId > 2) {
      return NextResponse.json(
        { error: 'You do not have permission to create certificates' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      name,
      organizationName,
      programName,
      signatoryName,
      certificateStatement,
      studentInstructions,
      logoPosition,
      qrCodeEnabled,
      qrCodePosition,
      status = 'draft',
      activities = [],
    } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Certificate name is required' },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses = ['draft', 'pending_approval', 'approved', 'active', 'rejected', 'archived']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Create certificate with activities
    const certificate = await prisma.certificate.create({
      data: {
        name: name.trim(),
        creatorId: session.user.id,
        organizationName: organizationName || null,
        programName: programName || null,
        signatoryName: signatoryName || null,
        certificateStatement: certificateStatement || null,
        studentInstructions: studentInstructions || null,
        logoPosition: logoPosition || 'top-left',
        qrCodeEnabled: qrCodeEnabled !== undefined ? qrCodeEnabled : true,
        qrCodePosition: qrCodePosition || 'bottom-right',
        status,
        submittedAt: status === 'pending_approval' ? new Date() : null,
        activities: {
          create: (activities as CertificateActivity[]).map((a, index) => ({
            activityId: a.activityId,
            sequenceOrder: a.sequenceOrder ?? index,
            required: a.required ?? true,
          })),
        },
      },
      include: {
        activities: {
          include: {
            activity: {
              select: {
                id: true,
                name: true,
                activityType: true,
              },
            },
          },
          orderBy: {
            sequenceOrder: 'asc',
          },
        },
        _count: {
          select: {
            activities: true,
            studentCertificates: true,
          },
        },
      },
    })

    return NextResponse.json({ certificate }, { status: 201 })
  } catch (error) {
    console.error('Failed to create certificate:', error)
    return NextResponse.json(
      { error: 'Failed to create certificate' },
      { status: 500 }
    )
  }
}
