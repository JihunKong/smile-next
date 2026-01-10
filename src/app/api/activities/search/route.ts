import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const q = searchParams.get('q') || ''
    const creator = searchParams.get('creator') || ''
    const group = searchParams.get('group') || ''
    const mode = searchParams.get('mode')
    const sort = searchParams.get('sort') || 'createdAt'
    const order = searchParams.get('order') || 'desc'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const skip = (page - 1) * limit

    // Build where clause
    const where: Prisma.ActivityWhereInput = {
      isDeleted: false,
      owningGroup: {
        isDeleted: false,
        members: {
          some: { userId: session.user.id },
        },
      },
    }

    // Search by name, description, topic, or schoolSubject
    if (q.trim()) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { topic: { contains: q, mode: 'insensitive' } },
        { schoolSubject: { contains: q, mode: 'insensitive' } },
      ]
    }

    // Filter by creator name
    if (creator.trim()) {
      where.creator = {
        OR: [
          { firstName: { contains: creator, mode: 'insensitive' } },
          { lastName: { contains: creator, mode: 'insensitive' } },
          { username: { contains: creator, mode: 'insensitive' } },
        ],
      }
    }

    // Filter by group name
    if (group.trim()) {
      where.owningGroup = {
        ...where.owningGroup as Prisma.GroupWhereInput,
        name: { contains: group, mode: 'insensitive' },
      }
    }

    // Filter by activity mode
    if (mode !== null && mode !== '' && mode !== 'all') {
      const modeInt = parseInt(mode)
      if (!isNaN(modeInt)) {
        where.mode = modeInt
      }
    }

    // Build orderBy clause
    type OrderByInput = Prisma.ActivityOrderByWithRelationInput
    let orderBy: OrderByInput | OrderByInput[]

    const orderDirection = order === 'asc' ? 'asc' : 'desc'

    switch (sort) {
      case 'name':
        orderBy = { name: orderDirection }
        break
      case 'questions_count':
        orderBy = { questions: { _count: orderDirection } }
        break
      case 'createdAt':
      default:
        orderBy = { createdAt: orderDirection }
        break
    }

    const [activities, totalCount] = await Promise.all([
      prisma.activity.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              avatarUrl: true
            },
          },
          owningGroup: {
            select: {
              id: true,
              name: true,
              creatorId: true
            },
          },
          _count: {
            select: { questions: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.activity.count({ where }),
    ])

    return NextResponse.json({
      activities,
      pagination: {
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit,
        hasMore: page * limit < totalCount,
      },
    })
  } catch (error) {
    console.error('Failed to search activities:', error)
    return NextResponse.json(
      { error: 'Failed to search activities' },
      { status: 500 }
    )
  }
}
