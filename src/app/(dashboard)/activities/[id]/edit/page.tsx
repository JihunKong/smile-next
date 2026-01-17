'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface OpenModeSettings {
  is_pass_fail_enabled?: boolean
  required_question_count?: number
  required_avg_level?: number
  required_avg_score?: number
  peer_ratings_required?: number
  peer_responses_required?: number
  instructions?: string
}

interface ActivityData {
  id: string
  name: string
  description: string | null
  activityType: string
  mode: number
  level: string | null
  visible: boolean
  educationLevel: string | null
  schoolSubject: string | null
  topic: string | null
  hideUsernames: boolean
  isAnonymousAuthorAllowed: boolean
  openModeSettings: OpenModeSettings | null
  examSettings: ExamSettings | null
  inquirySettings: InquirySettings | null
  owningGroup: {
    id: string
    name: string
  }
  hasQuestions: boolean
  hasAttempts: boolean
}

interface ExamSettings {
  time_limit_minutes?: number
  passing_threshold?: number
  max_attempts?: number
  allow_reattempts?: boolean
  show_feedback?: boolean
  show_leaderboard?: boolean
  anonymize_leaderboard?: boolean
  randomize_questions?: boolean
  randomize_answer_choices?: boolean
  exam_question_count?: number
  is_published?: boolean
  instructions?: string
}

interface InquirySettings {
  show_leaderboard?: boolean
  allow_hints?: boolean
  max_hints?: number
  is_published?: boolean
}

const modeLabels: Record<number, string> = {
  0: 'Open Mode',
  1: 'Exam Mode',
  2: 'Inquiry Mode',
  3: 'Case Mode',
}

