'use client'

import { useState, useCallback, useEffect } from 'react'
import type { CaseScenario, CaseSettings, ActivityInfo } from '../types'

// ============================================================================
// Types
// ============================================================================

export interface UseCaseSettingsOptions {
  activityId: string
}

export interface CaseSettingsState {
  timePerCase: number
  totalTimeLimit: number
  passThreshold: number
  maxAttempts: number
  numCasesToShow: number
  difficultyLevel: string
  anonymizeLeaderboard: boolean
  isPublished: boolean
}

export interface UseCaseSettingsReturn {
  // Data
  activity: ActivityInfo | null
  scenarios: CaseScenario[]
  settings: CaseSettingsState
  sourceMaterial: string

  // State
  loading: boolean
  saving: boolean
  generating: boolean
  generationProgress: number
  generationMessage: string
  error: string | null
  success: string | null

  // Actions
  loadActivity: () => Promise<void>
  updateSetting: <K extends keyof CaseSettingsState>(key: K, value: CaseSettingsState[K]) => void
  setSourceMaterial: (value: string) => void
  saveSettings: (publish?: boolean) => Promise<void>
  generateScenarios: () => Promise<void>
  addScenario: (title: string, content: string, domain?: string) => Promise<void>
  updateScenario: (scenario: CaseScenario) => Promise<void>
  deleteScenario: (scenarioId: string) => Promise<void>
  reorderScenarios: (scenarios: CaseScenario[]) => void
  saveReorderedScenarios: () => Promise<void>

  // UI helpers
  setError: (error: string | null) => void
  setSuccess: (success: string | null) => void
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useCaseSettings(options: UseCaseSettingsOptions): UseCaseSettingsReturn {
  const { activityId } = options

  // Data state
  const [activity, setActivity] = useState<ActivityInfo | null>(null)
  const [scenarios, setScenarios] = useState<CaseScenario[]>([])
  const [sourceMaterial, setSourceMaterial] = useState('')

  // Settings state
  const [settings, setSettings] = useState<CaseSettingsState>({
    timePerCase: 10,
    totalTimeLimit: 60,
    passThreshold: 6.0,
    maxAttempts: 1,
    numCasesToShow: 2,
    difficultyLevel: 'professional',
    anonymizeLeaderboard: true,
    isPublished: false,
  })

  // UI state
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationMessage, setGenerationMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // ============================================================================
  // Load Activity Data
  // ============================================================================

  const loadActivity = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const activityRes = await fetch(`/api/activities/${activityId}/edit`)
      if (activityRes.status === 403) {
        setError('You do not have permission to configure this activity')
        return
      }
      if (!activityRes.ok) throw new Error('Failed to load activity')
      const activityData = await activityRes.json()

      if (activityData.mode !== 3) {
        setError('This is not a Case Mode activity')
        return
      }

      setActivity({
        id: activityData.id,
        name: activityData.name,
        description: activityData.description,
        owningGroup: activityData.owningGroup,
      })

      const caseSettings = activityData.openModeSettings as CaseSettings | null
      if (caseSettings) {
        setSettings({
          timePerCase: caseSettings.timePerCase || 10,
          totalTimeLimit: caseSettings.totalTimeLimit || 60,
          passThreshold: caseSettings.passThreshold || 6.0,
          maxAttempts: caseSettings.maxAttempts || 1,
          numCasesToShow: caseSettings.num_cases_to_show || 2,
          difficultyLevel: caseSettings.difficulty_level || 'professional',
          anonymizeLeaderboard: caseSettings.anonymize_leaderboard !== false,
          isPublished: caseSettings.is_published || false,
        })
        setScenarios(caseSettings.scenarios || [])
        if (caseSettings.source_material) {
          setSourceMaterial(caseSettings.source_material)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [activityId])

  useEffect(() => {
    loadActivity()
  }, [loadActivity])

  // ============================================================================
  // Settings Management
  // ============================================================================

  const updateSetting = useCallback(<K extends keyof CaseSettingsState>(key: K, value: CaseSettingsState[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }, [])

  const saveSettings = useCallback(async (publish: boolean = false) => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const settingsPayload: CaseSettings = {
        scenarios,
        timePerCase: settings.timePerCase,
        totalTimeLimit: settings.totalTimeLimit,
        maxAttempts: settings.maxAttempts,
        passThreshold: settings.passThreshold,
        is_published: publish ? true : settings.isPublished,
        source_material: sourceMaterial || undefined,
        num_cases_to_show: settings.numCasesToShow,
        difficulty_level: settings.difficultyLevel,
        anonymize_leaderboard: settings.anonymizeLeaderboard,
      }

      const res = await fetch(`/api/activities/${activityId}/case/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsPayload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save settings')
      }

      if (publish) {
        setSettings((prev) => ({ ...prev, isPublished: true }))
        setSuccess('Settings saved and case study published!')
      } else {
        setSuccess('Settings saved as draft!')
      }

      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSaving(false)
    }
  }, [activityId, scenarios, settings, sourceMaterial])

  // ============================================================================
  // AI Generation
  // ============================================================================

  const generateScenarios = useCallback(async () => {
    if (!sourceMaterial || sourceMaterial.length < 100) {
      setError('Please provide source material with at least 100 characters')
      return
    }

    const confirmGenerate = scenarios.length > 0
      ? window.confirm('This will replace existing scenarios. Continue?')
      : true

    if (!confirmGenerate) return

    try {
      setGenerating(true)
      setError(null)
      setGenerationProgress(10)
      setGenerationMessage('Preparing to generate scenarios...')

      const progressInterval = setInterval(() => {
        setGenerationProgress((prev) => (prev < 80 ? prev + 10 : prev))
      }, 3000)

      setGenerationMessage('AI is generating business case scenarios...')

      const res = await fetch(`/api/activities/${activityId}/case/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterContent: sourceMaterial,
          count: 8,
          includeFlaws: true,
        }),
      })

      clearInterval(progressInterval)

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to generate scenarios')
      }

