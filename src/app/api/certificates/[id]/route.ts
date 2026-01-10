import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    const certificate = await prisma.certificate.findUnique({
      where: { id },
      include: {
        activities: {
          include: {
            activity: {
              select: {
                id: true,
                name: true,
                description: true,
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
            studentCertificates: true,
          },
        },
      },
    })

    if (!certificate) {
      return NextResponse.json(
        { error: 'Certificate not found' },
        { status: 404 }
      )
    }

    // Check if user is enrolled
    let enrollment = null
    if (session?.user?.id) {
      const studentCertificate = await prisma.studentCertificate.findUnique({
        where: {
          certificateId_studentId: {
            certificateId: id,
            studentId: session.user.id,
          },
        },
      })

      if (studentCertificate) {
        enrollment = {
          isEnrolled: true,
          enrollmentId: studentCertificate.id,
          status: studentCertificate.status,
        }
      }
    }

    return NextResponse.json({ certificate, enrollment })
  } catch (error) {
    console.error('Failed to fetch certificate:', error)
    return NextResponse.json(
      { error: 'Failed to fetch certificate' },
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
 * PUT /api/certificates/[id]
 * Update a certificate
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user owns this certificate
    const existingCertificate = await prisma.certificate.findFirst({
      where: {
        id,
        creatorId: session.user.id,
      },
    })

    if (!existingCertificate) {
      return NextResponse.json(
        { error: 'Certificate not found or not authorized' },
        { status: 404 }
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
      status,
      activities,
    } = body

    // Build update data
    const updateData: Record<string, unknown> = {}

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Certificate name is required' },
          { status: 400 }
        )
      }
      updateData.name = name.trim()
    }

    if (organizationName !== undefined) updateData.organizationName = organizationName || null
    if (programName !== undefined) updateData.programName = programName || null
    if (signatoryName !== undefined) updateData.signatoryName = signatoryName || null
    if (certificateStatement !== undefined) updateData.certificateStatement = certificateStatement || null
    if (studentInstructions !== undefined) updateData.studentInstructions = studentInstructions || null
    if (logoPosition !== undefined) updateData.logoPosition = logoPosition
    if (qrCodeEnabled !== undefined) updateData.qrCodeEnabled = qrCodeEnabled
    if (qrCodePosition !== undefined) updateData.qrCodePosition = qrCodePosition

    // Handle status change
    if (status !== undefined) {
      const validStatuses = ['draft', 'pending_approval', 'approved', 'active', 'rejected', 'archived']
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status' },
          { status: 400 }
        )
      }
      updateData.status = status

      // Set timestamps based on status
      if (status === 'pending_approval' && existingCertificate.status !== 'pending_approval') {
        updateData.submittedAt = new Date()
      }
      if (status === 'approved' && existingCertificate.status !== 'approved') {
        updateData.approvedAt = new Date()
        updateData.approvedBy = session.user.id
      }
    }

    // Update certificate
    const certificate = await prisma.$transaction(async (tx) => {
      // Update activities if provided
      if (activities !== undefined && Array.isArray(activities)) {
        // Delete existing activities
        await tx.certificateActivity.deleteMany({
          where: { certificateId: id },
        })

        // Create new activities
        if (activities.length > 0) {
          await tx.certificateActivity.createMany({
            data: (activities as CertificateActivity[]).map((a, index) => ({
              certificateId: id,
              activityId: a.activityId,
              sequenceOrder: a.sequenceOrder ?? index,
              required: a.required ?? true,
            })),
          })
        }
      }

      // Update certificate
      return await tx.certificate.update({
        where: { id },
        data: updateData,
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
    })

    return NextResponse.json({ certificate })
  } catch (error) {
    console.error('Failed to update certificate:', error)
    return NextResponse.json(
      { error: 'Failed to update certificate' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/certificates/[id]
 * Delete a certificate (soft delete by setting status to archived)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user owns this certificate
    const existingCertificate = await prisma.certificate.findFirst({
      where: {
        id,
        creatorId: session.user.id,
      },
    })

    if (!existingCertificate) {
      return NextResponse.json(
        { error: 'Certificate not found or not authorized' },
        { status: 404 }
      )
    }

    // Archive the certificate instead of hard delete
    await prisma.certificate.update({
      where: { id },
      data: { status: 'archived' },
    })

    return NextResponse.json({ message: 'Certificate archived successfully' })
  } catch (error) {
    console.error('Failed to delete certificate:', error)
    return NextResponse.json(
      { error: 'Failed to delete certificate' },
      { status: 500 }
    )
  }
}
