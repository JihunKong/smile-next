import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function MyQuestionsPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/auth/login')
  }

  const questions = await prisma.question.findMany({
    where: {
      creatorId: session.user.id,
      isDeleted: false,
    },
    include: {
      activity: {
        select: {
          id: true,
          name: true,
          owningGroup: {
            select: { id: true, name: true },
          },
        },
      },
      evaluation: {
        select: {
          bloomsLevel: true,
          overallScore: true,
        },
      },
      _count: {
        select: { responses: true, likes: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Group questions by activity
  const questionsByActivity = questions.reduce((acc, q) => {
    const activityId = q.activity.id
    if (!acc[activityId]) {
      acc[activityId] = {
        activity: q.activity,
        questions: [],
      }
    }
    acc[activityId].questions.push(q)
    return acc
  }, {} as Record<string, { activity: typeof questions[0]['activity']; questions: typeof questions }>)

  const totalQuestions = questions.length
  const avgScore = questions.reduce((sum, q) => sum + (q.evaluation?.overallScore || 0), 0) / (totalQuestions || 1)
  const totalLikes = questions.reduce((sum, q) => sum + q._count.likes, 0)
  const totalResponses = questions.reduce((sum, q) => sum + q._count.responses, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold mb-2">My Questions</h1>
          <p className="text-white/80">View and manage all questions you have created</p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold">{totalQuestions}</div>
              <div className="text-sm text-white/70">Total Questions</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold">{avgScore.toFixed(1)}</div>
              <div className="text-sm text-white/70">Avg. Score</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold">{totalLikes}</div>
              <div className="text-sm text-white/70">Total Likes</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold">{totalResponses}</div>
              <div className="text-sm text-white/70">Total Responses</div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {questions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No questions yet</h2>
            <p className="text-gray-500 mb-6">Start creating questions in your activities to see them here.</p>
            <Link
              href="/groups"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Browse Groups
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.values(questionsByActivity).map(({ activity, questions: activityQuestions }) => (
              <div key={activity.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <Link
                        href={`/activities/${activity.id}`}
                        className="text-lg font-semibold text-gray-900 hover:text-blue-600"
                      >
                        {activity.name}
                      </Link>
                      <p className="text-sm text-gray-500">
                        {activity.owningGroup.name} • {activityQuestions.length} questions
                      </p>
                    </div>
                    <Link
                      href={`/activities/${activity.id}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View Activity
                    </Link>
                  </div>
                </div>
                <div className="divide-y">
                  {activityQuestions.map((question) => (
                    <div key={question.id} className="px-6 py-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <Link
                            href={`/activities/${activity.id}/questions/${question.id}`}
                            className="text-gray-900 hover:text-blue-600 font-medium"
                          >
                            {question.content.length > 150
                              ? question.content.substring(0, 150) + '...'
                              : question.content}
                          </Link>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span>{new Date(question.createdAt).toLocaleDateString()}</span>
                            {question.evaluation?.bloomsLevel && (
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                                Bloom&apos;s Level {question.evaluation.bloomsLevel}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                              </svg>
                              {question._count.likes}
                            </span>
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                              {question._count.responses}
                            </span>
                          </div>
                        </div>
                        {question.evaluation?.overallScore !== undefined && (
                          <div className="text-center">
                            <div className={`text-2xl font-bold ${
                              question.evaluation.overallScore >= 8 ? 'text-green-600' :
                              question.evaluation.overallScore >= 6 ? 'text-blue-600' :
                              question.evaluation.overallScore >= 4 ? 'text-yellow-600' :
                              'text-gray-400'
                            }`}>
                              {question.evaluation.overallScore.toFixed(1)}
                            </div>
                            <div className="text-xs text-gray-500">Score</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
