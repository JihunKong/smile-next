'use client'

import { useState, useEffect } from 'react'
import type { CaseScenario } from '../types'

interface ScenarioEditorProps {
  scenario?: CaseScenario | null // undefined/null = add mode
  isOpen: boolean
  onClose: () => void
  onSave: (title: string, content: string, domain: string) => Promise<void>
  onUpdate?: (scenario: CaseScenario) => Promise<void>
  isSaving: boolean
}

/**
 * Modal for adding or editing a case scenario.
 */
export function ScenarioEditor({
  scenario,
  isOpen,
  onClose,
  onSave,
  onUpdate,
  isSaving,
}: ScenarioEditorProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [domain, setDomain] = useState('')

  const isEditMode = !!scenario

  // Reset form when modal opens/closes or scenario changes
  useEffect(() => {
    if (isOpen && scenario) {
      setTitle(scenario.title)
      setContent(scenario.content)
      setDomain(scenario.domain || '')
    } else if (isOpen) {
      setTitle('')
      setContent('')
      setDomain('')
    }
  }, [isOpen, scenario])

  const handleSubmit = async () => {
    if (isEditMode && onUpdate && scenario) {
      await onUpdate({ ...scenario, title, content, domain })
    } else {
      await onSave(title, content, domain)
    }
    onClose()
  }

  const handleClose = () => {
    onClose()
    setTitle('')
    setContent('')
    setDomain('')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {isEditMode ? 'Edit Scenario' : 'Add New Scenario'}
            </h2>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Tech Startup Ethical Dilemma"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Domain (Optional)
              </label>
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="e.g., Technology, Healthcare, Finance"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content <span className="text-red-500">*</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                placeholder="Describe the business scenario with embedded flaws for students to identify..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={handleClose}
              className="bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 px-6 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSaving || !title.trim() || !content.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg"
              style={{ backgroundColor: isSaving || !title.trim() || !content.trim() ? undefined : '#4f46e5' }}
            >
              {isSaving ? 'Saving...' : isEditMode ? 'Save Changes' : 'Add Scenario'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