      const data = await res.json()
      setGenerationProgress(100)
      setGenerationMessage(`Generated ${data.scenarios?.length || 0} scenarios successfully!`)

      await loadActivity()

      setTimeout(() => {
        setGenerating(false)
        setGenerationProgress(0)
        setGenerationMessage('')
      }, 1500)
    } catch (err) {
      setGenerating(false)
      setGenerationProgress(0)
      setGenerationMessage('')
      setError(err instanceof Error ? err.message : 'Failed to generate scenarios')
    }
  }, [activityId, loadActivity, scenarios.length, sourceMaterial])

  // ============================================================================
  // Scenario CRUD
  // ============================================================================

  const addScenario = useCallback(async (title: string, content: string, domain?: string) => {
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required')
      return
    }

    try {
      setSaving(true)
      setError(null)

      const res = await fetch(`/api/activities/${activityId}/case/scenarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          domain: domain?.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to add scenario')
      }

      const data = await res.json()
      setScenarios((prev) => [...prev, data.scenario])
      setSuccess('Scenario added successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSaving(false)
    }
  }, [activityId])

  const updateScenario = useCallback(async (scenario: CaseScenario) => {
    try {
      setSaving(true)
      setError(null)

      const res = await fetch(`/api/activities/${activityId}/case/scenarios/${scenario.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: scenario.title,
          content: scenario.content,
          domain: scenario.domain,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update scenario')
      }

      setScenarios((prev) => prev.map((s) => (s.id === scenario.id ? scenario : s)))
      setSuccess('Scenario updated successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSaving(false)
    }
  }, [activityId])

  const deleteScenario = useCallback(async (scenarioId: string) => {
    if (!window.confirm('Delete this scenario? This cannot be undone.')) return

    try {
      setSaving(true)
      setError(null)

      const res = await fetch(`/api/activities/${activityId}/case/scenarios/${scenarioId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete scenario')
      }

      setScenarios((prev) => prev.filter((s) => s.id !== scenarioId))
      setSuccess('Scenario deleted successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSaving(false)
    }
  }, [activityId])

  // ============================================================================
  // Reordering
  // ============================================================================

  const reorderScenarios = useCallback((newScenarios: CaseScenario[]) => {
    setScenarios(newScenarios)
  }, [])

  const saveReorderedScenarios = useCallback(async () => {
    try {
      await fetch(`/api/activities/${activityId}/case/scenarios`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarios }),
      })
    } catch (err) {
      console.error('Failed to save reordered scenarios:', err)
    }
  }, [activityId, scenarios])

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // Data
    activity,
    scenarios,
    settings,
    sourceMaterial,

    // State
    loading,
    saving,
    generating,
    generationProgress,
    generationMessage,
    error,
    success,

    // Actions
    loadActivity,
    updateSetting,
    setSourceMaterial,
    saveSettings,
    generateScenarios,
    addScenario,
    updateScenario,
    deleteScenario,
    reorderScenarios,
    saveReorderedScenarios,

    // UI helpers
    setError,
    setSuccess,
  }
}
