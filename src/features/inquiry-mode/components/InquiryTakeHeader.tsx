'use client'

import { ExamTimer } from '@/components/modes/ExamTimer'
import { InquiryProgress } from './InquiryProgress'

interface InquiryTakeHeaderProps {
  activityName: string
  currentQuestion: number
  totalQuestions: number
  questionsCompleted: number
  timePerQuestion: number
  timerKey: number
  isComplete: boolean
  onTimeUp: () => void
  labels: {
    mode: string
    progress: string
    completed: string
    remaining: string
  }
}

export function InquiryTakeHeader({
  activityName,
  currentQuestion,
  totalQuestions,
  questionsCompleted,
  timePerQuestion,
  timerKey,
  isComplete,
  onTimeUp,
  labels,
}: InquiryTakeHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm text-gray-500">{labels.mode}</p>
            <h1 className="font-semibold text-gray-900">{activityName}</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              {labels.progress
                .replace('{current}', String(currentQuestion))
                .replace('{total}', String(totalQuestions))}
            </div>

            {!isComplete && (
              <ExamTimer
                key={timerKey}
                totalSeconds={timePerQuestion}
                onTimeUp={onTimeUp}
                size="md"
              />
            )}
          </div>
        </div>

        <InquiryProgress
          current={questionsCompleted}
          total={totalQuestions}
          labels={{
            completed: labels.completed,
            remaining: labels.remaining,
          }}
        />
      </div>
    </header>
  )
}
