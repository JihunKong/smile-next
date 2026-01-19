'use client'

import { useState } from 'react'

interface GradingRubricProps {
  passThreshold: number
}

/**
 * Collapsible grading rubric showing the 4 evaluation criteria for Case Mode.
 * Displays: Understanding, Ingenuity, Critical Thinking, Real-World Application
 */
export function GradingRubric({ passThreshold }: GradingRubricProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="bg-white border border-indigo-200 rounded-lg shadow-sm mt-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-indigo-50 transition-colors rounded-lg"
      >
        <div className="flex items-center">
          <svg className="w-5 h-5 text-indigo-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <span className="font-semibold text-gray-900">Grading Rubric - How You&apos;ll Be Evaluated</span>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="border-t border-indigo-200 p-4">
          <p className="text-sm text-gray-600 mb-4">
            Your responses will be scored on these 4 criteria (0-10 points each). Your final score is the average across all criteria.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Understanding */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-6 h-6 text-yellow-600 mr-3 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                </svg>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">1. Understanding the Case Issue</h4>
                  <p className="text-sm text-gray-700">
                    Did you correctly identify the core problems and flaws in the scenario? Do you understand the implications and underlying issues?
                  </p>
                </div>
              </div>
            </div>

            {/* Ingenuity */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-6 h-6 text-purple-600 mr-3 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">2. Ingenuity in Solution Suggestion</h4>
                  <p className="text-sm text-gray-700">
                    How creative and practical are your proposed solutions? Do they address root causes with innovative, well-thought-out approaches?
                  </p>
                </div>
              </div>
            </div>

            {/* Critical Thinking */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-6 h-6 text-blue-600 mr-3 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">3. Critical Thinking Depth</h4>
                  <p className="text-sm text-gray-700">
                    How deeply did you analyze the situation? Did you consider multiple perspectives and show logical, evidence-based reasoning?
                  </p>
                </div>
              </div>
            </div>

            {/* Real-World Application */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-6 h-6 text-green-600 mr-3 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">4. Real-World Application</h4>
                  <p className="text-sm text-gray-700">
                    How practical and applicable are your suggestions? Did you consider implementation challenges and real-world contexts?
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-indigo-50 border border-indigo-200 rounded-lg p-3">
            <p className="text-sm text-indigo-900">
              <svg className="w-4 h-4 text-indigo-600 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <strong>Pass Threshold:</strong> You need an average score of <span className="font-semibold">{passThreshold.toFixed(1)}</span> or higher across all 4 criteria to pass this activity.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
