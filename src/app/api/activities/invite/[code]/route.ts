import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { code } = await params

  try {
    const activity = await prisma.activity.findFirst({
      where: {
        publicSharingCode: code,
        isDeleted: false,
        visible: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        educationLevel: true,
        schoolSubject: true,
        owningGroup: {
          select: {
            id: true,
            name: true,
            isPrivate: true,
          },
        },
      },
    })

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: activity.id,
      name: activity.name,
      description: activity.description,
      educationLevel: activity.educationLevel,
      schoolSubject: activity.schoolSubject,
      group: {
        id: activity.owningGroup.id,
        name: activity.owningGroup.name,
        isPrivate: activity.owningGroup.isPrivate,
      },
    })
  } catch (error) {
    console.error('Failed to fetch activity by invite code:', error)
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 })
  }
}
