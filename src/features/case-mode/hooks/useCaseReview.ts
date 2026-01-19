'use client'

import { useState, useCallback, useEffect } from 'react'
import type { DetailedScenario, CaseConfiguration, ActivityInfo, FactCheckWarning } from '../types'

// ============================================================================
// Types
// ============================================================================

export interface UseCaseReviewOptions {
  activityId: string
}

export interface UseCaseReviewReturn {
  // Data
  activity: ActivityInfo | null
  scenarios: DetailedScenario[]
  configuration: CaseConfiguration | null
  warnings: FactCheckWarning[]

  // UI State
  loading: boolean
  loadingTitle: string
  loadingMessage: string
  factCheckProgress: number | null
  factCheckMessage: string
  expandedScenarios: Set<string>

  // Actions
  loadScenarios: () => Promise<void>
  toggleScenarioExpand: (scenarioId: string) => void
  toggleActive: (scenarioId: string, newActiveState: boolean) => Promise<void>
  saveScenario: (scenario: DetailedScenario, updates: {
    title: string
    domain: string
    innovationName?: string
    content: string
    flaws?: unknown[]
    solutions?: unknown[]
  }) => Promise<void>
  regenerateScenario: (scenarioNumber: number) => Promise<void>
  deleteScenario: (scenarioId: string, scenarioNumber: number, title: string) => Promise<void>
  addNewScenario: () => Promise<void>
  verifyFacts: () => Promise<void>
  finalizeActivity: () => Promise<void>
  dismissWarning: (index: number) => void
  setWarnings: (warnings: FactCheckWarning[]) => void

  // Computed
  activeCount: number
  minRequired: number
  canFinalize: boolean
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useCaseReview(options: UseCaseReviewOptions): UseCaseReviewReturn {
  const { activityId } = options

  // Data state
  const [activity, setActivity] = useState<ActivityInfo | null>(null)
  const [scenarios, setScenarios] = useState<DetailedScenario[]>([])
  const [configuration, setConfiguration] = useState<CaseConfiguration | null>(null)
  const [warnings, setWarnings] = useState<FactCheckWarning[]>([])

  // UI state
  const [loading, setLoading] = useState(true)
  const [loadingTitle, setLoadingTitle] = useState('Loading Scenarios')
  const [loadingMessage, setLoadingMessage] = useState('Fetching scenario data...')
  const [factCheckProgress, setFactCheckProgress] = useState<number | null>(null)
  const [factCheckMessage, setFactCheckMessage] = useState('')
  const [expandedScenarios, setExpandedScenarios] = useState<Set<string>>(new Set())

  // ============================================================================
  // Load Scenarios
  // ============================================================================

  const loadScenarios = useCallback(async () => {
    try {
      setLoading(true)
      setLoadingTitle('Loading Scenarios')
      setLoadingMessage('Fetching scenario data...')

      const activityRes = await fetch(`/api/activities/${activityId}`)
      if (!activityRes.ok) throw new Error('Failed to load activity')
      const activityData = await activityRes.json()
      setActivity({ id: activityData.id, name: activityData.name })

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
  }, [activityId])

  useEffect(() => {
    loadScenarios()
  }, [loadScenarios])

  // ============================================================================
  // Scenario Actions
  // ============================================================================

  const toggleScenarioExpand = useCallback((scenarioId: string) => {
    setExpandedScenarios((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(scenarioId)) {
        newSet.delete(scenarioId)
      } else {
        newSet.add(scenarioId)
      }
      return newSet
    })
  }, [])

  const toggleActive = useCallback(async (scenarioId: string, newActiveState: boolean) => {
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
  }, [loadScenarios])

  const saveScenario = useCallback(async (
    scenario: DetailedScenario,
    updates: {
      title: string
      domain: string
      innovationName?: string
      content: string
      flaws?: unknown[]
      solutions?: unknown[]
    }
  ) => {
    setLoading(true)
    setLoadingTitle('Saving Changes')
    setLoadingMessage('Updating scenario...')

    try {
      const res = await fetch(`/api/case/scenario/${scenario.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: updates.title,
          domain: updates.domain,
          innovation_name: updates.innovationName || null,
          scenario_content: updates.content,
          expected_flaws: updates.flaws,
          expected_solutions: updates.solutions,
        }),
      })

      const data = await res.json()
      if (!data.success) {
        throw new Error(data.error || 'Failed to update scenario')
      }

      await loadScenarios()
      alert('Scenario updated successfully!')
    } catch (err) {
      alert('Failed to update scenario: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }, [loadScenarios])

  const regenerateScenario = useCallback(async (scenarioNumber: number) => {
    if (!confirm(`Regenerate scenario #${scenarioNumber}?\n\nThis will replace the existing scenario with a new AI-generated one.`)) {
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
      alert('Failed to regenerate scenario: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }, [activityId, loadScenarios])

  const deleteScenario = useCallback(async (scenarioId: string, scenarioNumber: number, title: string) => {
    if (!confirm(`Delete Scenario #${scenarioNumber}: "${title}"?\n\n⚠️ This cannot be undone.\n⚠️ This will decrease your scenario pool count.`)) {
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
  }, [activityId, loadScenarios])

  const addNewScenario = useCallback(async () => {
    const generateWithAI = confirm('Add a new scenario to the pool?\n\nOK = Generate with AI\nCancel = Create blank scenario')
    const nextNumber = scenarios.length + 1

    setLoading(true)
    setLoadingTitle(`Adding Scenario #${nextNumber}`)
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
  }, [activityId, loadScenarios, scenarios.length])

  // ============================================================================
  // Fact Check
  // ============================================================================

  const verifyFacts = useCallback(async () => {
    if (!confirm('Run fact verification on all scenarios?\n\nThis will check for unverifiable claims, outdated information, and technical inaccuracies.')) {
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
  }, [activityId, scenarios.length])

  // ============================================================================
  // Finalize
  // ============================================================================

  const finalizeActivity = useCallback(async () => {
    const activeCount = scenarios.filter((s) => s.is_active).length
    const minRequired = configuration?.num_cases_to_show || 2

    if (activeCount < minRequired) {
      alert(`Cannot finalize: Need at least ${minRequired} active scenarios (currently ${activeCount}).`)
      return
    }

    if (!confirm('Finalize this case activity?\n\n✅ Students will be able to take it\n✅ Scenarios are locked (can still edit)\n✅ Configuration is saved\n\nContinue?')) {
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
      window.location.href = `/activities/${activityId}/edit`
    } catch (err) {
      alert('Failed to finalize activity: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }, [activityId, configuration?.num_cases_to_show, scenarios])

  const dismissWarning = useCallback((index: number) => {
    setWarnings((prev) => prev.filter((_, i) => i !== index))
  }, [])

  // ============================================================================
  // Computed Values
  // ============================================================================

  const activeCount = scenarios.filter((s) => s.is_active).length
  const minRequired = configuration?.num_cases_to_show || 2
  const canFinalize = activeCount >= minRequired

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // Data
    activity,
    scenarios,
    configuration,
    warnings,

    // UI State
    loading,
    loadingTitle,
    loadingMessage,
    factCheckProgress,
    factCheckMessage,
    expandedScenarios,

    // Actions
    loadScenarios,
    toggleScenarioExpand,
    toggleActive,
    saveScenario,
    regenerateScenario,
    deleteScenario,
    addNewScenario,
    verifyFacts,
    finalizeActivity,
    dismissWarning,
    setWarnings,

    // Computed
    activeCount,
    minRequired,
    canFinalize,
  }
}
