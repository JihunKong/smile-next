'use client'

import { ExamFormState } from '../types'

interface Props {
  examState: ExamFormState
  setExamState: React.Dispatch<React.SetStateAction<ExamFormState>>
}

export function ExamModeSettings({ examState, setExamState }: Props) {
  const updateField = <K extends keyof ExamFormState>(field: K, value: ExamFormState[K]) => {
    setExamState((prev) => ({ ...prev, [field]: value }))
  }

  return (
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
              value={examState.timeLimitMinutes}
              onChange={(e) => updateField('timeLimitMinutes', parseInt(e.target.value) || 0)}
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
              value={examState.passingThreshold}
              onChange={(e) => updateField('passingThreshold', parseInt(e.target.value) || 0)}
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
              value={examState.examQuestionCount}
              onChange={(e) => updateField('examQuestionCount', parseInt(e.target.value) || 1)}
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
            checked={examState.allowReattempts}
            onChange={(e) => updateField('allowReattempts', e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">
            Allow students to retake exam if they fail
          </span>
        </label>
        {examState.allowReattempts && (
          <div className="ml-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Attempts
            </label>
            <input
              type="number"
              value={examState.maxAttempts}
              onChange={(e) => updateField('maxAttempts', parseInt(e.target.value) || 1)}
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
              checked={examState.showFeedback}
              onChange={(e) => updateField('showFeedback', e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">
              Show correct/incorrect answers after submit
            </span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={examState.showLeaderboard}
              onChange={(e) => updateField('showLeaderboard', e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">
              Show leaderboard to students
            </span>
          </label>

          {examState.showLeaderboard && (
            <label className="flex items-center ml-6">
              <input
                type="checkbox"
                checked={examState.anonymizeLeaderboard}
                onChange={(e) => updateField('anonymizeLeaderboard', e.target.checked)}
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
              checked={examState.randomizeQuestions}
              onChange={(e) => updateField('randomizeQuestions', e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">
              Randomize question order (anti-cheating)
            </span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={examState.randomizeAnswerChoices}
              onChange={(e) => updateField('randomizeAnswerChoices', e.target.checked)}
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
            checked={examState.isPublished}
            onChange={(e) => updateField('isPublished', e.target.checked)}
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
              value={examState.examStartDate}
              onChange={(e) => updateField('examStartDate', e.target.value)}
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
              value={examState.examEndDate}
              onChange={(e) => updateField('examEndDate', e.target.value)}
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
              value={examState.questionPoolSize}
              onChange={(e) => updateField('questionPoolSize', parseInt(e.target.value) || 0)}
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
              value={examState.examQuestionCount}
              onChange={(e) => updateField('examQuestionCount', parseInt(e.target.value) || 1)}
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
          value={examState.examInstructions}
          onChange={(e) => updateField('examInstructions', e.target.value)}
          rows={3}
          placeholder="Add specific instructions for students..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
      </div>
    </div>
  )
}
