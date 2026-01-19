'use client'

import { useState, useEffect } from 'react'
import type { DetailedScenario } from '../types'

interface ReviewScenarioEditModalProps {
  scenario: DetailedScenario | null
  isOpen: boolean
  onClose: () => void
  onSave: (scenario: DetailedScenario, updates: {
    title: string
    domain: string
    innovationName?: string
    content: string
    flaws?: unknown[]
    solutions?: unknown[]
  }) => Promise<void>
}

/**
 * Modal for editing detailed scenario content in review page.
 * Includes advanced options for expected flaws/solutions.
 */
export function ReviewScenarioEditModal({
  scenario,
  isOpen,
  onClose,
  onSave,
}: ReviewScenarioEditModalProps) {
  const [title, setTitle] = useState('')
  const [domain, setDomain] = useState('')
  const [innovationName, setInnovationName] = useState('')
  const [content, setContent] = useState('')
  const [flaws, setFlaws] = useState('')
  const [solutions, setSolutions] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)

  useEffect(() => {
    if (isOpen && scenario) {
      setTitle(scenario.title)
      setDomain(scenario.domain)
      setInnovationName(scenario.innovation_name || '')
      setContent(scenario.scenario_content)
      setFlaws(JSON.stringify(scenario.expected_flaws || [], null, 2))
      setSolutions(JSON.stringify(scenario.expected_solutions || [], null, 2))
      setShowAdvanced(false)
    }
  }, [isOpen, scenario])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!scenario) return

    let parsedFlaws, parsedSolutions
    try {
      parsedFlaws = JSON.parse(flaws || '[]')
      parsedSolutions = JSON.parse(solutions || '[]')
    } catch {
      alert('Invalid JSON in Expected Flaws or Solutions. Please check syntax.')
      return
    }

    await onSave(scenario, {
      title,
      domain,
      innovationName: innovationName || undefined,
      content,
      flaws: parsedFlaws,
      solutions: parsedSolutions,
    })
    onClose()
  }

  if (!isOpen || !scenario) return null

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Edit Scenario</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Title <span className="text-red-500">*</span></label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" required />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Domain <span className="text-red-500">*</span></label>
                <input type="text" value={domain} onChange={(e) => setDomain(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="e.g., Healthcare, Agriculture" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Innovation Name</label>
                <input type="text" value={innovationName} onChange={(e) => setInnovationName(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="e.g., Product/Service Name" />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Scenario Content <span className="text-red-500">*</span></label>
              <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={10} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm" required />
              <p className="text-sm text-gray-500 mt-1">This is the case scenario text students will read. Flaws should be embedded naturally.</p>
            </div>

            {/* Advanced Options */}
            <div className="mb-6 border-t pt-4">
              <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-700 hover:text-gray-900 mb-2">
                <span>⚙️ Advanced: Expected Answers for AI Evaluation (Optional)</span>
                <span>{showAdvanced ? '▲' : '▼'}</span>
              </button>
              <p className="text-xs text-gray-500 mb-3">These define what the AI looks for when evaluating student responses.</p>

              {showAdvanced && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Expected Flaws <span className="text-xs font-normal text-gray-500">(JSON format)</span></label>
                    <textarea value={flaws} onChange={(e) => setFlaws(e.target.value)} rows={6} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-xs" placeholder='[{"flaw": "Description", "explanation": "Why problematic", "severity": "high"}]' />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Expected Solutions <span className="text-xs font-normal text-gray-500">(JSON format)</span></label>
                    <textarea value={solutions} onChange={(e) => setSolutions(e.target.value)} rows={6} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-xs" placeholder='[{"solution": "Description", "details": "Implementation"}]' />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3">
              <button type="button" onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 px-6 rounded-lg">Cancel</button>
              <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg" style={{ backgroundColor: '#4f46e5' }}>Save Changes</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
