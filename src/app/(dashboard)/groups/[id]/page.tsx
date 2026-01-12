import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { GroupDetailClient } from './group-detail-client'
import { getRoleLabel, getGradientColors, getGroupInitials, generateInviteCode } from '@/lib/groups/utils'
import { GroupRoles, type GroupRole } from '@/types/groups'

interface GroupDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function GroupDetailPage({ params }: GroupDetailPageProps) {
  const { id } = await params
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/auth/login')
  }

  const group = await prisma.group.findUnique({
    where: { id, isDeleted: false },
    include: {
      creator: {
        select: { id: true, firstName: true, lastName: true, username: true, avatarUrl: true, email: true },
      },
      members: {
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, username: true, avatarUrl: true, email: true },
          },
        },
        orderBy: { role: 'desc' },
      },
      _count: {
        select: {
          activities: { where: { isDeleted: false } },
        },
      },
    },
  })

  if (!group) {
    notFound()
  }

  // Fetch activities for this group
  const activities = await prisma.activity.findMany({
    where: {
      owningGroupId: id,
      isDeleted: false,
    },
    select: {
      id: true,
      name: true,
      description: true,
      mode: true,
      aiRatingEnabled: true,
      createdAt: true,
      creator: {
        select: { id: true, firstName: true, lastName: true, username: true, avatarUrl: true },
      },
      owningGroup: {
        select: { id: true, name: true, creatorId: true },
      },
      _count: {
        select: { questions: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Get total questions count for this group
  const questionsCount = await prisma.question.count({
    where: {
      activity: {
        owningGroupId: id,
        isDeleted: false,
      },
    },
  })

  // Get total likes count for this group
  const likesCount = await prisma.like.count({
    where: {
      question: {
        activity: {
          owningGroupId: id,
          isDeleted: false,
        },
      },
    },
  })

  // Check if user is a member
  const currentUserMembership = group.members.find((m) => m.userId === session.user.id)
  const userRole = currentUserMembership?.role as GroupRole | undefined

  // Non-members can only view public groups
  if (!currentUserMembership && group.isPrivate) {
    notFound()
  }

  const canManage = userRole === GroupRoles.OWNER || userRole === GroupRoles.CO_OWNER || userRole === GroupRoles.ADMIN

  // Auto-generate invite code if missing and user can manage
  let inviteCode = group.inviteCode
  if (!inviteCode && canManage) {
    const newCode = generateInviteCode()
    await prisma.group.update({
      where: { id },
      data: { inviteCode: newCode },
    })
    inviteCode = newCode
  }

  // Prepare data for client component
  const groupData = {
    id: group.id,
    name: group.name,
    description: group.description,
    isPrivate: group.isPrivate,
    inviteCode: inviteCode,
    createdAt: group.createdAt.toISOString(),
    groupImageUrl: group.groupImageUrl,
    autoIconGradient: group.autoIconGradient,
    creator: group.creator,
    members: group.members.map((m) => ({
      id: m.id,
      userId: m.userId,
      role: m.role,
      joinedAt: m.joinedAt.toISOString(),
      user: m.user,
    })),
    _count: group._count,
  }

  const activitiesData = activities.map((a) => ({
    id: a.id,
    name: a.name,
    description: a.description,
    mode: a.mode,
    aiRatingEnabled: a.aiRatingEnabled,
    createdAt: a.createdAt.toISOString(),
    creator: a.creator,
    owningGroup: a.owningGroup,
    _count: a._count,
  }))

  return (
    <GroupDetailClient
      group={groupData}
      activities={activitiesData}
      questionsCount={questionsCount}
      likesCount={likesCount}
      currentUserId={session.user.id}
      userRole={userRole}
      canManage={canManage}
    />
  )
}