export default function ActivityEditPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const activityId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [activity, setActivity] = useState<ActivityData | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [level, setLevel] = useState('')
  const [visible, setVisible] = useState(true)
  const [educationLevel, setEducationLevel] = useState('')
  const [schoolSubject, setSchoolSubject] = useState('')
  const [topic, setTopic] = useState('')
  const [hideUsernames, setHideUsernames] = useState(false)
  const [isAnonymousAuthorAllowed, setIsAnonymousAuthorAllowed] = useState(false)

  // Exam settings
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(60)
  const [passingThreshold, setPassingThreshold] = useState(70)
  const [maxAttempts, setMaxAttempts] = useState(1)
  const [allowReattempts, setAllowReattempts] = useState(false)
  const [showFeedback, setShowFeedback] = useState(true)
  const [showLeaderboard, setShowLeaderboard] = useState(true)
  const [anonymizeLeaderboard, setAnonymizeLeaderboard] = useState(false)
  const [randomizeQuestions, setRandomizeQuestions] = useState(false)
  const [randomizeAnswerChoices, setRandomizeAnswerChoices] = useState(false)
  const [examQuestionCount, setExamQuestionCount] = useState(25)
  const [isPublished, setIsPublished] = useState(false)
  const [examInstructions, setExamInstructions] = useState('')
  // Scheduling settings
  const [examStartDate, setExamStartDate] = useState('')
  const [examEndDate, setExamEndDate] = useState('')
  const [questionPoolSize, setQuestionPoolSize] = useState(0)

  // Inquiry settings
  const [inquiryShowLeaderboard, setInquiryShowLeaderboard] = useState(true)
  const [allowHints, setAllowHints] = useState(false)
  const [maxHints, setMaxHints] = useState(3)
  const [inquiryIsPublished, setInquiryIsPublished] = useState(false)
  const [inquiryTheme, setInquiryTheme] = useState('')
  const [referenceDocument, setReferenceDocument] = useState('')
  const [minWordCount, setMinWordCount] = useState(10)
  const [maxWordCount, setMaxWordCount] = useState(500)
  const [qualityThreshold, setQualityThreshold] = useState(6.0)
  const [inquiryMaxAttempts, setInquiryMaxAttempts] = useState(3)

  // Open Mode settings
  const [isPassFailEnabled, setIsPassFailEnabled] = useState(false)
  const [requiredQuestionCount, setRequiredQuestionCount] = useState(1)
  const [requiredAvgLevel, setRequiredAvgLevel] = useState(2.0)
  const [requiredAvgScore, setRequiredAvgScore] = useState(5.0)
  const [peerRatingsRequired, setPeerRatingsRequired] = useState(0)
  const [peerResponsesRequired, setPeerResponsesRequired] = useState(0)
  const [openModeInstructions, setOpenModeInstructions] = useState('')

  useEffect(() => {
    loadActivity()
  }, [activityId])

  async function loadActivity() {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch(`/api/activities/${activityId}/edit`)
      if (!res.ok) {
        if (res.status === 403) {
          setError('You do not have permission to edit this activity')
        } else if (res.status === 404) {
          setError('Activity not found')
        } else {
          throw new Error('Failed to load activity')
        }
        return
      }

      const data: ActivityData = await res.json()
      setActivity(data)

      // Set form values
      setName(data.name)
      setDescription(data.description || '')
      setLevel(data.level || '')
      setVisible(data.visible)
      setEducationLevel(data.educationLevel || '')
      setSchoolSubject(data.schoolSubject || '')
      setTopic(data.topic || '')
      setHideUsernames(data.hideUsernames)
      setIsAnonymousAuthorAllowed(data.isAnonymousAuthorAllowed)

      // Exam settings
      if (data.examSettings) {
        setTimeLimitMinutes(data.examSettings.time_limit_minutes || 60)
        setPassingThreshold(data.examSettings.passing_threshold || 70)
        setMaxAttempts(data.examSettings.max_attempts || 1)
        setAllowReattempts(data.examSettings.allow_reattempts || false)
        setShowFeedback(data.examSettings.show_feedback !== false)
        setShowLeaderboard(data.examSettings.show_leaderboard !== false)
        setAnonymizeLeaderboard(data.examSettings.anonymize_leaderboard || false)
        setRandomizeQuestions(data.examSettings.randomize_questions || false)
        setRandomizeAnswerChoices(data.examSettings.randomize_answer_choices || false)
        setExamQuestionCount(data.examSettings.exam_question_count || 25)
        setIsPublished(data.examSettings.is_published || false)
        setExamInstructions(data.examSettings.instructions || '')
      }

      // Inquiry settings
      if (data.inquirySettings) {
        setInquiryShowLeaderboard(data.inquirySettings.show_leaderboard !== false)
        setAllowHints(data.inquirySettings.allow_hints || false)
        setMaxHints(data.inquirySettings.max_hints || 3)
        setInquiryIsPublished(data.inquirySettings.is_published !== false)
      }

      // Open Mode settings
      if (data.openModeSettings) {
        setIsPassFailEnabled(data.openModeSettings.is_pass_fail_enabled || false)
        setRequiredQuestionCount(data.openModeSettings.required_question_count || 1)
        setRequiredAvgLevel(data.openModeSettings.required_avg_level || 2.0)
        setRequiredAvgScore(data.openModeSettings.required_avg_score || 5.0)
        setPeerRatingsRequired(data.openModeSettings.peer_ratings_required || 0)
        setPeerResponsesRequired(data.openModeSettings.peer_responses_required || 0)
        setOpenModeInstructions(data.openModeSettings.instructions || '')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!activity) return

    try {
      setSaving(true)
      setError(null)
      setSuccess(false)

      const payload: Record<string, unknown> = {
        name,
        description: description || null,
        level: level || null,
        visible,
        educationLevel: educationLevel || null,
        schoolSubject: schoolSubject || null,
        topic: topic || null,
        hideUsernames,
        isAnonymousAuthorAllowed,
      }

      // Add mode-specific settings
      if (activity.mode === 0) {
        // Open Mode
        payload.openModeSettings = {
          is_pass_fail_enabled: isPassFailEnabled,
          required_question_count: requiredQuestionCount,
          required_avg_level: requiredAvgLevel,
          required_avg_score: requiredAvgScore,
          peer_ratings_required: peerRatingsRequired,
          peer_responses_required: peerResponsesRequired,
          instructions: openModeInstructions || null,
        }
      } else if (activity.mode === 1) {
        // Exam Mode
        payload.examSettings = {
          time_limit_minutes: timeLimitMinutes,
          passing_threshold: passingThreshold,
          max_attempts: maxAttempts,
          allow_reattempts: allowReattempts,
          show_feedback: showFeedback,
          show_leaderboard: showLeaderboard,
          anonymize_leaderboard: anonymizeLeaderboard,
          randomize_questions: randomizeQuestions,
          randomize_answer_choices: randomizeAnswerChoices,
          exam_question_count: examQuestionCount,
          is_published: isPublished,
          instructions: examInstructions || null,
        }
      } else if (activity.mode === 2) {
        // Inquiry Mode
        payload.inquirySettings = {
          show_leaderboard: inquiryShowLeaderboard,
          allow_hints: allowHints,
          max_hints: maxHints,
          is_published: inquiryIsPublished,
        }
      }

      const res = await fetch(`/api/activities/${activityId}/edit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save changes')
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="space-y-4">
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded w-1/2"></div>
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

  const modeLocked = activity.hasQuestions || activity.hasAttempts

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/activities/${activityId}`}
            className="text-indigo-600 hover:underline text-sm mb-2 inline-block"
          >
            &larr; Back to Activity
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Edit Activity</h1>
          <p className="text-gray-600 mt-1">
            {activity.owningGroup.name} &gt; {activity.name}
          </p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700">Changes saved successfully!</p>
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Basic Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Activity Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Activity Type
                    {modeLocked && (
                      <span className="ml-2 text-yellow-600" title="Mode locked">
                        (Locked)
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={modeLabels[activity.mode] || 'Unknown'}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                  />
                  {modeLocked && (
                    <p className="text-xs text-yellow-600 mt-1">
                      Mode cannot be changed after questions or attempts exist
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Level
                  </label>
                  <input
                    type="text"
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    placeholder="e.g., Beginner, Intermediate"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Education Level
                  </label>
                  <input
                    type="text"
                    value={educationLevel}
                    onChange={(e) => setEducationLevel(e.target.value)}
                    placeholder="e.g., High School"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={schoolSubject}
                    onChange={(e) => setSchoolSubject(e.target.value)}
                    placeholder="e.g., Mathematics"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Topic
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., Algebra"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Privacy Settings
            </h2>
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={visible}
                  onChange={(e) => setVisible(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Activity is visible to group members
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={hideUsernames}
                  onChange={(e) => setHideUsernames(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Hide usernames from other students
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isAnonymousAuthorAllowed}
                  onChange={(e) => setIsAnonymousAuthorAllowed(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Allow students to post anonymously
                </span>
              </label>
            </div>
          </div>

          {/* Open Mode Settings */}
          {activity.mode === 0 && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Open Mode Settings
              </h2>

              {/* Instructions */}
              <div className="bg-white rounded-lg p-4 mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instructions for Students
                </label>
                <textarea
                  value={openModeInstructions}
                  onChange={(e) => setOpenModeInstructions(e.target.value)}
                  rows={3}
                  placeholder="Provide detailed instructions for students..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Pass/Fail Toggle */}
              <div className="bg-white rounded-lg p-4 mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isPassFailEnabled}
                    onChange={(e) => setIsPassFailEnabled(e.target.checked)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    Enable Pass/Fail Requirements
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  When enabled, students must meet all requirements to pass this activity.
                </p>
              </div>

              {/* Pass/Fail Requirements (only visible when enabled) */}
              {isPassFailEnabled && (
                <div className="bg-white rounded-lg p-4 space-y-4">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">
                    Pass/Fail Requirements
                  </h3>

                  {/* Core Requirements */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Required Questions
                      </label>
                      <input
                        type="number"
                        value={requiredQuestionCount}
                        onChange={(e) => setRequiredQuestionCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                        min={1}
                        max={100}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">1-100 questions</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Min Bloom&apos;s Level
                      </label>
                      <input
                        type="number"
                        value={requiredAvgLevel}
                        onChange={(e) => setRequiredAvgLevel(Math.max(1, Math.min(6, parseFloat(e.target.value) || 1)))}
                        min={1}
                        max={6}
                        step={0.5}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">1.0-6.0 (avg level)</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Min AI Score
                      </label>
                      <input
                        type="number"
                        value={requiredAvgScore}
                        onChange={(e) => setRequiredAvgScore(Math.max(1, Math.min(10, parseFloat(e.target.value) || 1)))}
                        min={1}
                        max={10}
                        step={0.5}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">1.0-10.0 (avg score)</p>
                    </div>
                  </div>

                  {/* Peer Interaction Requirements */}
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      Peer Interaction (Optional)
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Peer Ratings Required
                        </label>
                        <input
                          type="number"
                          value={peerRatingsRequired}
                          onChange={(e) => setPeerRatingsRequired(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                          min={0}
                          max={100}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">0 = not required</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Peer Responses Required
                        </label>
                        <input
                          type="number"
                          value={peerResponsesRequired}
                          onChange={(e) => setPeerResponsesRequired(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                          min={0}
                          max={100}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">0 = not required</p>
                      </div>
                    </div>
                  </div>

                  {/* Information Box */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
                    <p className="text-xs text-green-800">
                      <strong>How Pass/Fail Works:</strong> Students must meet ALL enabled requirements to pass.
                      If peer interactions are required but no peer questions exist, students will see a &quot;waiting for peers&quot; status.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Exam Mode Settings */}
          {activity.mode === 1 && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">Exam Mode Settings</span>
              </h2>

              {/* Time & Scoring */}
              <div className="bg-white rounded-lg p-4 mb-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">
                  Time &amp; Scoring
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time Limit (minutes)
                    </label>
                    <input
                      type="number"
                      value={timeLimitMinutes}
                      onChange={(e) => setTimeLimitMinutes(parseInt(e.target.value) || 0)}
                      min={0}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">0 = no limit</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Passing Threshold (%)
                    </label>
                    <input
                      type="number"
                      value={passingThreshold}
                      onChange={(e) => setPassingThreshold(parseInt(e.target.value) || 0)}
                      min={0}
                      max={100}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Questions per Exam
                    </label>
                    <input
                      type="number"
                      value={examQuestionCount}
                      onChange={(e) => setExamQuestionCount(parseInt(e.target.value) || 1)}
                      min={1}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Re-attempt Settings */}
              <div className="bg-white rounded-lg p-4 mb-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">
                  Re-attempt Settings
                </h3>
                <label className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    checked={allowReattempts}
                    onChange={(e) => setAllowReattempts(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Allow students to retake exam if they fail
                  </span>
                </label>
                {allowReattempts && (
                  <div className="ml-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Attempts
                    </label>
                    <input
                      type="number"
                      value={maxAttempts}
                      onChange={(e) => setMaxAttempts(parseInt(e.target.value) || 1)}
                      min={1}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}
              </div>

              {/* Display Settings */}
              <div className="bg-white rounded-lg p-4 mb-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">
                  Display &amp; Feedback
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={showFeedback}
                      onChange={(e) => setShowFeedback(e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Show correct/incorrect answers after submit
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={showLeaderboard}
                      onChange={(e) => setShowLeaderboard(e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Show leaderboard to students
                    </span>
                  </label>

                  {showLeaderboard && (
                    <label className="flex items-center ml-6">
                      <input
                        type="checkbox"
                        checked={anonymizeLeaderboard}
                        onChange={(e) => setAnonymizeLeaderboard(e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Anonymize student names on leaderboard
                      </span>
                    </label>
                  )}

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={randomizeQuestions}
                      onChange={(e) => setRandomizeQuestions(e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Randomize question order (anti-cheating)
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={randomizeAnswerChoices}
                      onChange={(e) => setRandomizeAnswerChoices(e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Randomize answer choices (anti-cheating)
                    </span>
                  </label>
                </div>
              </div>

              {/* Publishing Status */}
              <div className="bg-white rounded-lg p-4 mb-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">
                  Publishing Status
                </h3>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Exam is published and visible to students
                  </span>
                </label>
                <p className="text-xs text-gray-500 ml-6 mt-1">
                  Uncheck this to hide the exam while you prepare questions
                </p>
              </div>

              {/* Scheduling Settings */}
              <div className="bg-white rounded-lg p-4 mb-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">
                  Scheduling Settings
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date/Time
                    </label>
                    <input
                      type="datetime-local"
                      value={examStartDate}
                      onChange={(e) => setExamStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Leave empty for immediate availability</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date/Time
                    </label>
                    <input
                      type="datetime-local"
                      value={examEndDate}
                      onChange={(e) => setExamEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Leave empty for no end date</p>
                  </div>
                </div>
              </div>

              {/* Question Pool Settings */}
              <div className="bg-white rounded-lg p-4 mb-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">
                  Question Pool Settings
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Questions in Pool
                    </label>
                    <input
                      type="number"
                      value={questionPoolSize}
                      onChange={(e) => setQuestionPoolSize(parseInt(e.target.value) || 0)}
                      min={0}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      disabled
                    />
                    <p className="text-xs text-gray-500 mt-1">Total questions available (auto-calculated)</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Questions per Exam
                    </label>
                    <input
                      type="number"
                      value={examQuestionCount}
                      onChange={(e) => setExamQuestionCount(parseInt(e.target.value) || 1)}
                      min={1}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Random selection from pool</p>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-white rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exam Instructions (Optional)
                </label>
                <textarea
                  value={examInstructions}
                  onChange={(e) => setExamInstructions(e.target.value)}
                  rows={3}
                  placeholder="Add specific instructions for students..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Inquiry Mode Settings */}
          {activity.mode === 2 && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Inquiry Mode Settings
              </h2>

              {/* Theme & Reference */}
              <div className="bg-white rounded-lg p-4 mb-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">
                  Theme &amp; Reference
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Inquiry Theme
                    </label>
                    <input
                      type="text"
                      value={inquiryTheme}
                      onChange={(e) => setInquiryTheme(e.target.value)}
                      placeholder="e.g., Climate Change, World History"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reference Document URL
                    </label>
                    <input
                      type="url"
                      value={referenceDocument}
                      onChange={(e) => setReferenceDocument(e.target.value)}
                      placeholder="https://example.com/reference.pdf"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Optional. Link to reference material.</p>
                  </div>
                </div>
              </div>

              {/* Question Parameters */}
              <div className="bg-white rounded-lg p-4 mb-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">
                  Question Parameters
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Min Word Count
                    </label>
                    <input
                      type="number"
                      value={minWordCount}
                      onChange={(e) => setMinWordCount(parseInt(e.target.value) || 5)}
                      min={5}
                      max={100}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Word Count
                    </label>
                    <input
                      type="number"
                      value={maxWordCount}
                      onChange={(e) => setMaxWordCount(parseInt(e.target.value) || 500)}
                      min={50}
                      max={2000}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Quality Thresholds */}
              <div className="bg-white rounded-lg p-4 mb-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">
                  Quality Thresholds
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Quality Score (0-10)
                    </label>
                    <input
                      type="number"
                      value={qualityThreshold}
                      onChange={(e) => setQualityThreshold(parseFloat(e.target.value) || 5)}
                      min={0}
                      max={10}
                      step={0.5}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Questions below this score may need revision</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Retake Attempts
                    </label>
                    <input
                      type="number"
                      value={inquiryMaxAttempts}
                      onChange={(e) => setInquiryMaxAttempts(parseInt(e.target.value) || 1)}
                      min={1}
                      max={10}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Times a student can retry</p>
                  </div>
                </div>
              </div>

              {/* Display Settings */}
              <div className="bg-white rounded-lg p-4 mb-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">
                  Display Settings
                </h3>
                <div className="space-y-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={inquiryShowLeaderboard}
                      onChange={(e) => setInquiryShowLeaderboard(e.target.checked)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Show leaderboard to students
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={allowHints}
                      onChange={(e) => setAllowHints(e.target.checked)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Allow hints during inquiry
                    </span>
                  </label>

                  {allowHints && (
                    <div className="ml-6">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Hints per Question
                      </label>
                      <input
                        type="number"
                        value={maxHints}
                        onChange={(e) => setMaxHints(parseInt(e.target.value) || 1)}
                        min={1}
                        max={10}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Publishing Status */}
              <div className="bg-white rounded-lg p-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={inquiryIsPublished}
                    onChange={(e) => setInquiryIsPublished(e.target.checked)}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Inquiry is published and visible to students
                  </span>
                </label>
                <p className="text-xs text-gray-500 ml-6 mt-1">
                  Uncheck this to hide the inquiry while you prepare keywords
                </p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-4">
            <Link
              href={`/activities/${activityId}`}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
              style={{ backgroundColor: 'var(--stanford-cardinal)' }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
