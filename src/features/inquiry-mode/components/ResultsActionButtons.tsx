import Link from 'next/link'

interface ResultsActionButtonsProps {
  activityId: string
  labels: {
    backToInquiry: string
    returnToActivity: string
  }
}

export function ResultsActionButtons({
  activityId,
  labels,
}: ResultsActionButtonsProps) {
  return (
    <div className="mt-6 flex gap-3 justify-center">
      <Link
        href={`/activities/${activityId}/inquiry`}
        className="px-6 py-3 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition"
      >
        {labels.backToInquiry}
      </Link>
      <Link
        href={`/activities/${activityId}`}
        className="px-6 py-3 bg-yellow-500 text-white font-medium rounded-lg hover:bg-yellow-600 transition"
      >
        {labels.returnToActivity}
      </Link>
    </div>
  )
}
