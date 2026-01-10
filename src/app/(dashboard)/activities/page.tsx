import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ActivitiesClient } from './activities-client'
import type { ActivityWithGroup } from '@/types/activities'

export default async function ActivitiesPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/auth/login')
  }

  // Get activities from all groups the user is a member of
  const activities = await prisma.activity.findMany({
    where: {
      isDeleted: false,
      owningGroup: {
        isDeleted: false,
        members: {
          some: { userId: session.user.id },
        },
      },
    },
    include: {
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
    take: 20, // Initial page limit
  })

  // Get total count for pagination
  const totalCount = await prisma.activity.count({
    where: {
      isDeleted: false,
      owningGroup: {
        isDeleted: false,
        members: {
          some: { userId: session.user.id },
        },
      },
    },
  })

  // Get groups where user can create activities (admin or higher)
  const groups = await prisma.group.findMany({
    where: {
      isDeleted: false,
      members: {
        some: {
          userId: session.user.id,
          role: { gte: 2 }, // Admin or higher
        },
      },
    },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-[var(--stanford-cardinal)] to-[var(--stanford-pine)] text-white py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Activities</h1>
              <p className="text-white/80 mt-1">View and participate in learning activities</p>
            </div>

            {groups.length > 0 && (
              <div className="relative group">
                <button className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-900 font-medium rounded-lg hover:bg-gray-100 transition">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Activity
                </button>
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  <div className="py-2">
                    <p className="px-4 py-2 text-xs text-gray-500 font-medium">Select a group</p>
                    {groups.map((group) => (
                      <Link
                        key={group.id}
                        href={`/groups/${group.id}/activities/create`}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        {group.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Client-side search/filter component */}
      <ActivitiesClient
        initialActivities={activities as ActivityWithGroup[]}
        groups={groups}
        initialTotalCount={totalCount}
      />
    </div>
  )
}
