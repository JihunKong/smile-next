import type { LeaderboardEntry } from '../types'

interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
  currentUserId: string
  labels: {
    rank: string
    student: string
    qualityScore: string
    status: string
    questions: string
    bloomLevel: string
    time: string
    date: string
    passed: string
    failed: string
    you: string
    noAttempts: string
    beFirst: string
  }
}

export function LeaderboardTable({
  entries,
  currentUserId,
  labels,
}: LeaderboardTableProps) {
  return (
    <div className="bg-white rounded-lg shadow-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead style={{ backgroundColor: '#ca8a04' }}>
            <tr>
              <th className="px-3 py-3 text-left text-xs font-semibold text-white">{labels.rank}</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-white">{labels.student}</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-white">{labels.qualityScore}</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-white">{labels.status}</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-white">{labels.questions}</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-white">{labels.bloomLevel}</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-white">{labels.time}</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-white">{labels.date}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {entries.map((entry) => (
              <tr
                key={`${entry.rank}-${entry.qualityScore}`}
                className={`hover:bg-gray-50 transition-colors ${
                  entry.userId === currentUserId ? 'bg-blue-50' : ''
                }`}
              >
                <td className="px-3 py-3">
                  <span className="text-sm font-bold text-gray-600">#{entry.rank}</span>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-white font-bold mr-3">
                      {entry.userName[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {entry.userName}
                        {entry.userId === currentUserId && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full ml-1">{labels.you}</span>
                        )}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 text-center">
                  <div className="flex flex-col items-center">
                    <span className={`text-lg font-bold ${entry.passed ? 'text-green-600' : 'text-red-600'}`}>
                      {entry.qualityPercentage.toFixed(1)}%
                    </span>
                    <span className="text-xs text-gray-500">({entry.qualityScore.toFixed(1)}/10)</span>
                  </div>
                </td>
                <td className="px-3 py-3 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    entry.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {entry.passed ? (
                      <>
                        <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {labels.passed}
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        {labels.failed}
                      </>
                    )}
                  </span>
                </td>
                <td className="px-3 py-3 text-center">
                  <span className="text-sm font-medium text-gray-700">
                    {entry.questionsGenerated}/{entry.questionsRequired}
                  </span>
                </td>
                <td className="px-3 py-3 text-center">
                  <span className="text-sm font-medium text-gray-700">
                    {entry.avgBloomLevel.toFixed(1)}
                  </span>
                </td>
                <td className="px-3 py-3 text-center">
                  <span className="text-sm text-gray-600">{entry.timeTaken}</span>
                </td>
                <td className="px-3 py-3 text-center">
                  <span className="text-xs text-gray-500">
                    {entry.submittedAt
                      ? new Date(entry.submittedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'N/A'}
                  </span>
                </td>
              </tr>
            ))}

            {entries.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center">
                  <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <p className="text-gray-500 text-lg">{labels.noAttempts}</p>
                  <p className="text-gray-400 text-sm mt-2">{labels.beFirst}</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
