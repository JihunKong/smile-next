import type { QuestionWithEvaluation } from '../types'
import { InquiryResultCard } from './InquiryResultCard'

interface QuestionResultsListProps {
  questions: QuestionWithEvaluation[]
  title: string
}

export function QuestionResultsList({
  questions,
  title,
}: QuestionResultsListProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-6">
        {questions.map((question, index) => (
          <InquiryResultCard
            key={question.id}
            question={question}
            index={index}
          />
        ))}
      </div>
    </div>
  )
}
