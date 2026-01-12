import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getBloomBadgeColor, getBloomLabel, getBloomLevelNumber } from '@/lib/activities/utils'
import { formatAIScore } from '@/lib/responses/utils'

interface EvaluationPageProps {
  params: Promise<{ questionId: string }>
}

// Score circle component
function ScoreCircle({
  score,
  label,
  color = 'cardinal',
  size = 'md'
}: {
  score: number | null
  label: string
  color?: 'cardinal' | 'green' | 'blue' | 'purple' | 'yellow'
  size?: 'sm' | 'md' | 'lg'
}) {
  const displayScore = score !== null ? score.toFixed(1) : '-'
  const percentage = score !== null ? (score / 10) * 100 : 0

  const colorClasses = {
    cardinal: 'text-[var(--stanford-cardinal)]',
    green: 'text-green-600',
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    yellow: 'text-yellow-600',
  }

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-20 h-20',
    lg: 'w-24 h-24',
  }

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  }

  return (
    <div className="flex flex-col items-center">
      <div className={`${sizeClasses[size]} relative`}>
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
          <circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="3"
          />
          <circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={`${percentage} 100`}
            className={colorClasses[color]}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`${textSizeClasses[size]} font-bold ${colorClasses[color]}`}>
            {displayScore}
          </span>
        </div>
      </div>
      <span className="text-xs text-gray-600 mt-1 text-center">{label}</span>
    </div>
  )
}

