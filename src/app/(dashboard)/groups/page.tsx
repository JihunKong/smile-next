import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'
import { GroupCard } from '@/components/groups/GroupCard'
import { GroupRoles, type GroupRole } from '@/types/groups'

export default async function GroupsPage() {
  const session = await auth()
  const userId = session?.user?.id

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
            select: { members: true, activities: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    : []

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
        select: { members: true, activities: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">My Groups</h1>
              <p className="text-white/80 mt-1">Manage your learning groups</p>
            </div>
            <Link
              href="/groups/create"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Create Group
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* My Groups Section */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            My Groups ({myGroups.length})
          </h2>

          {myGroups.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No groups yet</h3>
              <p className="text-gray-500 mb-4">
                Create a new group or join an existing one to get started.
              </p>
              <Link
                href="/groups/create"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--stanford-cardinal)] text-white font-semibold rounded-lg hover:opacity-90 transition"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Create Your First Group
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {myGroups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  userRole={(group.members[0]?.role ?? 0) as GroupRole}
                  isMember={true}
                />
              ))}
            </div>
          )}
        </section>

        {/* Public Groups Section */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Discover Public Groups ({publicGroups.length})
          </h2>

          {publicGroups.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No public groups available</h3>
              <p className="text-gray-500">Check back later for new groups to join.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {publicGroups.map((group) => (
                <GroupCard key={group.id} group={group} isMember={false} />
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  )
}
