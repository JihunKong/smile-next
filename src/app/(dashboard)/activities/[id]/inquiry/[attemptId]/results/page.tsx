import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { notFound, redirect } from 'next/navigation'
import {
  ResultsHeader,
  OverallScoreCard,
  DimensionScoreGrid,
  BloomsDistributionCard,
  QuestionResultsList,
  ResultsActionButtons,
  type QuestionWithEvaluation,
  type DimensionScores,
  type BloomsDistribution,
} from '@/features/inquiry-mode'

interface InquiryResultsPageProps {
  params: Promise<{ id: string; attemptId: string }>
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
        select: { id: true, name: true, inquirySettings: true },
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
    include: { evaluation: true },
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
  const dimScores: DimensionScores = {
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
  const bloomsDistribution: BloomsDistribution = {}
  evaluatedQuestions.forEach((q) => {
    const level = q.evaluation?.bloomsLevel || 'unknown'
    bloomsDistribution[level] = (bloomsDistribution[level] || 0) + 1
  })

  // Transform questions for the component
  const questionsWithEvaluation: QuestionWithEvaluation[] = questions.map(q => ({
    id: q.id,
    content: q.content,
    createdAt: q.createdAt,
    evaluation: q.evaluation ? {
      overallScore: q.evaluation.overallScore,
      creativityScore: q.evaluation.creativityScore,
      clarityScore: q.evaluation.clarityScore,
      relevanceScore: q.evaluation.relevanceScore,
      innovationScore: q.evaluation.innovationScore,
      complexityScore: q.evaluation.complexityScore,
      bloomsLevel: q.evaluation.bloomsLevel,
      evaluationText: q.evaluation.evaluationText,
      strengths: (q.evaluation.strengths as string[]) || [],
      improvements: (q.evaluation.improvements as string[]) || [],
      enhancedQuestions: (q.evaluation.enhancedQuestions as { level: string; question: string }[]) || [],
    } : null,
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <ResultsHeader
        activityId={activityId}
        activityName={attempt.activity.name}
        title="Inquiry Results"
        backLabel="Back to Inquiry"
      />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <OverallScoreCard
          passed={passed}
          avgScore={avgScore}
          questionsCount={questions.length}
          passThreshold={passThreshold}
          labels={{
            passedTitle: 'Congratulations!',
            failedTitle: 'Good Effort!',
            questionsGenerated: 'You generated {count} questions',
            passThresholdLabel: 'Pass threshold',
            statusLabel: 'Status',
            passed: 'Passed',
            needsImprovement: 'Needs Improvement',
            average: 'Average',
          }}
        />

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Dimensions</h3>
          <DimensionScoreGrid
            scores={dimScores}
            showComplexity={false}
          />
        </div>

        <BloomsDistributionCard
          distribution={bloomsDistribution}
          title="Bloom's Taxonomy Levels"
        />

        <QuestionResultsList
          questions={questionsWithEvaluation}
          title="Your Questions"
        />

        <ResultsActionButtons
          activityId={activityId}
          labels={{
            backToInquiry: 'Back to Inquiry',
            returnToActivity: 'Return to Activity',
          }}
        />
      </div>
    </div>
  )
}
