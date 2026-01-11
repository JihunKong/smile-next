'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface CaseScenario {
  id: string
  title: string
  content: string
  domain?: string
}

interface CaseSettings {
  scenarios: CaseScenario[]
  timePerCase: number
  totalTimeLimit: number
  maxAttempts: number
  passThreshold: number
  is_published?: boolean
  source_material?: string
  num_cases_to_show?: number
  difficulty_level?: string
  anonymize_leaderboard?: boolean
}

interface ActivityInfo {
  id: string
  name: string
  description: string | null
  owningGroup: {
    id: string
    name: string
  }
}

export default function CaseConfigurePage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const activityId = params.id as string

  // Loading states
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationMessage, setGenerationMessage] = useState('')

  // Data states
  const [activity, setActivity] = useState<ActivityInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Settings form state
  const [timePerCase, setTimePerCase] = useState(10)
  const [totalTimeLimit, setTotalTimeLimit] = useState(60)
  const [passThreshold, setPassThreshold] = useState(6.0)
  const [maxAttempts, setMaxAttempts] = useState(1)
  const [numCasesToShow, setNumCasesToShow] = useState(2)
  const [difficultyLevel, setDifficultyLevel] = useState('professional')
  const [anonymizeLeaderboard, setAnonymizeLeaderboard] = useState(true)
  const [isPublished, setIsPublished] = useState(false)

  // Scenarios state
  const [scenarios, setScenarios] = useState<CaseScenario[]>([])
  const [editingScenario, setEditingScenario] = useState<CaseScenario | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newDomain, setNewDomain] = useState('')

  // AI Generation state
  const [sourceMaterial, setSourceMaterial] = useState('')
  const [showGenerateSection, setShowGenerateSection] = useState(false)

  // Drag reorder state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const loadActivity = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch activity info
      const activityRes = await fetch(`/api/activities/${activityId}/edit`)
      if (activityRes.status === 403) {
        setError('You do not have permission to configure this activity')
        return
      }
      if (!activityRes.ok) throw new Error('Failed to load activity')
      const activityData = await activityRes.json()

      // Check if this is a Case Mode activity
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

      // Load existing settings from openModeSettings
      const settings = activityData.openModeSettings as CaseSettings | null
      if (settings) {
        setTimePerCase(settings.timePerCase || 10)
        setTotalTimeLimit(settings.totalTimeLimit || 60)
        setPassThreshold(settings.passThreshold || 6.0)
        setMaxAttempts(settings.maxAttempts || 1)
        setNumCasesToShow(settings.num_cases_to_show || 2)
        setDifficultyLevel(settings.difficulty_level || 'professional')
        setAnonymizeLeaderboard(settings.anonymize_leaderboard !== false)
        setIsPublished(settings.is_published || false)
        setScenarios(settings.scenarios || [])
        if (settings.source_material) {
          setSourceMaterial(settings.source_material)
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

  async function saveSettings(publish: boolean = false) {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const settings: CaseSettings = {
        scenarios,
        timePerCase,
        totalTimeLimit,
        maxAttempts,
        passThreshold,
        is_published: publish ? true : isPublished,
        source_material: sourceMaterial || undefined,
        num_cases_to_show: numCasesToShow,
        difficulty_level: difficultyLevel,
        anonymize_leaderboard: anonymizeLeaderboard,
      }

      const res = await fetch(`/api/activities/${activityId}/case/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save settings')
      }

      if (publish) {
        setIsPublished(true)
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
  }

  async function generateScenarios() {
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

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setGenerationProgress((prev) => {
          if (prev < 80) return prev + 10
          return prev
        })
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

      // Reload to get updated scenarios
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
  }

  async function addScenario() {
    if (!newTitle.trim() || !newContent.trim()) {
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
          title: newTitle.trim(),
          content: newContent.trim(),
          domain: newDomain.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to add scenario')
      }

      const data = await res.json()
      setScenarios([...scenarios, data.scenario])
      setShowAddModal(false)
      setNewTitle('')
      setNewContent('')
      setNewDomain('')
      setSuccess('Scenario added successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  async function updateScenario() {
    if (!editingScenario) return

    try {
      setSaving(true)
      setError(null)

      const res = await fetch(`/api/activities/${activityId}/case/scenarios/${editingScenario.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingScenario.title,
          content: editingScenario.content,
          domain: editingScenario.domain,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update scenario')
      }

      setScenarios(scenarios.map((s) =>
        s.id === editingScenario.id ? editingScenario : s
      ))
      setEditingScenario(null)
      setSuccess('Scenario updated successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  async function deleteScenario(scenarioId: string) {
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

      setScenarios(scenarios.filter((s) => s.id !== scenarioId))
      setSuccess('Scenario deleted successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  // Drag and drop handlers
  function handleDragStart(index: number) {
    setDraggedIndex(index)
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newScenarios = [...scenarios]
    const [removed] = newScenarios.splice(draggedIndex, 1)
    newScenarios.splice(index, 0, removed)
    setScenarios(newScenarios)
    setDraggedIndex(index)
  }

  function handleDragEnd() {
    setDraggedIndex(null)
    // Save reordered scenarios
    saveReorderedScenarios()
  }

  async function saveReorderedScenarios() {
    try {
      await fetch(`/api/activities/${activityId}/case/scenarios`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarios }),
      })
    } catch (err) {
      console.error('Failed to save reordered scenarios:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="space-y-4">
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error && !activity) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link
            href={`/activities/${activityId}`}
            className="text-indigo-600 hover:underline"
          >
            Back to Activity
          </Link>
        </div>
      </div>
    )
  }

  if (!activity) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Configure Case Mode</h1>
              <p className="text-gray-600 mt-2">
                Activity: <span className="font-semibold">{activity.name}</span>
              </p>
            </div>
            <Link
              href={`/activities/${activityId}/edit`}
              className="bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-2 px-4 rounded-lg inline-flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Activity
            </Link>
          </div>

          {/* Info Alert */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">About Case Mode</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>Case Mode presents students with realistic business scenarios containing embedded ethical/logical flaws. Students analyze cases and propose solutions. AI evaluates responses on 4 criteria.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700">{success}</p>
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Configuration Settings */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <svg className="w-6 h-6 text-indigo-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Configuration Settings
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Cases Shown to Students */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cases Shown to Students <span className="text-red-500">*</span>
              </label>
              <select
                value={numCasesToShow}
                onChange={(e) => setNumCasesToShow(parseInt(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="1">1 case</option>
                <option value="2">2 cases (recommended)</option>
                <option value="3">3 cases</option>
                <option value="4">4 cases</option>
              </select>
              <p className="text-sm text-gray-500 mt-1">
                Students will see this many randomly selected cases from your pool.
              </p>
            </div>

            {/* Difficulty Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty Level <span className="text-red-500">*</span>
              </label>
              <select
                value={difficultyLevel}
                onChange={(e) => setDifficultyLevel(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="basic">Basic (Simple scenarios, obvious flaws)</option>
                <option value="intermediate">Intermediate (Moderate complexity)</option>
                <option value="professional">Professional (Complex, subtle flaws)</option>
              </select>
            </div>

            {/* Time Per Case */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Per Case (minutes) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={timePerCase}
                onChange={(e) => setTimePerCase(Math.max(1, Math.min(60, parseInt(e.target.value) || 1)))}
                min={1}
                max={60}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                Hard cutoff - cases auto-submit when time expires.
              </p>
            </div>

            {/* Total Time Limit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Time Limit (minutes) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={totalTimeLimit}
                onChange={(e) => setTotalTimeLimit(Math.max(1, Math.min(180, parseInt(e.target.value) || 1)))}
                min={1}
                max={180}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Pass Threshold */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pass Threshold (0-10 scale) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={passThreshold}
                onChange={(e) => setPassThreshold(Math.max(1, Math.min(10, parseFloat(e.target.value) || 1)))}
                min={1}
                max={10}
                step={0.5}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                Students must score at least this average across 4 criteria to pass.
              </p>
            </div>

            {/* Max Attempts */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Attempts <span className="text-red-500">*</span>
              </label>
              <select
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(parseInt(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <option key={n} value={n}>
                    {n} attempt{n > 1 ? 's' : ''} {n === 1 ? '(no retakes)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Anonymize Leaderboard */}
          <div className="mb-6">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={anonymizeLeaderboard}
                onChange={(e) => setAnonymizeLeaderboard(e.target.checked)}
                className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="ml-3 text-sm font-medium text-gray-700">
                Anonymize student names on leaderboard
              </span>
            </label>
            <p className="text-sm text-gray-500 mt-1 ml-8">
              When enabled, student names are masked for privacy (e.g., &quot;J. Kim *8472&quot;).
            </p>
          </div>
        </div>

        {/* AI Scenario Generation */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <svg className="w-6 h-6 text-purple-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Generate with AI
            </h2>
            <button
              onClick={() => setShowGenerateSection(!showGenerateSection)}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold"
            >
              {showGenerateSection ? 'Hide' : 'Show'}
            </button>
          </div>

          {showGenerateSection && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Source Material (Chapter/Article Text)
                </label>
                <textarea
                  value={sourceMaterial}
                  onChange={(e) => setSourceMaterial(e.target.value)}
                  rows={8}
                  placeholder="Paste the chapter, article, or educational material that will be the basis for case generation...

AI will extract key concepts and generate realistic business scenarios with embedded flaws for students to identify."
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                />
                <p className="text-sm text-gray-500 mt-2">
                  <svg className="w-4 h-4 inline mr-1 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Tip: Include clear concepts, frameworks, or principles that students should apply.
                </p>
              </div>

              {/* Generation Progress */}
              {generating && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="animate-spin rounded-full w-6 h-6 border-2 border-blue-600 border-t-transparent"></div>
                    </div>
                    <div className="ml-4 flex-1">
                      <h4 className="text-sm font-semibold text-blue-900">Generating...</h4>
                      <p className="text-sm text-blue-800 mt-1">{generationMessage}</p>
                      <div className="mt-3 w-full bg-blue-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${generationProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={generateScenarios}
                disabled={generating || !sourceMaterial || sourceMaterial.length < 100}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center transition"
                style={{ backgroundColor: generating || !sourceMaterial || sourceMaterial.length < 100 ? undefined : '#9333ea' }}
              >
                {generating ? (
                  <>
                    <div className="animate-spin rounded-full w-5 h-5 border-2 border-white border-t-transparent mr-2"></div>
                    Generating Scenarios...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Generate 8 Scenarios with AI
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Scenario Management */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <svg className="w-6 h-6 text-indigo-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Scenarios ({scenarios.length})
            </h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center"
              style={{ backgroundColor: '#4f46e5' }}
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Scenario
            </button>
          </div>

          {scenarios.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 mb-4">No scenarios yet. Add scenarios manually or use AI generation.</p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg"
                  style={{ backgroundColor: '#4f46e5' }}
                >
                  Add Manually
                </button>
                <button
                  onClick={() => setShowGenerateSection(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg"
                  style={{ backgroundColor: '#9333ea' }}
                >
                  Generate with AI
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 mb-4">
                Drag scenarios to reorder. Click edit to modify content.
              </p>
              {scenarios.map((scenario, index) => (
                <div
                  key={scenario.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`border border-gray-200 rounded-lg p-4 cursor-move hover:border-indigo-300 transition ${
                    draggedIndex === index ? 'opacity-50 border-indigo-500' : ''
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
                        onClick={() => setEditingScenario(scenario)}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-lg"
                        title="Edit"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteScenario(scenario.id)}
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
              ))}
            </div>
          )}
        </div>

        {/* Preview Section */}
        {scenarios.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <svg className="w-6 h-6 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Preview
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              This is how scenarios will appear to students (first {numCasesToShow} shown randomly):
            </p>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-indigo-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-indigo-600">{scenarios.length}</p>
                  <p className="text-sm text-gray-600">Total Scenarios</p>
                </div>
                <div className="bg-indigo-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-indigo-600">{timePerCase}</p>
                  <p className="text-sm text-gray-600">Min Per Case</p>
                </div>
                <div className="bg-indigo-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-indigo-600">{passThreshold}</p>
                  <p className="text-sm text-gray-600">Pass Threshold</p>
                </div>
              </div>
              <div className="space-y-2">
                {scenarios.slice(0, numCasesToShow).map((scenario, index) => (
                  <div key={scenario.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
                    <span className="w-8 h-8 flex items-center justify-center bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                      {index + 1}
                    </span>
                    <span className="font-medium text-gray-800">{scenario.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t bg-white rounded-lg shadow-md p-6">
          <div>
            <p className="text-sm text-gray-600">
              <svg className="w-4 h-4 inline mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {isPublished
                ? 'Case study is published and visible to students.'
                : 'Save as draft to continue editing, or publish to make available to students.'}
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/activities/${activityId}/edit`}
              className="bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 px-6 rounded-lg"
            >
              Cancel
            </Link>
            <button
              onClick={() => saveSettings(false)}
              disabled={saving}
              className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center disabled:opacity-50"
              style={{ backgroundColor: '#4b5563' }}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full w-4 h-4 border-2 border-white border-t-transparent mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Save as Draft
                </>
              )}
            </button>
            <button
              onClick={() => saveSettings(true)}
              disabled={saving || scenarios.length < numCasesToShow}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg flex items-center"
              style={{ backgroundColor: saving || scenarios.length < numCasesToShow ? undefined : '#059669' }}
              title={scenarios.length < numCasesToShow ? `Need at least ${numCasesToShow} scenarios to publish` : ''}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full w-4 h-4 border-2 border-white border-t-transparent mr-2"></div>
                  Publishing...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save &amp; Publish
                </>
              )}
            </button>
          </div>
        </div>

        {/* Review Link */}
        {scenarios.length > 0 && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-green-800 font-medium">
                  {scenarios.length} scenarios ready for review
                </span>
              </div>
              <Link
                href={`/activities/${activityId}/case/review`}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center"
                style={{ backgroundColor: '#4f46e5' }}
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Review &amp; Edit Scenarios
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Add Scenario Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Add New Scenario</h2>
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setNewTitle('')
                    setNewContent('')
                    setNewDomain('')
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
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
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
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
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    placeholder="e.g., Technology, Healthcare, Finance"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    rows={10}
                    placeholder="Describe the business scenario with embedded flaws for students to identify..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setNewTitle('')
                    setNewContent('')
                    setNewDomain('')
                  }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 px-6 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={addScenario}
                  disabled={saving || !newTitle.trim() || !newContent.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg"
                  style={{ backgroundColor: saving || !newTitle.trim() || !newContent.trim() ? undefined : '#4f46e5' }}
                >
                  {saving ? 'Adding...' : 'Add Scenario'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Scenario Modal */}
      {editingScenario && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Edit Scenario</h2>
                <button
                  onClick={() => setEditingScenario(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
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
                    value={editingScenario.title}
                    onChange={(e) => setEditingScenario({ ...editingScenario, title: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Domain (Optional)
                  </label>
                  <input
                    type="text"
                    value={editingScenario.domain || ''}
                    onChange={(e) => setEditingScenario({ ...editingScenario, domain: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={editingScenario.content}
                    onChange={(e) => setEditingScenario({ ...editingScenario, content: e.target.value })}
                    rows={10}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setEditingScenario(null)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 px-6 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={updateScenario}
                  disabled={saving || !editingScenario.title.trim() || !editingScenario.content.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg"
                  style={{ backgroundColor: saving || !editingScenario.title.trim() || !editingScenario.content.trim() ? undefined : '#4f46e5' }}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
