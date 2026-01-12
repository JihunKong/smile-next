import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ResponseList } from '@/components/responses/ResponseList'
import { ResponseForm } from '@/components/responses/ResponseForm'
import { LikeButton } from '@/components/activities/LikeButton'
import { PeerRating } from '@/components/activities/PeerRating'
import { getBloomBadgeColor, getBloomLabel, getBloomLevelNumber, getScoreColor, formatRelativeTime } from '@/lib/activities/utils'
import { formatAIScore } from '@/lib/responses/utils'

interface QuestionDetailPageProps {
  params: Promise<{ id: string; questionId: string }>
}

export default async function QuestionDetailPage({ params }: QuestionDetailPageProps) {
  const { id: activityId, questionId } = await params
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/auth/login')
  }

  const question = await prisma.question.findUnique({
    where: { id: questionId, isDeleted: false },
    include: {
      creator: {
        select: { id: true, firstName: true, lastName: true, username: true, avatarUrl: true },
      },
      evaluation: {
        select: {
          id: true,
          bloomsLevel: true,
          overallScore: true,
          clarityScore: true,
          relevanceScore: true,
          creativityScore: true,
          evaluationText: true,
        },
      },
      responses: {
        where: { isDeleted: false },
        include: {
          creator: {
            select: { id: true, firstName: true, lastName: true, username: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      likes: {
        where: { userId: session.user.id },
        select: { id: true },
      },
      _count: {
        select: { responses: true, likes: true },
      },
      activity: {
        select: {
          id: true,
          name: true,
          creatorId: true,
          isAnonymousAuthorAllowed: true,
          hideUsernames: true,
          owningGroupId: true,
          owningGroup: {
            select: {
              id: true,
              name: true,
              creatorId: true,
              members: {
                where: { userId: session.user.id },
                select: { userId: true, role: true },
              },
            },
          },
        },
      },
    },
  })

  // Increment view count (fire and forget)
  if (question) {
    prisma.question.update({
      where: { id: questionId },
      data: { viewCount: { increment: 1 } },
    }).catch(() => {}) // Ignore errors
  }

  if (!question) {
    notFound()
  }

  // Verify activity ID matches
  if (question.activityId !== activityId) {
    notFound()
  }

  // Check if user is a group member
  if (question.activity.owningGroup.members.length === 0) {
    notFound()
  }

  const isLiked = question.likes.length > 0
  const isOwnQuestion = session.user.id === question.creatorId

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-[var(--stanford-cardinal)] to-[var(--stanford-pine)] text-white py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <Link
            href={`/activities/${activityId}`}
            className="inline-flex items-center gap-1 text-white/80 hover:text-white mb-3"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to {question.activity.name}
          </Link>

          <h1 className="text-xl font-bold">Question Detail</h1>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Question Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          {/* Question Header */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              {/* Author */}
              {question.isAnonymous || question.activity.hideUsernames ? (
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Anonymous</p>
                    <p className="text-xs text-gray-500">{formatRelativeTime(question.createdAt)}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-sm text-gray-600 font-medium">
                    {question.creator.avatarUrl ? (
                      <img
                        src={question.creator.avatarUrl}
                        alt=""
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <>
                        {question.creator.firstName?.[0] || ''}
                        {question.creator.lastName?.[0] || ''}
                      </>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      {question.creator.firstName} {question.creator.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{formatRelativeTime(question.createdAt)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Like Button */}
            <LikeButton
              questionId={question.id}
              initialLiked={isLiked}
              initialCount={question._count.likes}
              size="md"
            />
          </div>

          {/* Question Content */}
          <div className="mb-4">
            <p className="text-gray-800 whitespace-pre-wrap text-lg">{question.content}</p>
          </div>

          {/* AI Evaluation */}
          {question.evaluation && (
            <div className="border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700">AI Evaluation</h3>
                <Link
                  href={`/questions/${question.id}/evaluation`}
                  className="text-xs text-[var(--stanford-cardinal)] hover:underline flex items-center gap-1"
                >
                  View Detailed Analysis
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {/* Bloom's Level */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-500">Bloom&apos;s:</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getBloomBadgeColor(question.evaluation.bloomsLevel)}`}>
                    L{getBloomLevelNumber(question.evaluation.bloomsLevel)} - {getBloomLabel(question.evaluation.bloomsLevel)}
                  </span>
                </div>

                {/* Overall Score */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-500">Score:</span>
                  <span className={`text-sm font-medium ${getScoreColor(question.evaluation.overallScore)}`}>
                    {formatAIScore(question.evaluation.overallScore)}
                  </span>
                </div>

                {/* Sub-scores */}
                {question.evaluation.clarityScore !== null && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <span>Clarity: {formatAIScore(question.evaluation.clarityScore)}</span>
                    <span className="text-gray-300">|</span>
                    <span>Relevance: {formatAIScore(question.evaluation.relevanceScore)}</span>
                    <span className="text-gray-300">|</span>
                    <span>Creativity: {formatAIScore(question.evaluation.creativityScore)}</span>
                  </div>
                )}
              </div>

              {/* Feedback */}
              {question.evaluation.evaluationText && (
                <p className="mt-2 text-sm text-gray-600 italic">
                  {question.evaluation.evaluationText}
                </p>
              )}
            </div>
          )}

          {/* Peer Rating Section */}
          <div className="border-t border-gray-100 pt-4 mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Rate this question:</span>
                  <PeerRating
                    questionId={question.id}
                    initialRating={question.averageRating}
                    isOwnQuestion={isOwnQuestion}
                  />
                </div>
                {question.numberOfRatings > 0 && (
                  <span className="text-xs text-gray-500">
                    ({question.numberOfRatings} {question.numberOfRatings === 1 ? 'rating' : 'ratings'})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 text-sm text-gray-500">
            {/* View Count */}
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {question.viewCount} views
            </span>
            {/* Responses */}
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              {question.responses.length} responses
            </span>
            {/* Likes */}
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {question._count.likes} likes
            </span>
          </div>
        </div>

        {/* Response Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Responses ({question.responses.length})
          </h2>

          {/* Response Form */}
          <div className="mb-6 pb-6 border-b border-gray-100">
            <ResponseForm
              questionId={question.id}
              activityId={question.activityId}
              isAnonymousAllowed={question.activity.isAnonymousAuthorAllowed}
            />
          </div>

          {/* Response List */}
          <ResponseList
            responses={question.responses}
            currentUserId={session.user.id}
            questionCreatorId={question.creatorId}
            activityCreatorId={question.activity.creatorId}
            groupCreatorId={question.activity.owningGroup.creatorId}
            hideUsernames={question.activity.hideUsernames}
          />
        </div>
      </div>
    </div>
  )
}
