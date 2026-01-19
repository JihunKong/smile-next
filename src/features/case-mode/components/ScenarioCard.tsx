'use client'

import type { CaseScenario } from '../types'

interface ScenarioCardProps {
  scenario: CaseScenario
  index: number
  onEdit: () => void
  onDelete: () => void
  isDragging?: boolean
  dragHandleProps?: {
    draggable: boolean
    onDragStart: () => void
    onDragOver: (e: React.DragEvent) => void
    onDragEnd: () => void
  }
}

/**
 * Card component displaying a case scenario with edit/delete actions.
 * Supports drag-and-drop reordering.
 */
export function ScenarioCard({
  scenario,
  index,
  onEdit,
  onDelete,
  isDragging = false,
  dragHandleProps,
}: ScenarioCardProps) {
  return (
    <div
      {...dragHandleProps}
      className={`border border-gray-200 rounded-lg p-4 cursor-move hover:border-indigo-300 transition ${
        isDragging ? 'opacity-50 border-indigo-500' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4 flex-1">
          <div className="flex-shrink-0">
            <span className="bg-indigo-600 text-white text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center">
              {index + 1}
            </span>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{scenario.title}</h3>
            {scenario.domain && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded mt-1 inline-block">
                {scenario.domain}
              </span>
            )}
            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
              {scenario.content}
            </p>
          </div>
        </div>
        <div className="flex gap-2 ml-4">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-lg"
            title="Edit"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-lg"
            title="Delete"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
