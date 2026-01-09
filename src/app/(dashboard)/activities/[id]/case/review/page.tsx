'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface ExpectedFlaw {
  flaw: string
  explanation: string
  severity: string
}

interface ExpectedSolution {
  solution: string
  details: string
  implementation: string
}

interface CaseScenario {
  id: string
  scenario_number: number
  title: string
  domain: string
  innovation_name?: string
  scenario_content: string
  expected_flaws: ExpectedFlaw[]
  expected_solutions: ExpectedSolution[]
  is_active: boolean
  created_by_ai: boolean
  edited_by_creator: boolean
}

interface Configuration {
  difficulty_level: string
  num_cases_to_show: number
  max_attempts: number
  pass_threshold: number
}

interface ActivityInfo {
  id: string
  name: string
}

interface FactCheckWarning {
  scenario_number: number
  claim: string
  issue: string
  suggested_correction: string
  severity: 'high' | 'medium' | 'low'
}

export default function CaseReviewPage() {
  const params = useParams()
  const router = useRouter()
  const activityId = params.id as string

  const [loading, setLoading] = useState(true)
  const [loadingTitle, setLoadingTitle] = useState('Loading Scenarios')
  const [loadingMessage, setLoadingMessage] = useState('Fetching scenario data...')
  const [scenarios, setScenarios] = useState<CaseScenario[]>([])
  const [configuration, setConfiguration] = useState<Configuration | null>(null)
  const [activity, setActivity] = useState<ActivityInfo | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingScenario, setEditingScenario] = useState<CaseScenario | null>(null)
  const [expandedScenarios, setExpandedScenarios] = useState<Set<string>>(new Set())
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const [warnings, setWarnings] = useState<FactCheckWarning[]>([])
  const [factCheckProgress, setFactCheckProgress] = useState<number | null>(null)
  const [factCheckMessage, setFactCheckMessage] = useState('')

  // Edit form state
  const [editTitle, setEditTitle] = useState('')
  const [editDomain, setEditDomain] = useState('')
  const [editInnovationName, setEditInnovationName] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editFlaws, setEditFlaws] = useState('')
  const [editSolutions, setEditSolutions] = useState('')

  useEffect(() => {
    loadScenarios()
  }, [activityId])

  async function loadScenarios() {
    try {
      setLoading(true)
      setLoadingTitle('Loading Scenarios')
      setLoadingMessage('Fetching scenario data...')

      // Fetch activity info
      const activityRes = await fetch(`/api/activities/${activityId}`)
      if (!activityRes.ok) throw new Error('Failed to load activity')
      const activityData = await activityRes.json()
      setActivity({ id: activityData.id, name: activityData.name })

      // Fetch scenarios
      const scenariosRes = await fetch(`/api/case/scenarios/${activityId}?include_answers=true`)
      if (!scenariosRes.ok) throw new Error('Failed to load scenarios')
      const scenariosData = await scenariosRes.json()

      if (!scenariosData.success) {
        throw new Error(scenariosData.error || 'Failed to load scenarios')
      }

      setScenarios(scenariosData.scenarios || [])
      setConfiguration(
        scenariosData.configuration || {
          difficulty_level: 'medium',
          num_cases_to_show: 3,
          max_attempts: 3,
          pass_threshold: 6.0,
        }
      )
    } catch (err) {
      alert('Failed to load scenarios: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  function toggleScenarioContent(scenarioId: string) {
    const newExpanded = new Set(expandedScenarios)
    if (newExpanded.has(scenarioId)) {
      newExpanded.delete(scenarioId)
    } else {
      newExpanded.add(scenarioId)
    }
    setExpandedScenarios(newExpanded)
  }

  function openEditModal(scenario: CaseScenario) {
    setEditingScenario(scenario)
    setEditTitle(scenario.title)
    setEditDomain(scenario.domain)
    setEditInnovationName(scenario.innovation_name || '')
    setEditContent(scenario.scenario_content)
    setEditFlaws(JSON.stringify(scenario.expected_flaws || [], null, 2))
    setEditSolutions(JSON.stringify(scenario.expected_solutions || [], null, 2))
    setShowAdvancedOptions(false)
    setShowEditModal(true)
  }

  function closeEditModal() {
    setShowEditModal(false)
    setEditingScenario(null)
  }

  async function saveScenario(e: React.FormEvent) {
    e.preventDefault()
    if (!editingScenario) return

    let expectedFlaws, expectedSolutions
    try {
      expectedFlaws = JSON.parse(editFlaws || '[]')
      expectedSolutions = JSON.parse(editSolutions || '[]')
    } catch (err) {
      alert('Invalid JSON in Expected Flaws or Solutions. Please check syntax.')
      return
    }

    setLoading(true)
    setLoadingTitle('Saving Changes')
    setLoadingMessage('Updating scenario...')

    try {
      const res = await fetch(`/api/case/scenario/${editingScenario.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          domain: editDomain,
          innovation_name: editInnovationName || null,
          scenario_content: editContent,
          expected_flaws: expectedFlaws,
          expected_solutions: expectedSolutions,
        }),
      })

      const data = await res.json()
      if (!data.success) {
        throw new Error(data.error || 'Failed to update scenario')
      }

      closeEditModal()
      await loadScenarios()
      alert('Scenario updated successfully!')
    } catch (err) {
      alert('Failed to update scenario: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  async function toggleActive(scenarioId: string, newActiveState: boolean) {
    setLoading(true)
    setLoadingTitle('Updating Status')
    setLoadingMessage(`${newActiveState ? 'Activating' : 'Deactivating'} scenario...`)

    try {
      const res = await fetch(`/api/case/scenario/${scenarioId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: newActiveState }),
      })

      const data = await res.json()
      if (!data.success) {
        throw new Error(data.error || 'Failed to update status')
      }

      await loadScenarios()
    } catch (err) {
      alert('Failed to update status: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  async function regenerateScenario(scenarioNumber: number) {
    if (
      !confirm(
        `Regenerate scenario #${scenarioNumber}?\n\nThis will replace the existing scenario with a new AI-generated one.`
      )
    ) {
      return
    }

    setLoading(true)
    setLoadingTitle(`Regenerating Scenario #${scenarioNumber}`)
    setLoadingMessage('AI is generating a new detailed scenario... This may take 20-30 seconds')

    try {
      const res = await fetch('/api/case/regenerate-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity_id: activityId,
          scenario_number: scenarioNumber,
        }),
      })

      const data = await res.json()
      if (!data.success) {
        throw new Error(data.error || 'Failed to regenerate scenario')
      }

      await loadScenarios()
      alert('Scenario regenerated successfully!')
    } catch (err) {
      alert(
        'Failed to regenerate scenario: ' + (err instanceof Error ? err.message : 'Unknown error')
      )
    } finally {
      setLoading(false)
    }
  }

  async function deleteScenario(scenarioId: string, scenarioNumber: number, title: string) {
    if (
      !confirm(
        `Delete Scenario #${scenarioNumber}: "${title}"?\n\n⚠️ This cannot be undone.\n⚠️ This will decrease your scenario pool count.`
      )
    ) {
      return
    }

    setLoading(true)
    setLoadingTitle(`Deleting Scenario #${scenarioNumber}`)
    setLoadingMessage('Removing scenario from pool...')

    try {
      const res = await fetch('/api/case/delete-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity_id: activityId,
          scenario_id: scenarioId,
        }),
      })

      const data = await res.json()
      if (!data.success) {
        throw new Error(data.error || 'Failed to delete scenario')
      }

      await loadScenarios()
      alert(`Scenario #${scenarioNumber} deleted successfully!`)
    } catch (err) {
      alert('Failed to delete scenario: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  async function addNewScenario() {
    const generateWithAI = confirm(
      'Add a new scenario to the pool?\n\nOK = Generate with AI\nCancel = Create blank scenario'
    )

    const nextNumber = scenarios.length + 1

    setLoading(true)
    setLoadingTitle(generateWithAI ? `Adding Scenario #${nextNumber}` : `Adding Scenario #${nextNumber}`)
    setLoadingMessage(
      generateWithAI
        ? 'AI is generating a new detailed scenario... This may take 20-30 seconds'
        : 'Creating blank scenario template...'
    )

    try {
      const res = await fetch('/api/case/add-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity_id: activityId,
          generate_with_ai: generateWithAI,
        }),
      })

      const data = await res.json()
      if (!data.success) {
        throw new Error(data.error || 'Failed to add scenario')
      }

      await loadScenarios()
      alert(
        generateWithAI
          ? `New Scenario #${nextNumber} generated successfully!`
          : `Blank Scenario #${nextNumber} created! Click Edit to fill in the content.`
      )
    } catch (err) {
      alert('Failed to add scenario: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  async function verifyFacts() {
    if (
      !confirm(
        'Run fact verification on all scenarios?\n\nThis will check for unverifiable claims, outdated information, and technical inaccuracies.'
      )
    ) {
      return
    }

    setFactCheckProgress(20)
    setFactCheckMessage(`AI is checking factual accuracy in ${scenarios.length} scenarios...`)

    const progressInterval = setInterval(() => {
      setFactCheckProgress((prev) => {
        if (prev && prev < 90) return prev + 10
        return prev
      })
    }, 5000)

    try {
      const res = await fetch('/api/case/verify-facts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activity_id: activityId }),
      })

      const data = await res.json()
      clearInterval(progressInterval)

      if (!data.success) {
        setFactCheckProgress(null)
        throw new Error(data.error || 'Failed to verify facts')
      }

      setFactCheckProgress(100)
      setFactCheckMessage(`Analyzed ${scenarios.length} scenarios successfully!`)

      setTimeout(() => {
        setFactCheckProgress(null)
      }, 1500)

      if (data.warnings && data.warnings.length > 0) {
        setWarnings(data.warnings)
        alert(`Found ${data.warnings.length} potential issue(s). See warnings below for details.`)
      } else {
        alert('No factual issues found! All scenarios look good.')
      }
    } catch (err) {
      clearInterval(progressInterval)
      setFactCheckProgress(null)
      alert('Failed to verify facts: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  async function finalizeActivity() {
    const activeCount = scenarios.filter((s) => s.is_active).length
    const minRequired = configuration?.num_cases_to_show || 2

    if (activeCount < minRequired) {
      alert(`Cannot finalize: Need at least ${minRequired} active scenarios (currently ${activeCount}).`)
      return
    }

    if (
      !confirm(
        'Finalize this case activity?\n\n✅ Students will be able to take it\n✅ Scenarios are locked (can still edit)\n✅ Configuration is saved\n\nContinue?'
      )
    ) {
      return
    }

    setLoading(true)
    setLoadingTitle('Finalizing Activity')
    setLoadingMessage('Making activity available to students...')

    try {
      const res = await fetch('/api/case/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activity_id: activityId }),
      })

      const data = await res.json()
      if (!data.success) {
        throw new Error(data.error || 'Failed to finalize activity')
      }

      alert('Activity finalized! Students can now take this case activity.')
      router.push(`/activities/${activityId}/edit`)
    } catch (err) {
      alert('Failed to finalize activity: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const activeCount = scenarios.filter((s) => s.is_active).length
  const minRequired = configuration?.num_cases_to_show || 2
  const canFinalize = activeCount >= minRequired

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{loadingTitle}</h3>
          <p className="text-gray-600">{loadingMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Review Case Scenarios</h1>
            <p className="text-gray-600 mt-2">
              Activity: <span className="font-semibold">{activity?.name}</span>
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/activities/${activityId}/case/configure`}
              className="bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-2 px-4 rounded-lg"
            >
              <i className="fas fa-cog mr-2"></i>Settings
            </Link>
            <Link
              href={`/activities/${activityId}/edit`}
              className="bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-2 px-4 rounded-lg"
            >
              <i className="fas fa-arrow-left mr-2"></i>Back
            </Link>
          </div>
        </div>

        {/* Status Bar */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-6 flex-wrap">
              <div>
                <span className="text-sm text-gray-600">Total Scenarios in Pool:</span>
                <span className="text-lg font-bold text-indigo-600 ml-2">{scenarios.length}</span>
              </div>
              <div>
                <span className="text-sm text-gray-600">Active Scenarios:</span>
                <span className="text-lg font-bold text-gray-900 ml-2">{activeCount}</span>
              </div>
              <div>
                <span className="text-sm text-gray-600">Difficulty:</span>
                <span className="text-lg font-bold text-indigo-600 ml-2">
                  {configuration?.difficulty_level || '-'}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-600">Students See:</span>
                <span className="text-lg font-bold text-indigo-600 ml-2">
                  {configuration?.num_cases_to_show || '-'} cases
                </span>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={addNewScenario}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg"
                style={{ backgroundColor: '#9333ea', color: '#ffffff' }}
              >
                <i className="fas fa-plus mr-2"></i>Add Scenario
              </button>
              <button
                onClick={verifyFacts}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
                style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
              >
                <i className="fas fa-check-circle mr-2"></i>Verify Facts
              </button>
              <button
                onClick={finalizeActivity}
                disabled={!canFinalize}
                className={`font-semibold py-2 px-4 rounded-lg ${
                  canFinalize
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-400 text-white opacity-50 cursor-not-allowed'
                }`}
                style={canFinalize ? { backgroundColor: '#059669', color: '#ffffff' } : {}}
                title={canFinalize ? '' : `Need at least ${minRequired} active scenarios`}
              >
                <i className="fas fa-check-double mr-2"></i>Finalize Activity
              </button>
            </div>
          </div>
        </div>

        {/* Info Alert */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <i className="fas fa-info-circle text-blue-500"></i>
            </div>
            <div className="ml-3 text-sm text-blue-700">
              <p>
                <strong>Review & Edit:</strong> Read each scenario, verify factual accuracy, edit
                content as needed. You can regenerate individual scenarios, reorder them, or
                deactivate scenarios you don&apos;t want students to see.
              </p>
              <p className="mt-2">
                <strong>Manage Pool:</strong> Use &quot;Add Scenario&quot; to expand your pool, or delete
                button to remove scenarios. Scenarios are automatically numbered starting from #1.
              </p>
              <p className="mt-2">
                <strong>When ready:</strong> Click &quot;Finalize Activity&quot; to make it available to
                students.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Fact Check Progress */}
      {factCheckProgress !== null && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="animate-spin rounded-full w-6 h-6 border-2 border-blue-600 border-t-transparent"></div>
            </div>
            <div className="ml-4 flex-1">
              <h4 className="text-sm font-semibold text-blue-900">Processing...</h4>
              <p className="text-sm text-blue-800 mt-1">{factCheckMessage}</p>
              <div className="mt-3 w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${factCheckProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scenarios Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {scenarios.map((scenario, index) => {
          const displayNumber = index + 1
          const isExpanded = expandedScenarios.has(scenario.id)

          return (
            <div
              key={scenario.id}
              className={`bg-white rounded-lg shadow-md p-6 ${!scenario.is_active ? 'opacity-60' : ''}`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="bg-indigo-600 text-white text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center">
                      {displayNumber}
                    </span>
                    <span className="text-lg font-bold text-indigo-600">
                      Scenario #{displayNumber}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded ${
                        scenario.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {scenario.is_active ? 'Active' : 'Inactive'}
                    </span>
                    {scenario.created_by_ai && !scenario.edited_by_creator && (
                      <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">
                        <i className="fas fa-robot mr-1"></i>AI
                      </span>
                    )}
                    {scenario.edited_by_creator && (
                      <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2 py-1 rounded">
                        <i className="fas fa-user-edit mr-1"></i>Edited
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{scenario.title}</h3>
                  <p className="text-sm text-gray-600">
                    <i className="fas fa-industry mr-1"></i>
                    {scenario.domain}
                    {scenario.innovation_name && ` | ${scenario.innovation_name}`}
                  </p>
                </div>
              </div>

              {/* Scenario Content */}
              <div className="mb-4">
                {!isExpanded ? (
                  <p className="text-base text-gray-700 line-clamp-3">
                    {scenario.scenario_content.substring(0, 200)}...
                  </p>
                ) : (
                  <div className="text-base text-gray-800 whitespace-pre-wrap border-l-4 border-indigo-300 pl-4 py-2 bg-gray-50 rounded leading-relaxed">
                    {scenario.scenario_content}
                  </div>
                )}
                <button
                  onClick={() => toggleScenarioContent(scenario.id)}
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold mt-2"
                >
                  <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} mr-1`}></i>
                  {isExpanded ? 'Collapse' : 'Read Full Scenario'}
                </button>
              </div>

              {/* Expected Answers Summary */}
              <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div className="bg-red-50 p-3 rounded">
                  <span className="font-semibold text-red-800">
                    <i className="fas fa-exclamation-triangle mr-1"></i>Flaws:
                  </span>
                  <span className="text-red-700 ml-1">{scenario.expected_flaws?.length || 0}</span>
                </div>
                <div className="bg-green-50 p-3 rounded">
                  <span className="font-semibold text-green-800">
                    <i className="fas fa-lightbulb mr-1"></i>Solutions:
                  </span>
                  <span className="text-green-700 ml-1">
                    {scenario.expected_solutions?.length || 0}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => openEditModal(scenario)}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg text-sm"
                  style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
                >
                  <i className="fas fa-edit mr-1"></i>Edit
                </button>
                <button
                  onClick={() => toggleActive(scenario.id, !scenario.is_active)}
                  className={`flex-1 font-semibold py-2 px-4 rounded-lg text-sm ${
                    scenario.is_active
                      ? 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                  style={scenario.is_active ? {} : { backgroundColor: '#059669', color: '#ffffff' }}
                >
                  <i className={`fas fa-${scenario.is_active ? 'eye-slash' : 'eye'} mr-1`}></i>
                  {scenario.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => regenerateScenario(scenario.scenario_number)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded-lg text-sm"
                  style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                >
                  <i className="fas fa-sync-alt"></i>
                </button>
                <button
                  onClick={() =>
                    deleteScenario(scenario.id, scenario.scenario_number, scenario.title)
                  }
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-3 rounded-lg text-sm"
                  style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Warnings Panel */}
      {warnings.length > 0 && (
        <div className="mt-6">
          <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-yellow-900 mb-4">
              <i className="fas fa-exclamation-triangle mr-2"></i>Fact Verification Warnings
            </h2>
            <div className="space-y-3">
              {warnings.map((warning, index) => {
                const severityColors = {
                  high: 'red',
                  medium: 'yellow',
                  low: 'blue',
                }
                const color = severityColors[warning.severity] || 'gray'

                return (
                  <div
                    key={index}
                    className={`bg-white border-l-4 border-${color}-500 p-4 rounded`}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <span
                          className={`bg-${color}-100 text-${color}-800 text-xs font-semibold px-2 py-1 rounded`}
                        >
                          Scenario #{warning.scenario_number} | {warning.severity.toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-semibold text-gray-900 mb-1">
                          <i className="fas fa-quote-left mr-1"></i>
                          {warning.claim}
                        </p>
                        <p className="text-sm text-gray-700 mb-2">
                          <strong>Issue:</strong> {warning.issue}
                        </p>
                        <p className="text-sm text-gray-600 mb-3">
                          <strong>Suggestion:</strong> {warning.suggested_correction}
                        </p>
                        <button
                          onClick={() => {
                            const scenario = scenarios.find(
                              (s) => s.scenario_number === warning.scenario_number
                            )
                            if (scenario) {
                              openEditModal(scenario)
                              setWarnings(warnings.filter((_, i) => i !== index))
                            }
                          }}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2 px-4 rounded-lg"
                          style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
                        >
                          <i className="fas fa-edit mr-2"></i>Reflect and Edit Scenario #
                          {warning.scenario_number}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingScenario && (
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4"
          style={{ zIndex: 9999 }}
        >
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  <i className="fas fa-edit text-indigo-600 mr-2"></i>Edit Scenario
                </h2>
                <button onClick={closeEditModal} className="text-gray-400 hover:text-gray-600">
                  <i className="fas fa-times text-2xl"></i>
                </button>
              </div>

              <form onSubmit={saveScenario}>
                {/* Title */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                {/* Domain & Innovation Name */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Domain <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editDomain}
                      onChange={(e) => setEditDomain(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g., Healthcare, Agriculture"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Innovation Name
                    </label>
                    <input
                      type="text"
                      value={editInnovationName}
                      onChange={(e) => setEditInnovationName(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g., Product/Service Name"
                    />
                  </div>
                </div>

                {/* Scenario Content */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scenario Content <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={10}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    This is the case scenario text students will read. Flaws should be embedded
                    naturally.
                  </p>
                </div>

                {/* Advanced Options */}
                <div className="mb-6 border-t pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                    className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-700 hover:text-gray-900 mb-2"
                  >
                    <span>
                      <i className="fas fa-cog mr-2"></i>Advanced: Expected Answers for AI
                      Evaluation (Optional)
                    </span>
                    <i className={`fas fa-chevron-${showAdvancedOptions ? 'up' : 'down'}`}></i>
                  </button>
                  <p className="text-xs text-gray-500 mb-3">
                    These define what the AI looks for when evaluating student responses. Leave
                    as-is unless you want to change the evaluation criteria.
                  </p>

                  {showAdvancedOptions && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Expected Flaws
                          <span className="text-xs font-normal text-gray-500 ml-1">
                            (JSON format - what students should identify)
                          </span>
                        </label>
                        <textarea
                          value={editFlaws}
                          onChange={(e) => setEditFlaws(e.target.value)}
                          rows={6}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                          placeholder='[{"flaw": "Description", "explanation": "Why problematic", "severity": "high"}]'
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Expected Solutions
                          <span className="text-xs font-normal text-gray-500 ml-1">
                            (JSON format - ideal solutions)
                          </span>
                        </label>
                        <textarea
                          value={editSolutions}
                          onChange={(e) => setEditSolutions(e.target.value)}
                          rows={6}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                          placeholder='[{"solution": "Description", "details": "Implementation", "implementation": "How to apply"}]'
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 px-6 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg"
                    style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
                  >
                    <i className="fas fa-save mr-2"></i>Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
