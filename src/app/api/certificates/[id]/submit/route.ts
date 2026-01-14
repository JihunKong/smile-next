import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: certificateId } = await params

    // Get certificate and verify ownership
    const certificate = await prisma.certificate.findUnique({
      where: { id: certificateId },
      select: {
        id: true,
        status: true,
        creatorId: true,
        name: true,
      },
    })

    if (!certificate) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
    }

    // Only the creator can submit for approval
    if (certificate.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Can only submit if currently in draft status
    if (certificate.status !== 'draft') {
      return NextResponse.json(
        { error: `Cannot submit certificate with status: ${certificate.status}` },
        { status: 400 }
      )
    }

    // Update status to pending_approval
    const updatedCertificate = await prisma.certificate.update({
      where: { id: certificateId },
      data: {
        status: 'pending_approval',
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        status: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Certificate submitted for approval',
      certificate: updatedCertificate,
    })
  } catch (error) {
    console.error('Failed to submit certificate:', error)
    return NextResponse.json(
      { error: 'Failed to submit certificate for approval' },
      { status: 500 }
    )
  }
}
