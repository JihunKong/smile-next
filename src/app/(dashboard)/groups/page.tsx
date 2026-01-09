import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { GroupsClient } from './groups-client'

// Role IDs: 0=Super Admin, 1=Admin, 2=Teacher, 3=Student
const ROLE_SUPER_ADMIN = 0
const ROLE_ADMIN = 1

export default async function GroupsPage() {
  const session = await auth()
  const userId = session?.user?.id
  const userRoleId = (session?.user as { roleId?: number })?.roleId

  // Check if user is admin
  const isAdmin = userRoleId === ROLE_SUPER_ADMIN || userRoleId === ROLE_ADMIN

  // Fetch user's groups (where they are a member)
  const myGroups = userId
    ? await prisma.group.findMany({
        where: {
          isDeleted: false,
          members: {
            some: { userId },
          },
        },
        include: {
          creator: {
            select: { id: true, firstName: true, lastName: true },
          },
          members: {
            where: { userId },
            select: { role: true },
            take: 1,
          },
          _count: {
            select: {
              members: true,
              activities: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    : []

  // Get questions count for each group
  const myGroupsWithQuestions = await Promise.all(
    myGroups.map(async (group) => {
      const questionsCount = await prisma.question.count({
        where: {
          isDeleted: false,
          activity: {
            owningGroupId: group.id,
            isDeleted: false,
          },
        },
      })
      return {
        ...group,
        _count: {
          ...group._count,
          questions: questionsCount,
        },
      }
    })
  )

  // Fetch public groups (that user is not already a member of)
  const myGroupIds = myGroups.map((g) => g.id)
  const publicGroups = await prisma.group.findMany({
    where: {
      isDeleted: false,
      isPrivate: false,
      id: { notIn: myGroupIds },
    },
    include: {
      creator: {
        select: { id: true, firstName: true, lastName: true },
      },
      _count: {
        select: {
          members: true,
          activities: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  // Get questions count for public groups
  const publicGroupsWithQuestions = await Promise.all(
    publicGroups.map(async (group) => {
      const questionsCount = await prisma.question.count({
        where: {
          isDeleted: false,
          activity: {
            owningGroupId: group.id,
            isDeleted: false,
          },
        },
      })
      return {
        ...group,
        _count: {
          ...group._count,
          questions: questionsCount,
        },
      }
    })
  )

  return (
    <GroupsClient
      initialMyGroups={JSON.parse(JSON.stringify(myGroupsWithQuestions))}
      initialPublicGroups={JSON.parse(JSON.stringify(publicGroupsWithQuestions))}
      isAdmin={isAdmin}
    />
  )
}
