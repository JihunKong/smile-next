'use client'

import Link from 'next/link'
import { useState } from 'react'

// Exam Mode types
interface ExamSettings {
  time_limit_minutes?: number
  exam_question_count?: number
  pass_percentage?: number
  show_leaderboard?: boolean
}

interface ExamAttempt {
  id: string
  passed: boolean
  score_percentage: number
  submitted_at: string
  student_id?: string
  student_name?: string
  student_email?: string
}

interface ExamModeCardProps {
  activityId: string
  activityName: string
  examSettings?: ExamSettings
  userAttempt?: ExamAttempt | null
  isCreatorOrAdmin: boolean
  isPublished?: boolean
  examAttempts?: ExamAttempt[]
}

// Inquiry Mode types
interface InquirySettings {
  required_questions?: number
  time_per_question_minutes?: number
  theme?: string
  is_published?: boolean
}

interface InquiryAttempt {
  id: string
  passed: boolean
  submitted_at: string
}

interface InquiryModeCardProps {
  activityId: string
  activityName: string
  inquirySettings?: InquirySettings
  userAttempt?: InquiryAttempt | null
  isCreatorOrAdmin: boolean
}

// Case Mode types
interface CaseConfig {
  num_cases_to_show?: number
  time_per_case?: number
  pass_threshold?: number
  difficulty_level?: string
  is_finalized?: boolean
  max_attempts?: number
}

interface CaseAttempt {
  id: string
  passed: boolean
  submitted_at: string
}

interface CaseModeCardProps {
  activityId: string
  activityName: string
  caseConfig?: CaseConfig
  userAttempt?: CaseAttempt | null
  isCreatorOrAdmin: boolean
  attemptsRemaining?: number
  canRetake?: boolean
}

