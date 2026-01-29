/**
 * SubmitExamButton Component
 *
 * Primary submit button for the exam.
 *
 * @see VIBE-0010
 */

export interface SubmitExamButtonLabels {
  submitExam: string
}

export const defaultSubmitExamButtonLabels: SubmitExamButtonLabels = {
  submitExam: 'Submit Exam',
}

interface SubmitExamButtonProps {
  onClick: () => void
  labels?: Partial<SubmitExamButtonLabels>
}

export function SubmitExamButton({
  onClick,
  labels: customLabels = {},
}: SubmitExamButtonProps) {
  const labels = { ...defaultSubmitExamButtonLabels, ...customLabels }

  return (
    <div className="text-center">
      <button
        onClick={onClick}
        className="text-white font-bold py-4 px-8 rounded-lg text-lg shadow-lg transform transition-all hover:scale-105"
        style={{ backgroundColor: '#8C1515' }}
      >
        <svg className="w-5 h-5 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {labels.submitExam}
      </button>
    </div>
  )
}
