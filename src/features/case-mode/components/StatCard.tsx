// StatCard Component
// Displays a single statistic with label, value, and icon
// Used in leaderboard page for stats grid

interface StatCardProps {
  /** Label describing the statistic */
  label: string
  /** The value to display (will be formatted as string) */
  value: string | number
  /** Tailwind color class for the value (e.g., 'text-blue-600') */
  valueColor: string
  /** Icon to display (as React node) */
  icon: React.ReactNode
  /** Tailwind color class for the icon (e.g., 'text-blue-500') */
  iconColor: string
}

/**
 * Displays a single statistic in a card format.
 * Used for the stats grid at the top of the leaderboard.
 */
export function StatCard({ label, value, valueColor, icon, iconColor }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{label}</p>
          <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
        </div>
        <div className={`w-8 h-8 ${iconColor}`}>{icon}</div>
      </div>
    </div>
  )
}
