'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ModeSelector } from '@/components/modes/ModeSelector'
import { LoadingSpinner } from '@/components/ui'
import {
  ActivityModes,
  type ActivityMode,
  type ExamSettings,
  type InquirySettings,
  type CaseSettings,
  type CaseScenario,
  defaultExamSettings,
  defaultInquirySettings,
  defaultCaseSettings,
} from '@/types/activities'

interface GroupOption {
  id: string
  name: string
  role: number
}

export default function CreateActivityPage() {
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [groups, setGroups] = useState<GroupOption[]>([])
  const [loadingGroups, setLoadingGroups] = useState(true)

  // Basic settings
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [selectedMode, setSelectedMode] = useState<ActivityMode>(ActivityModes.OPEN)
  const [aiRatingEnabled, setAiRatingEnabled] = useState(true)
  const [allowAnonymous, setAllowAnonymous] = useState(false)
  const [hideUsernames, setHideUsernames] = useState(false)
  const [isPublished, setIsPublished] = useState(false)

  // Mode-specific settings
  const [examSettings, setExamSettings] = useState<ExamSettings>(defaultExamSettings)
  const [inquirySettings, setInquirySettings] = useState<InquirySettings>(defaultInquirySettings)
  const [caseSettings, setCaseSettings] = useState<CaseSettings>(defaultCaseSettings)

  // Keyword input helpers
  const [keyword1Input, setKeyword1Input] = useState('')
  const [keyword2Input, setKeyword2Input] = useState('')

  // Case scenario helpers
  const [newScenarioTitle, setNewScenarioTitle] = useState('')
  const [newScenarioContent, setNewScenarioContent] = useState('')

  // Fetch user's groups where they can create activities (role >= 1)
  useEffect(() => {
    async function fetchGroups() {
      try {
        const response = await fetch('/api/groups/my-teachable')
        if (response.ok) {
          const data = await response.json()
          setGroups(data.groups || [])
          if (data.groups?.length > 0) {
            setSelectedGroupId(data.groups[0].id)
          }
        }
      } catch (err) {
        console.error('Failed to fetch groups:', err)
      } finally {
        setLoadingGroups(false)
      }
    }
    fetchGroups()
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (!selectedGroupId) {
      setError('Please select a group')
      setIsLoading(false)
      return
    }

    if (!name.trim()) {
      setError('Please enter an activity name')
      setIsLoading(false)
      return
    }

    // Prepare mode-specific settings
    let modeSettings = {}
    if (selectedMode === ActivityModes.EXAM) {
      modeSettings = { examSettings }
    } else if (selectedMode === ActivityModes.INQUIRY) {
      modeSettings = { inquirySettings }
    } else if (selectedMode === ActivityModes.CASE) {
      modeSettings = { caseSettings: { ...caseSettings, is_published: isPublished } }
    }

    try {
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          groupId: selectedGroupId,
          mode: selectedMode,
          aiRatingEnabled,
          isAnonymousAuthorAllowed: allowAnonymous,
          hideUsernames,
          isPublished,
          ...modeSettings,
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        router.push(`/activities/${result.data.activityId}`)
      } else {
        setError(result.error || 'Failed to create activity')
        setIsLoading(false)
      }
    } catch (err) {
      console.error('Failed to create activity:', err)
      setError('Failed to create activity. Please try again.')
      setIsLoading(false)
    }
  }

  function addKeyword(pool: 1 | 2) {
    if (pool === 1 && keyword1Input.trim()) {
      setInquirySettings({
        ...inquirySettings,
        keywordPool1: [...inquirySettings.keywordPool1, keyword1Input.trim()],
      })
      setKeyword1Input('')
    } else if (pool === 2 && keyword2Input.trim()) {
      setInquirySettings({
        ...inquirySettings,
        keywordPool2: [...inquirySettings.keywordPool2, keyword2Input.trim()],
      })
      setKeyword2Input('')
    }
  }

  function removeKeyword(pool: 1 | 2, index: number) {
    if (pool === 1) {
      setInquirySettings({
        ...inquirySettings,
        keywordPool1: inquirySettings.keywordPool1.filter((_, i) => i !== index),
      })
    } else {
      setInquirySettings({
        ...inquirySettings,
        keywordPool2: inquirySettings.keywordPool2.filter((_, i) => i !== index),
      })
    }
  }

  function addScenario() {
    if (newScenarioTitle.trim() && newScenarioContent.trim()) {
      const newScenario: CaseScenario = {
        id: crypto.randomUUID(),
        title: newScenarioTitle.trim(),
        content: newScenarioContent.trim(),
      }
      setCaseSettings({
        ...caseSettings,
        scenarios: [...caseSettings.scenarios, newScenario],
      })
      setNewScenarioTitle('')
      setNewScenarioContent('')
    }
  }

  function removeScenario(id: string) {
    setCaseSettings({
      ...caseSettings,
      scenarios: caseSettings.scenarios.filter((s) => s.id !== id),
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-[var(--stanford-cardinal)] to-[var(--stanford-pine)] text-white py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/activities" className="inline-flex items-center gap-1 text-white/80 hover:text-white mb-4">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Activities
          </Link>
          <h1 className="text-2xl font-bold">Create New Activity</h1>
          <p className="text-white/80 mt-1">Set up a learning activity for your group</p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Group Selection Card */}
          <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Select Group</h2>

            {loadingGroups ? (
              <div className="flex items-center gap-2 text-gray-500">
                <LoadingSpinner size="sm" />
                Loading groups...
              </div>
            ) : groups.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 text-sm">
                  You don&apos;t have permission to create activities in any group. You need to be an admin, co-owner, or owner of a group.
                </p>
                <Link href="/groups/create" className="text-yellow-900 underline text-sm mt-2 inline-block">
                  Create a new group
                </Link>
              </div>
            ) : (
              <div>
                <label htmlFor="groupId" className="block text-sm font-medium text-gray-700 mb-1">
                  Group <span className="text-red-500">*</span>
                </label>
                <select
                  id="groupId"
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--stanford-cardinal)] focus:border-transparent outline-none transition"
                >
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name} ({group.role === 3 ? 'Owner' : group.role === 2 ? 'Co-Owner' : 'Admin'})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Only groups where you have admin privileges are shown.</p>
              </div>
            )}
          </div>

          {/* Basic Info Card */}
          <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>

            {/* Activity Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Activity Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={200}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--stanford-cardinal)] focus:border-transparent outline-none transition"
                placeholder="e.g., Week 1 Discussion Questions"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={1000}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--stanford-cardinal)] focus:border-transparent outline-none transition resize-none"
                placeholder="Describe what this activity is about..."
              />
              <p className="text-xs text-gray-500 mt-1">Optional. Maximum 1000 characters.</p>
            </div>
          </div>

          {/* Mode Selection Card */}
          <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Activity Mode</h2>
            <p className="text-sm text-gray-600">Choose how students will interact with this activity</p>
            <ModeSelector selectedMode={selectedMode} onModeChange={setSelectedMode} />

            {/* Mode descriptions */}
            {selectedMode === ActivityModes.OPEN && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <p className="text-sm text-blue-800">
                  <strong>Open Mode:</strong> Standard Q&A format. Students can post questions, and the AI evaluates question quality using Bloom&apos;s Taxonomy.
                </p>
              </div>
            )}
            {selectedMode === ActivityModes.EXAM && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                <p className="text-sm text-red-800">
                  <strong>Exam Mode:</strong> Timed multiple choice assessment. After creating, you can add questions or use AI to generate them.
                </p>
              </div>
            )}
            {selectedMode === ActivityModes.INQUIRY && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                <p className="text-sm text-yellow-800">
                  <strong>Inquiry Mode:</strong> Students generate questions using keyword pairs. AI evaluates question quality and critical thinking level.
                </p>
              </div>
            )}
            {selectedMode === ActivityModes.CASE && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                <p className="text-sm text-green-800">
                  <strong>Case Mode:</strong> Business case scenario analysis. Students identify flaws and propose solutions. AI evaluates responses on multiple criteria.
                </p>
              </div>
            )}
          </div>

          {/* Mode-specific Settings */}
          {selectedMode === ActivityModes.EXAM && (
            <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Exam Settings
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time Limit (minutes)</label>
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={examSettings.timeLimit}
                    onChange={(e) => setExamSettings({ ...examSettings, timeLimit: parseInt(e.target.value) || 30 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">0 = no limit</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Questions to Show</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={examSettings.questionsToShow}
                    onChange={(e) => setExamSettings({ ...examSettings, questionsToShow: parseInt(e.target.value) || 10 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Random selection from pool</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pass Threshold (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={examSettings.passThreshold}
                    onChange={(e) => setExamSettings({ ...examSettings, passThreshold: parseInt(e.target.value) || 60 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Attempts</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={examSettings.maxAttempts}
                    onChange={(e) => setExamSettings({ ...examSettings, maxAttempts: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={examSettings.shuffleQuestions}
                    onChange={(e) => setExamSettings({ ...examSettings, shuffleQuestions: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">Shuffle Questions</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={examSettings.shuffleChoices}
                    onChange={(e) => setExamSettings({ ...examSettings, shuffleChoices: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">Shuffle Choices</span>
                </label>
              </div>

              <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                Note: You&apos;ll need to add multiple choice questions after creating this activity.
              </p>
            </div>
          )}

          {selectedMode === ActivityModes.INQUIRY && (
            <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Inquiry Settings
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Questions Required</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={inquirySettings.questionsRequired}
                    onChange={(e) => setInquirySettings({ ...inquirySettings, questionsRequired: parseInt(e.target.value) || 5 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time Per Question (seconds)</label>
                  <input
                    type="number"
                    min={60}
                    max={600}
                    value={inquirySettings.timePerQuestion}
                    onChange={(e) => setInquirySettings({ ...inquirySettings, timePerQuestion: parseInt(e.target.value) || 240 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pass Threshold (Score 0-10)</label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    step={0.5}
                    value={inquirySettings.passThreshold}
                    onChange={(e) => setInquirySettings({ ...inquirySettings, passThreshold: parseFloat(e.target.value) || 6 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              {/* Keyword Pool 1 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Keyword Pool 1 (Concepts)</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={keyword1Input}
                    onChange={(e) => setKeyword1Input(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword(1))}
                    placeholder="Add keyword..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => addKeyword(1)}
                    className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {inquirySettings.keywordPool1.map((kw, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                      {kw}
                      <button type="button" onClick={() => removeKeyword(1, i)} className="hover:text-red-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Keyword Pool 2 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Keyword Pool 2 (Actions/Contexts)</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={keyword2Input}
                    onChange={(e) => setKeyword2Input(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword(2))}
                    placeholder="Add keyword..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => addKeyword(2)}
                    className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {inquirySettings.keywordPool2.map((kw, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                      {kw}
                      <button type="button" onClick={() => removeKeyword(2, i)} className="hover:text-red-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {selectedMode === ActivityModes.CASE && (
            <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Case Study Settings
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time Per Case (minutes)</label>
                  <input
                    type="number"
                    min={5}
                    max={60}
                    value={caseSettings.timePerCase}
                    onChange={(e) => setCaseSettings({ ...caseSettings, timePerCase: parseInt(e.target.value) || 10 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Time Limit (minutes)</label>
                  <input
                    type="number"
                    min={10}
                    max={180}
                    value={caseSettings.totalTimeLimit}
                    onChange={(e) => setCaseSettings({ ...caseSettings, totalTimeLimit: parseInt(e.target.value) || 60 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Attempts</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={caseSettings.maxAttempts}
                    onChange={(e) => setCaseSettings({ ...caseSettings, maxAttempts: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pass Threshold (Score 0-10)</label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    step={0.5}
                    value={caseSettings.passThreshold}
                    onChange={(e) => setCaseSettings({ ...caseSettings, passThreshold: parseFloat(e.target.value) || 6 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              {/* Add Scenario */}
              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-900 mb-3">Add Case Scenarios</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newScenarioTitle}
                    onChange={(e) => setNewScenarioTitle(e.target.value)}
                    placeholder="Scenario title..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                  <textarea
                    value={newScenarioContent}
                    onChange={(e) => setNewScenarioContent(e.target.value)}
                    placeholder="Describe the business case scenario..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
                  />
                  <button
                    type="button"
                    onClick={addScenario}
                    disabled={!newScenarioTitle.trim() || !newScenarioContent.trim()}
                    className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Scenario
                  </button>
                </div>
              </div>

              {/* Scenario List */}
              {caseSettings.scenarios.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900">Scenarios ({caseSettings.scenarios.length})</h3>
                  {caseSettings.scenarios.map((scenario, index) => (
                    <div key={scenario.id} className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {index + 1}. {scenario.title}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{scenario.content}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeScenario(scenario.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                Tip: You can also use AI to generate case scenarios after creating the activity.
              </p>
            </div>
          )}

          {/* General Settings Card */}
          <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">General Settings</h2>

            {/* AI Rating Toggle */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">AI Rating</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Enable AI evaluation of questions using Bloom&apos;s Taxonomy
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aiRatingEnabled}
                    onChange={(e) => setAiRatingEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--stanford-cardinal)]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--stanford-cardinal)]"></div>
                </label>
              </div>
            </div>

            {/* Anonymous Questions Toggle */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Allow Anonymous Questions</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Let students submit questions without showing their name
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowAnonymous}
                    onChange={(e) => setAllowAnonymous(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--stanford-cardinal)]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--stanford-cardinal)]"></div>
                </label>
              </div>
            </div>

            {/* Hide Usernames Toggle */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Hide Usernames</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Hide all student names on questions (instructor can still see)
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hideUsernames}
                    onChange={(e) => setHideUsernames(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--stanford-cardinal)]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--stanford-cardinal)]"></div>
                </label>
              </div>
            </div>

            {/* Publish Toggle */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Publish Activity</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Make this activity visible to students immediately
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--stanford-cardinal)]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--stanford-cardinal)]"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-4 pt-4">
            <Link
              href="/activities"
              className="px-6 py-2.5 text-gray-700 font-medium hover:text-gray-900 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading || groups.length === 0}
              className="px-6 py-2.5 bg-[var(--stanford-cardinal)] text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  Creating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Activity
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
