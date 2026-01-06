import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
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

    const searchParams = request.nextUrl.searchParams
    const filter = searchParams.get('filter') || 'all'

    // Build where clause based on filter
    const where: Record<string, unknown> = {}

    switch (filter) {
      case 'pending':
        where.status = 'pending_approval'
        break
      case 'active':
        where.status = 'active'
        break
      case 'rejected':
        where.status = 'rejected'
        break
      case 'draft':
        where.status = 'draft'
        break
      // 'all' - no filter
    }

    const certificates = await prisma.certificate.findMany({
      where,
      select: {
        id: true,
        name: true,
        organizationName: true,
        status: true,
        creatorId: true,
        createdAt: true,
        submittedAt: true,
        _count: {
          select: {
            activities: true,
            studentCertificates: true,
          },
        },
        creator: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' }, // pending_approval comes first alphabetically
        { submittedAt: 'desc' },
        { createdAt: 'desc' },
      ],
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
