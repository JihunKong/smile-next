import Link from 'next/link'

interface LeaderboardHeaderProps {
  activityId: string
  activityName: string
  title: string
  backLabel: string
}

export function LeaderboardHeader({
  activityId,
  activityName,
  title,
  backLabel,
}: LeaderboardHeaderProps) {
  return (
    <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold text-yellow-600 flex items-center gap-3">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            {title}
          </h1>
          <p className="text-gray-600 mt-2">{activityName}</p>
        </div>
        <Link
          href={`/activities/${activityId}/inquiry`}
          className="mt-4 md:mt-0 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors inline-flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {backLabel}
        </Link>
      </div>
    </div>
  )
}
