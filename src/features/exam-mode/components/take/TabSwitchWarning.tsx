/**
 * TabSwitchWarning Component
 *
 * Modal warning displayed when a user switches tabs during exam.
 *
 * @see VIBE-0010
 */

export interface TabSwitchWarningLabels {
  title: string
  message: string
  dismiss: string
}

export const defaultTabSwitchWarningLabels: TabSwitchWarningLabels = {
  title: 'Warning: Tab Switch Detected',
  message: 'You have switched tabs {count} time(s). This activity is being monitored.',
  dismiss: 'I Understand',
}

interface TabSwitchWarningProps {
  tabSwitchCount: number
  onDismiss: () => void
  labels?: Partial<TabSwitchWarningLabels>
}

export function TabSwitchWarning({
  tabSwitchCount,
  onDismiss,
  labels: customLabels = {},
}: TabSwitchWarningProps) {
  const labels = { ...defaultTabSwitchWarningLabels, ...customLabels }
  const message = labels.message.replace('{count}', tabSwitchCount.toString())

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md">
        <h3 className="text-lg font-bold text-red-600 mb-2">{labels.title}</h3>
        <p className="text-gray-600 mb-4">{message}</p>
        <button
          onClick={onDismiss}
          className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          {labels.dismiss}
        </button>
      </div>
    </div>
  )
}
