'use client'

interface ActivityStatsCardProps {
  questionCount: number
  memberCount: number
  likeCount: number
  isPrivate: boolean
}

export function ActivityStatsCard({
  questionCount,
  memberCount,
  likeCount,
  isPrivate,
}: ActivityStatsCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="grid grid-cols-4 divide-x divide-gray-200">
        {/* Questions */}
        <div className="p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-gray-900">{questionCount}</p>
          <p className="text-xs text-gray-500">Questions</p>
        </div>

        {/* Members */}
        <div className="p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-gray-900">{memberCount}</p>
          <p className="text-xs text-gray-500">Members</p>
        </div>

        {/* Likes */}
        <div className="p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-gray-900">{likeCount}</p>
          <p className="text-xs text-gray-500">Likes</p>
        </div>

        {/* Visibility */}
        <div className="p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            {isPrivate ? (
              <svg className="w-6 h-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <p className="text-lg font-bold text-gray-900">{isPrivate ? 'Private' : 'Public'}</p>
          <p className="text-xs text-gray-500">Visibility</p>
        </div>
      </div>
    </div>
  )
}
