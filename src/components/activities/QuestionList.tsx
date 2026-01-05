'use client'

import { useState } from 'react'
import { QuestionCard } from './QuestionCard'
import { deleteQuestion } from '@/app/(dashboard)/activities/actions'
import type { QuestionWithEvaluation } from '@/types/activities'

interface QuestionListProps {
  questions: QuestionWithEvaluation[]
  activityId: string
  currentUserId?: string
  activityCreatorId?: string
  groupCreatorId?: string
  showActions?: boolean
  likedQuestionIds?: Set<string>
}

export function QuestionList({
  questions,
  activityId,
  currentUserId,
  activityCreatorId,
  groupCreatorId,
  showActions = false,
  likedQuestionIds = new Set(),
}: QuestionListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(questionId: string) {
    if (!confirm('Are you sure you want to delete this question?')) {
      return
    }

    setDeletingId(questionId)
    const result = await deleteQuestion(questionId)

    if (!result.success) {
      alert(result.error || 'Failed to delete question')
    }

    setDeletingId(null)
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-gray-500">No questions yet.</p>
        <p className="text-sm text-gray-400 mt-1">Be the first to ask a question!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {questions.map((question) => (
        <div key={question.id} className={deletingId === question.id ? 'opacity-50' : ''}>
          <QuestionCard
            question={question}
            activityId={activityId}
            showActions={showActions && deletingId !== question.id}
            currentUserId={currentUserId}
            activityCreatorId={activityCreatorId}
            groupCreatorId={groupCreatorId}
            isLiked={likedQuestionIds.has(question.id)}
            onDelete={handleDelete}
          />
        </div>
      ))}
    </div>
  )
}