// Exam Mode Card Component
export function ExamModeCard({
  activityId,
  activityName,
  examSettings,
  userAttempt,
  isCreatorOrAdmin,
  isPublished = true,
  examAttempts = [],
}: ExamModeCardProps) {
  const [showAllAttempts, setShowAllAttempts] = useState(false)
  const displayedAttempts = showAllAttempts ? examAttempts : examAttempts.slice(0, 5)

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Main Card */}
      <div className="text-center py-12 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="mb-6">
          <i className="fas fa-clipboard-check text-6xl text-blue-600 mb-4"></i>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">{activityName}</h3>

          {examSettings && (
            <div className="space-y-2 text-gray-600 mb-6">
              {examSettings.exam_question_count && (
                <p>
                  <i className="fas fa-question-circle mr-2"></i>
                  <strong>{examSettings.exam_question_count}</strong> questions per attempt
                </p>
              )}
              {examSettings.time_limit_minutes && (
                <p>
                  <i className="fas fa-clock mr-2"></i>
                  <strong>{examSettings.time_limit_minutes}</strong> minutes
                </p>
              )}
              {examSettings.pass_percentage && (
                <p>
                  <i className="fas fa-check-circle mr-2"></i>
                  Pass threshold: <strong>{examSettings.pass_percentage}%</strong>
                </p>
              )}
            </div>
          )}
        </div>

        {/* User Attempt Status */}
        {userAttempt ? (
          <div className="space-y-3">
            <Link
              href={`/activities/${activityId}/exam/${userAttempt.id}/results`}
              className="inline-flex items-center px-8 py-4 bg-green-600 hover:bg-green-700 text-white text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
            >
              <i className="fas fa-check-circle mr-2"></i>View Your Results
            </Link>
            <p className="text-sm text-gray-600">
              <i className="fas fa-info-circle mr-1"></i>
              You completed this exam on{' '}
              {new Date(userAttempt.submitted_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
              {userAttempt.passed ? (
                <span className="text-green-600 font-semibold ml-2">
                  <i className="fas fa-trophy"></i> PASSED ({userAttempt.score_percentage.toFixed(1)}%)
                </span>
              ) : (
                <span className="text-red-600 font-semibold ml-2">
                  <i className="fas fa-times-circle"></i> Not Passed ({userAttempt.score_percentage.toFixed(1)}%)
                </span>
              )}
            </p>
          </div>
        ) : (
          <Link
            href={`/activities/${activityId}/exam/take`}
            className="inline-flex items-center px-8 py-4 bg-[var(--stanford-cardinal)] hover:opacity-90 text-white text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
          >
            <i className="fas fa-play-circle mr-2"></i>Take Exam
          </Link>
        )}

        {/* Leaderboard Button */}
        {examSettings?.show_leaderboard !== false && (
          <div className="mt-4">
            <Link
              href={`/activities/${activityId}/exam/leaderboard`}
              className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all text-sm font-semibold"
            >
              <i className="fas fa-trophy mr-2"></i>View Leaderboard
            </Link>
          </div>
        )}

        {/* Analytics Button (for creators/admins) */}
        {isCreatorOrAdmin && (
          <div className="mt-4">
            <Link
              href={`/activities/${activityId}/exam/analytics`}
              className="inline-flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all text-sm font-semibold"
            >
              <i className="fas fa-chart-bar mr-2"></i>View Analytics Dashboard
            </Link>
          </div>
        )}
      </div>

      {/* Exam Results Summary (for creators/admins) */}
      {isCreatorOrAdmin && examAttempts.length > 0 && (
        <div className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 border-t border-purple-200">
          <h3 className="text-xl font-bold mb-4 flex items-center text-[var(--stanford-cardinal)]">
            <i className="fas fa-chart-bar mr-2"></i>Exam Results Summary
          </h3>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayedAttempts.map((attempt) => (
                  <tr key={attempt.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{attempt.student_name || 'Unknown'}</div>
                      <div className="text-sm text-gray-500">{attempt.student_email || ''}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-lg font-bold ${attempt.passed ? 'text-green-600' : 'text-red-600'}`}>
                        {attempt.score_percentage.toFixed(1)}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {attempt.passed ? (
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          <i className="fas fa-check-circle mr-1"></i> PASSED
                        </span>
                      ) : (
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          <i className="fas fa-times-circle mr-1"></i> FAILED
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(attempt.submitted_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/activities/${activityId}/exam/${attempt.id}/results`}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                      >
                        <i className="fas fa-eye mr-1"></i>View Results
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {examAttempts.length > 5 && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowAllAttempts(!showAllAttempts)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {showAllAttempts ? 'Show Less' : `Show All (${examAttempts.length} attempts)`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Inquiry Mode Card Component
export function InquiryModeCard({
  activityId,
  activityName,
  inquirySettings,
  userAttempt,
  isCreatorOrAdmin,
}: InquiryModeCardProps) {
  const isPublished = inquirySettings?.is_published ?? false

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="text-center py-12 bg-gradient-to-br from-purple-50 to-pink-100">
        <div className="mb-6">
          <i className="fas fa-lightbulb text-6xl text-purple-600 mb-4"></i>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">{activityName}</h3>

          {inquirySettings && (
            <div className="space-y-2 text-gray-600 mb-6">
              {inquirySettings.required_questions && (
                <p>
                  <i className="fas fa-question-circle mr-2"></i>
                  Generate <strong>{inquirySettings.required_questions}</strong> high-quality questions
                </p>
              )}
              {inquirySettings.time_per_question_minutes && (
                <p>
                  <i className="fas fa-clock mr-2"></i>
                  <strong>{inquirySettings.time_per_question_minutes}</strong> minutes per question
                </p>
              )}
              {inquirySettings.theme && (
                <p className="text-sm text-purple-700 italic mt-3">&quot;{inquirySettings.theme}&quot;</p>
              )}
            </div>
          )}
        </div>

        {/* Show content based on publish status */}
        {isPublished || isCreatorOrAdmin ? (
          <>
            {userAttempt ? (
              <div className="space-y-3">
                <Link
                  href={`/activities/${activityId}/inquiry/${userAttempt.id}/results`}
                  className="inline-flex items-center px-8 py-4 bg-green-600 hover:bg-green-700 text-white text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
                >
                  <i className="fas fa-check-circle mr-2"></i>View Your Results
                </Link>
                <p className="text-sm text-gray-600">
                  <i className="fas fa-info-circle mr-1"></i>
                  You completed this inquiry on{' '}
                  {new Date(userAttempt.submitted_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                  {userAttempt.passed ? (
                    <span className="text-green-600 font-semibold ml-2">
                      <i className="fas fa-trophy"></i> PASSED
                    </span>
                  ) : (
                    <span className="text-red-600 font-semibold ml-2">
                      <i className="fas fa-times-circle"></i> Not Passed
                    </span>
                  )}
                </p>
              </div>
            ) : (
              <Link
                href={`/activities/${activityId}/inquiry/take`}
                className="inline-flex items-center px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
              >
                <i className="fas fa-play-circle mr-2"></i>Start Inquiry
              </Link>
            )}

            {/* Preview Mode Warning */}
            {!isPublished && isCreatorOrAdmin && (
              <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg max-w-2xl mx-auto">
                <p className="text-sm text-yellow-800">
                  <i className="fas fa-exclamation-triangle mr-2"></i>
                  <strong>Preview Mode:</strong> This inquiry is not published. Only you can see this.
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="p-6 bg-gray-100 border border-gray-300 rounded-lg max-w-2xl mx-auto">
            <i className="fas fa-lock text-4xl text-gray-400 mb-3"></i>
            <p className="text-gray-600 font-medium">This inquiry activity is not yet published.</p>
            <p className="text-sm text-gray-500 mt-2">
              The instructor is still preparing this activity. Check back later!
            </p>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg max-w-2xl mx-auto">
          <p className="text-sm text-purple-800">
            <i className="fas fa-info-circle mr-2"></i>
            In Inquiry Mode, you&apos;ll generate questions using provided keywords. The AI will evaluate your
            critical thinking and question quality.
          </p>
        </div>
      </div>
    </div>
  )
}

// Case Mode Card Component
export function CaseModeCard({
  activityId,
  activityName,
  caseConfig,
  userAttempt,
  isCreatorOrAdmin,
  attemptsRemaining,
  canRetake = false,
}: CaseModeCardProps) {
  const isFinalized = caseConfig?.is_finalized ?? false

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="text-center py-12 bg-gradient-to-br from-green-50 to-teal-100">
        <div className="mb-6">
          <i className="fas fa-briefcase text-6xl text-green-600 mb-4"></i>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">{activityName}</h3>

          {caseConfig && (
            <div className="space-y-2 text-gray-600 mb-6">
              <p>
                <i className="fas fa-file-alt mr-2"></i>
                Analyze <strong>{caseConfig.num_cases_to_show || 1}</strong> business case scenario
                {(caseConfig.num_cases_to_show || 1) > 1 ? 's' : ''}
              </p>
              {caseConfig.time_per_case && (
                <p>
                  <i className="fas fa-clock mr-2"></i>
                  <strong>{caseConfig.time_per_case}</strong> minutes per case
                </p>
              )}
              <p>
                <i className="fas fa-chart-line mr-2"></i>
                Pass threshold: <strong>{caseConfig.pass_threshold || 7}/10</strong>
              </p>
              {caseConfig.difficulty_level && (
                <p className="text-sm text-green-700 italic mt-3">
                  Difficulty: {caseConfig.difficulty_level.charAt(0).toUpperCase() + caseConfig.difficulty_level.slice(1)}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Show content based on finalized status */}
        {isFinalized || isCreatorOrAdmin ? (
          <>
            {userAttempt ? (
              <div className="space-y-3">
                <Link
                  href={`/activities/${activityId}/case/${userAttempt.id}/results`}
                  className="inline-flex items-center px-8 py-4 bg-green-600 hover:bg-green-700 text-white text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
                >
                  <i className="fas fa-check-circle mr-2"></i>View Your Results
                </Link>
                <p className="text-sm text-gray-600">
                  <i className="fas fa-info-circle mr-1"></i>
                  You completed this case activity
                  {userAttempt.passed ? (
                    <span className="text-green-600 font-semibold ml-2">
                      <i className="fas fa-trophy"></i> PASSED
                    </span>
                  ) : (
                    <span className="text-red-600 font-semibold ml-2">
                      <i className="fas fa-times-circle"></i> Not Passed
                    </span>
                  )}
                </p>

                {/* Retake Button */}
                {canRetake && attemptsRemaining !== undefined && attemptsRemaining > 0 && (
                  <>
                    <Link
                      href={`/activities/${activityId}/case/take`}
                      className="mt-4 inline-flex items-center px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-md transition-all"
                    >
                      <i className="fas fa-redo mr-2"></i>Retake Case Activity
                    </Link>
                    <p className="mt-2 text-xs text-gray-500">
                      {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining
                    </p>
                  </>
                )}
              </div>
            ) : (
              <Link
                href={`/activities/${activityId}/case/take`}
                className="inline-flex items-center px-8 py-4 bg-green-600 hover:bg-green-700 text-white text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
              >
                <i className="fas fa-play-circle mr-2"></i>Take Case Activity
              </Link>
            )}

            {/* Preview Mode Warning */}
            {!isFinalized && isCreatorOrAdmin && (
              <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg max-w-2xl mx-auto">
                <p className="text-sm text-yellow-800">
                  <i className="fas fa-exclamation-triangle mr-2"></i>
                  <strong>Preview Mode:</strong> This case activity is not finalized. Only you can see this.
                </p>
                <Link
                  href={`/activities/${activityId}/case/configure`}
                  className="inline-block mt-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg text-sm"
                >
                  <i className="fas fa-cog mr-2"></i>Configure Cases
                </Link>
              </div>
            )}
          </>
        ) : (
          <div className="p-6 bg-gray-100 border border-gray-300 rounded-lg max-w-2xl mx-auto">
            <i className="fas fa-lock text-4xl text-gray-400 mb-3"></i>
            <p className="text-gray-600 font-medium">This case activity is not yet ready.</p>
            <p className="text-sm text-gray-500 mt-2">
              The instructor is still configuring scenarios. Check back later!
            </p>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg max-w-2xl mx-auto">
          <p className="text-sm text-green-800">
            <i className="fas fa-info-circle mr-2"></i>
            In Case Mode, you&apos;ll analyze business scenarios with embedded flaws, identify issues, and propose
            practical solutions. AI evaluates your critical thinking and problem-solving skills.
          </p>
        </div>
      </div>
    </div>
  )
}
