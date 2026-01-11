import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

/**
 * GET /api/groups/my-teachable
 * Returns groups where the user has permission to create activities (role >= 1: Admin, Co-Owner, Owner)
 */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Find groups where user has role >= 1 (Admin, Co-Owner, Owner)
    const memberships = await prisma.groupUser.findMany({
      where: {
        userId: session.user.id,
        role: { gte: 1 }, // Admin (1), Co-Owner (2), Owner (3)
        group: {
          isDeleted: false,
        },
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        group: {
          name: 'asc',
        },
      },
    })

    const groups = memberships.map((m) => ({
      id: m.group.id,
      name: m.group.name,
      role: m.role,
    }))

    return NextResponse.json({ groups })
  } catch (error) {
    console.error('Failed to fetch teachable groups:', error)
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 })
  }
}
