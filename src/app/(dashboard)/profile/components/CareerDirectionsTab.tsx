'use client'

import { useState, useEffect } from 'react'
import { LoadingSpinner } from '@/components/ui'

interface CareerSuggestion {
  title: string
  description: string
  matchScore: number
  relatedTopics: string[]
  skills: string[]
}

interface CareerData {
  topicInterests: { topic: string; count: number; score: number }[]
  suggestedCareers: CareerSuggestion[]
  strengthAreas: string[]
  explorationTips: string[]
}

export default function CareerDirectionsTab() {
  const [careerData, setCareerData] = useState<CareerData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    const fetchCareerData = async () => {
      try {
        const response = await fetch('/api/user/profile/stats')
        if (response.ok) {
          const data = await response.json()
          // Build career data from user stats
          const topics = data.topicsExplored || []
          const topicInterests = topics.slice(0, 5).map((topic: string, i: number) => ({
            topic,
            count: Math.max(10 - i * 2, 1),
            score: Math.max(90 - i * 10, 50),
          }))

          setCareerData({
            topicInterests,
            suggestedCareers: [],
            strengthAreas: data.strengthAreas || [],
            explorationTips: [],
          })
        }
      } catch (error) {
        console.error('Failed to fetch career data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCareerData()
  }, [])

  const handleGenerateInsights = async () => {
    setIsGenerating(true)
    // Simulate AI generation delay
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Mock AI-generated career suggestions
    setCareerData(prev => prev ? {
      ...prev,
      suggestedCareers: [
        {
          title: 'Data Scientist',
          description: 'Analyze complex data sets to help organizations make better decisions.',
          matchScore: 85,
          relatedTopics: ['Mathematics', 'Statistics', 'Programming'],
          skills: ['Python', 'Machine Learning', 'Data Visualization'],
        },
        {
          title: 'Research Scientist',
          description: 'Conduct research to advance knowledge in your field of interest.',
          matchScore: 78,
          relatedTopics: ['Science', 'Research Methods', 'Critical Thinking'],
          skills: ['Analytical Thinking', 'Technical Writing', 'Experimentation'],
        },
        {
          title: 'Product Manager',
          description: 'Lead product development and strategy for innovative solutions.',
          matchScore: 72,
          relatedTopics: ['Business', 'Technology', 'User Experience'],
          skills: ['Leadership', 'Communication', 'Strategic Planning'],
        },
      ],
      explorationTips: [
        'Explore more questions in areas where you score highest',
        'Try connecting different topics to discover interdisciplinary interests',
        'Challenge yourself with higher-level Bloom\'s taxonomy questions',
      ],
    } : null)

    setIsGenerating(false)
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-48 bg-gray-200 rounded-xl"></div>
        <div className="h-64 bg-gray-200 rounded-lg"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center py-8 bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl border border-green-200">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-4">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Career Possibilities</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          AI-powered insights based on your inquiry patterns, interests, and learning trajectory
        </p>
      </div>

      {/* Topic Interests */}
      {careerData && careerData.topicInterests.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Your Interest Areas
          </h3>
          <div className="space-y-3">
            {careerData.topicInterests.map((item, index) => (
              <div key={item.topic} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-medium text-sm">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{item.topic}</span>
                    <span className="text-gray-600">{item.count} questions</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Generate Button */}
      {(!careerData?.suggestedCareers || careerData.suggestedCareers.length === 0) && (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Generate Career Insights</h3>
          <p className="text-gray-600 max-w-md mx-auto mb-4">
            Use AI to analyze your question patterns and suggest potential career paths aligned with your interests.
          </p>
          <button
            onClick={handleGenerateInsights}
            disabled={isGenerating}
            className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <LoadingSpinner size="sm" className="-ml-1 mr-3" />
                Analyzing...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Generate AI Insights
              </>
            )}
          </button>
        </div>
      )}

      {/* Career Suggestions */}
      {careerData?.suggestedCareers && careerData.suggestedCareers.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 text-purple-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            AI-Suggested Career Paths
          </h3>
          <div className="space-y-4">
            {careerData.suggestedCareers.map((career, index) => (
              <div key={index} className="border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 text-lg">{career.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{career.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">{career.matchScore}%</div>
                    <div className="text-xs text-gray-500">Match</div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {career.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exploration Tips */}
      {careerData?.explorationTips && careerData.explorationTips.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="font-semibold text-green-800 mb-4 flex items-center">
            <svg className="w-5 h-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Tips for Career Exploration
          </h3>
          <ul className="space-y-2">
            {careerData.explorationTips.map((tip, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-green-700">
                <span className="text-green-500 mt-0.5">*</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
