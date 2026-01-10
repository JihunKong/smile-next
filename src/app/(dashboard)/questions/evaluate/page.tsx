import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'

// Error component for database failures
function ErrorState({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-sm p-8 max-w-md text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">데이터를 불러올 수 없습니다</h2>
        <p className="text-gray-500 mb-6">{message}</p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          대시보드로 돌아가기
        </Link>
      </div>
    </div>
  )
}

// Empty state component for users not in any groups
function NoGroupsState() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-sm p-8 max-w-md text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">그룹에 참여해주세요</h2>
        <p className="text-gray-500 mb-6">질문을 평가하려면 먼저 그룹에 참여해야 합니다.</p>
        <Link
          href="/groups"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          그룹 찾아보기
        </Link>
      </div>
    </div>
  )
}

export default async function EvaluateQuestionsPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/auth/login')
  }

  let userGroupIds: string[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let pendingQuestions: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let lowScoreQuestions: any[]

  try {
    // Find questions that need evaluation (no evaluation record yet)
    // Only show questions from groups the user is a member of
    const userGroups = await prisma.groupUser.findMany({
      where: { userId: session.user.id },
      select: { groupId: true },
    })
    userGroupIds = userGroups.map((g) => g.groupId)

    // If user is not in any groups, show empty state
    if (userGroupIds.length === 0) {
      return <NoGroupsState />
    }

    pendingQuestions = await prisma.question.findMany({
      where: {
        isDeleted: false,
        evaluation: null,
        activity: {
          owningGroupId: { in: userGroupIds },
          isDeleted: false,
        },
      },
      include: {
        creator: {
          select: { id: true, firstName: true, lastName: true },
        },
        activity: {
          select: {
            id: true,
            name: true,
            owningGroup: {
              select: { id: true, name: true },
            },
          },
        },
        _count: {
          select: { responses: true },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: 50,
    })

    // Questions with low scores that might need review
    lowScoreQuestions = await prisma.question.findMany({
      where: {
        isDeleted: false,
        evaluation: {
          overallScore: { lt: 5 },
        },
        activity: {
          owningGroupId: { in: userGroupIds },
          isDeleted: false,
        },
      },
      include: {
        creator: {
          select: { id: true, firstName: true, lastName: true },
        },
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
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
  } catch (error) {
    console.error('Failed to fetch questions for evaluation:', error)
    return <ErrorState message="평가할 질문을 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-green-600 to-teal-700 text-white py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold mb-2">Evaluate Questions</h1>
          <p className="text-white/80">Review and evaluate questions from your groups</p>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mt-6 max-w-md">
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold">{pendingQuestions.length}</div>
              <div className="text-sm text-white/70">Pending Evaluation</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold">{lowScoreQuestions.length}</div>
              <div className="text-sm text-white/70">Needs Review</div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Pending Evaluation Section */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="px-6 py-4 border-b bg-yellow-50">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Pending AI Evaluation ({pendingQuestions.length})
            </h2>
            <p className="text-sm text-gray-600 mt-1">These questions are waiting for AI evaluation</p>
          </div>

          {pendingQuestions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>All questions have been evaluated!</p>
            </div>
          ) : (
            <div className="divide-y">
              {pendingQuestions.map((question) => (
                <div key={question.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <Link
                        href={`/activities/${question.activity.id}/questions/${question.id}`}
                        className="text-gray-900 hover:text-blue-600 font-medium"
                      >
                        {question.content.length > 150
                          ? question.content.substring(0, 150) + '...'
                          : question.content}
                      </Link>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span>{question.creator.firstName} {question.creator.lastName}</span>
                        <span>•</span>
                        <Link
                          href={`/activities/${question.activity.id}`}
                          className="hover:text-blue-600"
                        >
                          {question.activity.name}
                        </Link>
                        <span>•</span>
                        <span>{new Date(question.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                      Pending
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Score Questions Section */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b bg-red-50">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Needs Review ({lowScoreQuestions.length})
            </h2>
            <p className="text-sm text-gray-600 mt-1">Questions with low AI scores that may need improvement</p>
          </div>

          {lowScoreQuestions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
              <p>No low-score questions found.</p>
            </div>
          ) : (
            <div className="divide-y">
              {lowScoreQuestions.map((question) => (
                <div key={question.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <Link
                        href={`/activities/${question.activity.id}/questions/${question.id}`}
                        className="text-gray-900 hover:text-blue-600 font-medium"
                      >
                        {question.content.length > 150
                          ? question.content.substring(0, 150) + '...'
                          : question.content}
                      </Link>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span>{question.creator.firstName} {question.creator.lastName}</span>
                        <span>•</span>
                        <Link
                          href={`/activities/${question.activity.id}`}
                          className="hover:text-blue-600"
                        >
                          {question.activity.name}
                        </Link>
                        {question.evaluation?.bloomsLevel && (
                          <>
                            <span>•</span>
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                              Bloom&apos;s Level {question.evaluation.bloomsLevel}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${
                        (question.evaluation?.overallScore || 0) >= 4 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {question.evaluation?.overallScore?.toFixed(1) || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">Score</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
