import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: certificateId } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin (roleId 0 or 1)
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { roleId: true },
    })

    if (!currentUser || currentUser.roleId > 1) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Get certificate
    const certificate = await prisma.certificate.findUnique({
      where: { id: certificateId },
      select: { status: true },
    })

    if (!certificate) {
      return NextResponse.json(
        { error: 'Certificate not found' },
        { status: 404 }
      )
    }

    if (certificate.status !== 'pending_approval') {
      return NextResponse.json(
        { error: 'Certificate is not pending approval' },
        { status: 400 }
      )
    }

    const updatedCertificate = await prisma.certificate.update({
      where: { id: certificateId },
      data: {
        status: 'active',
        approvedAt: new Date(),
        approvedBy: session.user.id,
      },
      select: {
        id: true,
        name: true,
        status: true,
      },
    })

    return NextResponse.json({
      success: true,
      certificate: updatedCertificate,
    })
  } catch (error) {
    console.error('Failed to approve certificate:', error)
    return NextResponse.json(
      { error: 'Failed to approve certificate' },
      { status: 500 }
    )
  }
}
