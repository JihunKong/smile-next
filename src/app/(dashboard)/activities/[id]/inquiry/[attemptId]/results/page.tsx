import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'

interface InquiryResultsPageProps {
  params: Promise<{ id: string; attemptId: string }>
}

interface EvaluationData {
  overallScore: number
  creativityScore: number | null
  clarityScore: number | null
  relevanceScore: number | null
  innovationScore: number | null
  complexityScore: number | null
  bloomsLevel: string | null
  evaluationText: string | null
  strengths: string[]
  improvements: string[]
  enhancedQuestions: Array<{ level: string; question: string }> | string[]
  nextLevelGuidance?: string
}

interface QuestionWithEvaluation {
  id: string
  content: string
  createdAt: Date
  evaluation: EvaluationData | null
}

export default async function InquiryResultsPage({ params }: InquiryResultsPageProps) {
  const { id: activityId, attemptId } = await params
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/auth/login')
  }

  // Fetch attempt with related data
  const attempt = await prisma.inquiryAttempt.findUnique({
    where: { id: attemptId },
    include: {
      activity: {
        select: {
          id: true,
          name: true,
          inquirySettings: true,
        },
      },
    },
  })

  if (!attempt || attempt.userId !== session.user.id) {
    notFound()
  }

  if (attempt.status !== 'completed') {
    redirect(`/activities/${activityId}/inquiry/take`)
  }

  // Fetch questions created during this attempt
  const questions = await prisma.question.findMany({
    where: {
      activityId,
      creatorId: session.user.id,
      questionType: 'inquiry',
      createdAt: { gte: attempt.startedAt },
      ...(attempt.completedAt && { createdAt: { lte: attempt.completedAt } }),
    },
    include: {
      evaluation: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  const inquirySettings = attempt.activity.inquirySettings as {
    passThreshold?: number
    questionsRequired?: number
  } | null

  const passThreshold = inquirySettings?.passThreshold || 6.0

  // Calculate overall statistics
  const evaluatedQuestions = questions.filter((q) => q.evaluation)
  const overallScores = evaluatedQuestions.map((q) => q.evaluation?.overallScore || 0)
  const avgScore = overallScores.length > 0
    ? overallScores.reduce((a, b) => a + b, 0) / overallScores.length
    : 0
  const passed = avgScore >= passThreshold

  // Calculate average dimension scores
  const dimScores = {
    creativity: 0,
    clarity: 0,
    relevance: 0,
    innovation: 0,
    complexity: 0,
  }
  let dimCount = 0

  evaluatedQuestions.forEach((q) => {
    const ev = q.evaluation
    if (ev) {
      dimScores.creativity += ev.creativityScore || 0
      dimScores.clarity += ev.clarityScore || 0
      dimScores.relevance += ev.relevanceScore || 0
      dimScores.innovation += ev.innovationScore || 0
      dimScores.complexity += ev.complexityScore || 0
      dimCount++
    }
  })

  if (dimCount > 0) {
    dimScores.creativity /= dimCount
    dimScores.clarity /= dimCount
    dimScores.relevance /= dimCount
    dimScores.innovation /= dimCount
    dimScores.complexity /= dimCount
  }

  // Blooms level distribution
  const bloomsDistribution: Record<string, number> = {}
  evaluatedQuestions.forEach((q) => {
    const level = q.evaluation?.bloomsLevel || 'unknown'
    bloomsDistribution[level] = (bloomsDistribution[level] || 0) + 1
  })

  function getScoreColor(score: number): string {
    if (score >= 8) return 'text-green-600'
    if (score >= 6) return 'text-yellow-600'
    return 'text-red-600'
  }

  function getScoreBgColor(score: number): string {
    if (score >= 8) return 'bg-green-100'
    if (score >= 6) return 'bg-yellow-100'
    return 'bg-red-100'
  }

  function getBloomsBadgeColor(level: string): string {
    const colors: Record<string, string> = {
      remember: 'bg-gray-100 text-gray-700',
      understand: 'bg-blue-100 text-blue-700',
      apply: 'bg-green-100 text-green-700',
      analyze: 'bg-yellow-100 text-yellow-700',
      evaluate: 'bg-orange-100 text-orange-700',
      create: 'bg-purple-100 text-purple-700',
    }
    return colors[level.toLowerCase()] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link
            href={`/activities/${activityId}/inquiry`}
            className="inline-flex items-center gap-1 text-white/80 hover:text-white mb-4"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Inquiry
          </Link>
          <h1 className="text-2xl font-bold">Inquiry Results</h1>
          <p className="text-white/80">{attempt.activity.name}</p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Overall Score Card */}
        <div className={`rounded-lg shadow-md p-6 mb-6 ${passed ? 'bg-green-50 border-2 border-green-200' : 'bg-yellow-50 border-2 border-yellow-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {passed ? (
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                  </svg>
                </div>
              )}
              <div>
                <h2 className={`text-xl font-bold ${passed ? 'text-green-800' : 'text-yellow-800'}`}>
                  {passed ? 'Congratulations!' : 'Good Effort!'}
                </h2>
                <p className={passed ? 'text-green-600' : 'text-yellow-600'}>
                  You generated {questions.length} questions
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-4xl font-bold ${getScoreColor(avgScore)}`}>
                {avgScore.toFixed(1)}
              </div>
              <div className="text-sm text-gray-500">/ 10 Average</div>
            </div>
          </div>

          <div className="text-sm text-gray-600 mt-2">
            Pass threshold: {passThreshold} | Status: {passed ? 'Passed' : 'Needs Improvement'}
          </div>
        </div>

        {/* 4-Dimension Score Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Dimensions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Creativity', score: dimScores.creativity, icon: '💡' },
              { label: 'Clarity', score: dimScores.clarity, icon: '📝' },
              { label: 'Relevance', score: dimScores.relevance, icon: '🎯' },
              { label: 'Innovation', score: dimScores.innovation, icon: '🚀' },
            ].map((dim) => (
              <div key={dim.label} className={`rounded-lg p-4 text-center ${getScoreBgColor(dim.score)}`}>
                <div className="text-2xl mb-1">{dim.icon}</div>
                <div className={`text-2xl font-bold ${getScoreColor(dim.score)}`}>
                  {dim.score.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">{dim.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bloom's Level Distribution */}
        {Object.keys(bloomsDistribution).length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bloom&apos;s Taxonomy Levels</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(bloomsDistribution).map(([level, count]) => (
                <span
                  key={level}
                  className={`px-3 py-2 rounded-full text-sm font-medium capitalize ${getBloomsBadgeColor(level)}`}
                >
                  {level}: {count}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Individual Questions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Questions</h3>
          <div className="space-y-6">
            {questions.map((q, index) => (
              <div key={q.id} className="border border-gray-200 rounded-lg p-4">
                {/* Question Header */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm font-medium">
                      Q{index + 1}
                    </span>
                    {q.evaluation?.bloomsLevel && (
                      <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getBloomsBadgeColor(q.evaluation.bloomsLevel)}`}>
                        {q.evaluation.bloomsLevel}
                      </span>
                    )}
                  </div>
                  {q.evaluation && (
                    <div className="text-right">
                      <span className={`text-2xl font-bold ${getScoreColor(q.evaluation.overallScore)}`}>
                        {q.evaluation.overallScore.toFixed(1)}
                      </span>
                      <span className="text-xs text-gray-500"> / 10</span>
                    </div>
                  )}
                </div>

                {/* Question Content */}
                <p className="text-gray-800 mb-4">{q.content}</p>

                {/* Dimension Scores */}
                {q.evaluation && (
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className={`font-medium ${getScoreColor(q.evaluation.creativityScore || 0)}`}>
                        {(q.evaluation.creativityScore || 0).toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-500">Creativity</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className={`font-medium ${getScoreColor(q.evaluation.clarityScore || 0)}`}>
                        {(q.evaluation.clarityScore || 0).toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-500">Clarity</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className={`font-medium ${getScoreColor(q.evaluation.relevanceScore || 0)}`}>
                        {(q.evaluation.relevanceScore || 0).toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-500">Relevance</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className={`font-medium ${getScoreColor(q.evaluation.innovationScore || 0)}`}>
                        {(q.evaluation.innovationScore || 0).toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-500">Innovation</div>
                    </div>
                  </div>
                )}

                {/* AI Feedback */}
                {q.evaluation?.evaluationText && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                    <h4 className="text-sm font-medium text-blue-800 mb-1 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      AI Feedback
                    </h4>
                    <p className="text-sm text-blue-700">{q.evaluation.evaluationText}</p>
                  </div>
                )}

                {/* Strengths & Improvements */}
                {q.evaluation && (
                  <div className="grid grid-cols-2 gap-3">
                    {Array.isArray(q.evaluation.strengths) && q.evaluation.strengths.length > 0 && (
                      <div className="bg-green-50 rounded p-3">
                        <h4 className="text-xs font-medium text-green-800 mb-1">Strengths</h4>
                        <ul className="text-xs text-green-700 space-y-0.5">
                          {(q.evaluation.strengths as string[]).slice(0, 3).map((s, i) => (
                            <li key={i}>+ {s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {Array.isArray(q.evaluation.improvements) && q.evaluation.improvements.length > 0 && (
                      <div className="bg-orange-50 rounded p-3">
                        <h4 className="text-xs font-medium text-orange-800 mb-1">Improvements</h4>
                        <ul className="text-xs text-orange-700 space-y-0.5">
                          {(q.evaluation.improvements as string[]).slice(0, 3).map((s, i) => (
                            <li key={i}>- {s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Enhanced Questions */}
                {q.evaluation && Array.isArray(q.evaluation.enhancedQuestions) && q.evaluation.enhancedQuestions.length > 0 && (
                  <div className="mt-3 bg-purple-50 rounded p-3">
                    <h4 className="text-xs font-medium text-purple-800 mb-1">
                      Try These Higher-Level Questions
                    </h4>
                    <ul className="text-xs text-purple-700 space-y-1">
                      {(q.evaluation.enhancedQuestions as Array<{ level: string; question: string }>).slice(0, 2).map((eq, i) => (
                        <li key={i}>
                          <span className="font-medium capitalize">[{eq.level}]</span> {eq.question}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3 justify-center">
          <Link
            href={`/activities/${activityId}/inquiry`}
            className="px-6 py-3 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition"
          >
            Back to Inquiry
          </Link>
          <Link
            href={`/activities/${activityId}`}
            className="px-6 py-3 bg-yellow-500 text-white font-medium rounded-lg hover:bg-yellow-600 transition"
          >
            Return to Activity
          </Link>
        </div>
      </div>
    </div>
  )
}
