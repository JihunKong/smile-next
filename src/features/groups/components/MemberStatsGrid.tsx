'use client'

interface MemberStatsGridProps {
  ownerCount: number
  coOwnerCount: number
  adminCount: number
  memberCount: number
}

export function MemberStatsGrid({
  ownerCount,
  coOwnerCount,
  adminCount,
  memberCount,
}: MemberStatsGridProps) {
  return (
    <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-white rounded-lg shadow-md p-4 text-center">
        <p className="text-2xl font-bold text-yellow-600">{ownerCount}</p>
        <p className="text-sm text-gray-500">Owners</p>
      </div>
      <div className="bg-white rounded-lg shadow-md p-4 text-center">
        <p className="text-2xl font-bold text-blue-600">{coOwnerCount}</p>
        <p className="text-sm text-gray-500">Co-Owners</p>
      </div>
      <div className="bg-white rounded-lg shadow-md p-4 text-center">
        <p className="text-2xl font-bold text-purple-600">{adminCount}</p>
        <p className="text-sm text-gray-500">Admins</p>
      </div>
      <div className="bg-white rounded-lg shadow-md p-4 text-center">
        <p className="text-2xl font-bold text-gray-600">{memberCount}</p>
        <p className="text-sm text-gray-500">Members</p>
      </div>
    </div>
  )
}
