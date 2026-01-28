import { getBloomsBadgeColor } from '../utils'
import type { BloomsDistribution } from '../types'

interface BloomsDistributionCardProps {
  distribution: BloomsDistribution
  title: string
}

export function BloomsDistributionCard({
  distribution,
  title,
}: BloomsDistributionCardProps) {
  const entries = Object.entries(distribution)

  if (entries.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {entries.map(([level, count]) => (
          <span
            key={level}
            className={`px-3 py-2 rounded-full text-sm font-medium capitalize ${getBloomsBadgeColor(level)}`}
          >
            {level}: {count}
          </span>
        ))}
      </div>
    </div>
  )
}