// Bloom's Level Card
function BloomCard({ level }: { level: string | null }) {
  const levelNum = getBloomLevelNumber(level)
  const levelLabel = getBloomLabel(level)

  const descriptions: Record<string, string> = {
    remember: 'Recall facts and basic concepts',
    understand: 'Explain ideas or concepts',
    apply: 'Use information in new situations',
    analyze: 'Draw connections among ideas',
    evaluate: 'Justify a stand or decision',
    create: 'Produce new or original work',
  }

  return (
    <div className={`p-4 rounded-lg ${getBloomBadgeColor(level).replace('text-', 'bg-').replace('700', '50').replace('600', '50')}`}>
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${getBloomBadgeColor(level)}`}>
          L{levelNum}
        </div>
        <div>
          <h4 className={`font-semibold ${getBloomBadgeColor(level).split(' ')[1]}`}>
            {levelLabel}
          </h4>
          <p className="text-xs text-gray-600">
            {descriptions[level?.toLowerCase() || ''] || 'Cognitive level'}
          </p>
        </div>
      </div>
    </div>
  )
}

export default async function EvaluationPage({ params }: EvaluationPageProps) {
  const { questionId } = await params
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/auth/login')
  }

  const question = await prisma.question.findUnique({
    where: { id: questionId, isDeleted: false },
    include: {
      creator: {
        select: { id: true, firstName: true, lastName: true },
      },
      evaluation: true,
      activity: {
        select: {
          id: true,
          name: true,
          owningGroup: {
            select: {
              members: {
                where: { userId: session.user.id },
                select: { userId: true },
              },
            },
          },
        },
      },
    },
  })

  if (!question) {
    notFound()
  }

  // Check if user is a group member
  if (question.activity.owningGroup.members.length === 0) {
    notFound()
  }

  const evaluation = question.evaluation
  if (!evaluation) {
    redirect(`/activities/${question.activityId}/questions/${questionId}`)
  }

  // Parse JSON fields
  const strengths = Array.isArray(evaluation.strengths) ? evaluation.strengths as string[] : []
  const improvements = Array.isArray(evaluation.improvements) ? evaluation.improvements as string[] : []
  const keywords = Array.isArray(evaluation.keywordsFound) ? evaluation.keywordsFound as string[] : []
  const enhancedQuestions = Array.isArray(evaluation.enhancedQuestions) ? evaluation.enhancedQuestions as string[] : []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-[var(--stanford-cardinal)] to-[var(--stanford-pine)] text-white py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <Link
            href={`/activities/${question.activityId}/questions/${questionId}`}
            className="inline-flex items-center gap-1 text-white/80 hover:text-white mb-3"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Question
          </Link>

          <h1 className="text-xl font-bold">AI Quality Evaluation</h1>
          <p className="text-white/80 text-sm mt-1">Detailed analysis powered by {evaluation.aiModel}</p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Question Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-sm font-medium text-gray-500 mb-2">Original Question</h2>
          <p className="text-gray-800 whitespace-pre-wrap">{question.content}</p>
          <p className="text-xs text-gray-500 mt-2">
            by {question.creator.firstName} {question.creator.lastName} in {question.activity.name}
          </p>
        </div>

        {/* Score Dashboard */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Score Dashboard</h2>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <ScoreCircle
              score={evaluation.overallScore}
              label="Overall"
              color="cardinal"
              size="lg"
            />
            <ScoreCircle
              score={evaluation.creativityScore}
              label="Creativity"
              color="purple"
            />
            <ScoreCircle
              score={evaluation.clarityScore}
              label="Clarity"
              color="blue"
            />
            <ScoreCircle
              score={evaluation.relevanceScore}
              label="Relevance"
              color="green"
            />
            <ScoreCircle
              score={evaluation.innovationScore}
              label="Innovation"
              color="yellow"
            />
            <ScoreCircle
              score={evaluation.complexityScore}
              label="Complexity"
              color="purple"
            />
          </div>
        </div>

        {/* Bloom's Taxonomy */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Bloom&apos;s Taxonomy Level</h2>
          <BloomCard level={evaluation.bloomsLevel} />
          {evaluation.bloomsConfidence && (
            <p className="text-xs text-gray-500 mt-2">
              Confidence: {(evaluation.bloomsConfidence * 100).toFixed(0)}%
            </p>
          )}
        </div>

        {/* AI Feedback */}
        {evaluation.evaluationText && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Feedback</h2>
            <div className="prose prose-sm max-w-none text-gray-700">
              {evaluation.evaluationText}
            </div>
          </div>
        )}

        {/* Strengths & Improvements */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Strengths */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Strengths
            </h2>
            {strengths.length > 0 ? (
              <ul className="space-y-2">
                {strengths.map((strength, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-green-500 mt-0.5">+</span>
                    {strength}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 italic">No specific strengths identified</p>
            )}
          </div>

          {/* Improvements */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Suggestions for Improvement
            </h2>
            {improvements.length > 0 ? (
              <ul className="space-y-2">
                {improvements.map((improvement, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-yellow-500 mt-0.5">*</span>
                    {improvement}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 italic">No specific improvements suggested</p>
            )}
          </div>
        </div>

        {/* Keywords */}
        {keywords.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Keywords Detected</h2>
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Enhanced Questions */}
        {enhancedQuestions.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Sample Enhanced Questions
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              AI-generated variations to help you think deeper
            </p>
            <div className="space-y-3">
              {enhancedQuestions.map((eq, i) => (
                <div
                  key={i}
                  className="p-3 bg-purple-50 rounded-lg border border-purple-100 text-sm text-gray-700"
                >
                  {eq}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alignment Info */}
        {(evaluation.gradeLevelAlignment || evaluation.subjectAlignment) && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Educational Context</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {evaluation.gradeLevelAlignment && (
                <div>
                  <span className="text-xs text-gray-500">Grade Level Alignment</span>
                  <p className="text-sm font-medium text-gray-800">{evaluation.gradeLevelAlignment}</p>
                </div>
              )}
              {evaluation.subjectAlignment && (
                <div>
                  <span className="text-xs text-gray-500">Subject Alignment</span>
                  <p className="text-sm font-medium text-gray-800">{evaluation.subjectAlignment}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Back to Question Button */}
        <div className="flex justify-center pt-4">
          <Link
            href={`/activities/${question.activityId}/questions/${questionId}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--stanford-cardinal)] text-white rounded-lg hover:bg-[var(--stanford-cardinal-dark)] transition"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Question
          </Link>
        </div>
      </div>
    </div>
  )
}
