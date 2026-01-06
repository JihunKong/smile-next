import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin (roleId 0 or 1)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { roleId: true },
    })

    if (!user || user.roleId > 1) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Get all stats in parallel
    const [
      totalUsers,
      activeUsers,
      totalGroups,
      totalActivities,
      totalCertificates,
      pendingCertificates,
      totalMessages,
    ] = await Promise.all([
      prisma.user.count({
        where: { isDeleted: false },
      }),
      prisma.user.count({
        where: {
          isDeleted: false,
          isBlocked: false,
          emailVerified: true,
        },
      }),
      prisma.group.count({
        where: { isDeleted: false },
      }),
      prisma.activity.count({
        where: { isDeleted: false },
      }),
      prisma.certificate.count(),
      prisma.certificate.count({
        where: { status: 'pending_approval' },
      }),
      prisma.message.count(),
    ])

    return NextResponse.json({
      totalUsers,
      activeUsers,
      totalGroups,
      totalActivities,
      totalCertificates,
      pendingCertificates,
      totalMessages,
    })
  } catch (error) {
    console.error('Failed to fetch admin stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
