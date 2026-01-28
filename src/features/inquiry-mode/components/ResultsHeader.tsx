import Link from 'next/link'

interface ResultsHeaderProps {
  activityId: string
  activityName: string
  title: string
  backLabel: string
}

export function ResultsHeader({
  activityId,
  activityName,
  title,
  backLabel,
}: ResultsHeaderProps) {
  return (
    <section className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Link
          href={`/activities/${activityId}/inquiry`}
          className="inline-flex items-center gap-1 text-white/80 hover:text-white mb-4"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {backLabel}
        </Link>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-white/80">{activityName}</p>
      </div>
    </section>
  )
}
