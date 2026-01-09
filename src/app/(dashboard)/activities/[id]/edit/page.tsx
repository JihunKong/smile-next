'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

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

  // Inquiry settings
  const [inquiryShowLeaderboard, setInquiryShowLeaderboard] = useState(true)
  const [allowHints, setAllowHints] = useState(false)
  const [maxHints, setMaxHints] = useState(3)

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
      if (activity.mode === 1) {
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
        payload.inquirySettings = {
          show_leaderboard: inquiryShowLeaderboard,
          allow_hints: allowHints,
          max_hints: maxHints,
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

              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={inquiryShowLeaderboard}
                    onChange={(e) => setInquiryShowLeaderboard(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
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
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
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
                      className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}
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
              style={{ backgroundColor: '#4f46e5' }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
