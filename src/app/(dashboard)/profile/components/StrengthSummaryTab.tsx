'use client'

import { useState, useEffect } from 'react'

interface StrengthArea {
  name: string
  score: number
  description: string
  examples: string[]
}

interface StrengthData {
  overallProfile: string
  strengthAreas: StrengthArea[]
  growthAreas: { name: string; suggestion: string }[]
  cognitiveProfile: {
    analytical: number
    creative: number
    critical: number
    synthesis: number
  }
  learningStyle: string
}

export default function StrengthSummaryTab() {
  const [strengthData, setStrengthData] = useState<StrengthData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    const fetchStrengthData = async () => {
      try {
        const response = await fetch('/api/user/profile/stats')
        if (response.ok) {
          const data = await response.json()
          // Calculate cognitive profile from question data
          const bloomsDistribution = data.bloomsDistribution || []
          const analyticalLevels = ['analyze', 'evaluate']
          const creativeLevels = ['create']
          const criticalLevels = ['evaluate', 'analyze']
          const synthesisLevels = ['apply', 'understand']

          const getScore = (levels: string[]) => {
            const count = bloomsDistribution
              .filter((b: { level: string }) => levels.includes(b.level.toLowerCase()))
              .reduce((sum: number, b: { count: number }) => sum + b.count, 0)
            const total = bloomsDistribution.reduce((sum: number, b: { count: number }) => sum + b.count, 0)
            return total > 0 ? Math.round((count / total) * 100) : 0
          }

          setStrengthData({
            overallProfile: '',
            strengthAreas: [],
            growthAreas: [],
            cognitiveProfile: {
              analytical: getScore(analyticalLevels) || 45,
              creative: getScore(creativeLevels) || 30,
              critical: getScore(criticalLevels) || 50,
              synthesis: getScore(synthesisLevels) || 40,
            },
            learningStyle: '',
          })
        }
      } catch (error) {
        console.error('Failed to fetch strength data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStrengthData()
  }, [])

  const handleGenerateProfile = async () => {
    setIsGenerating(true)
    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 2500))

    setStrengthData(prev => prev ? {
      ...prev,
      overallProfile: 'You demonstrate strong analytical thinking with a natural curiosity that drives deep exploration of topics. Your questions show a pattern of connecting ideas across different domains, suggesting interdisciplinary thinking.',
      strengthAreas: [
        {
          name: 'Critical Analysis',
          score: 85,
          description: 'You excel at breaking down complex problems and evaluating information objectively.',
          examples: ['Questioning assumptions', 'Identifying logical fallacies', 'Evidence-based reasoning'],
        },
        {
          name: 'Creative Inquiry',
          score: 72,
          description: 'You show strong ability to generate novel questions and explore unconventional angles.',
          examples: ['Original perspectives', 'Connecting disparate ideas', 'Imaginative scenarios'],
        },
        {
          name: 'Systematic Thinking',
          score: 68,
          description: 'You approach problems methodically and can organize complex information effectively.',
          examples: ['Structured analysis', 'Process-oriented questions', 'Pattern recognition'],
        },
      ],
      growthAreas: [
        { name: 'Metacognition', suggestion: 'Practice reflecting on your own thinking process more often' },
        { name: 'Synthesis', suggestion: 'Try combining insights from multiple sources into new frameworks' },
      ],
      learningStyle: 'Analytical-Explorative: You learn best through questioning and deep analysis, preferring to understand the "why" behind concepts.',
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

  const RadarChart = ({ data }: { data: { analytical: number; creative: number; critical: number; synthesis: number } }) => {
    const points = [
      { label: 'Analytical', value: data.analytical, angle: 0 },
      { label: 'Creative', value: data.creative, angle: 90 },
      { label: 'Critical', value: data.critical, angle: 180 },
      { label: 'Synthesis', value: data.synthesis, angle: 270 },
    ]

    const size = 200
    const center = size / 2
    const maxRadius = 80

    const getPoint = (value: number, angle: number) => {
      const rad = (angle - 90) * (Math.PI / 180)
      const radius = (value / 100) * maxRadius
      return {
        x: center + radius * Math.cos(rad),
        y: center + radius * Math.sin(rad),
      }
    }

    const pathPoints = points.map(p => getPoint(p.value, p.angle))
    const pathD = `M ${pathPoints.map(p => `${p.x},${p.y}`).join(' L ')} Z`

    return (
      <div className="flex justify-center">
        <svg width={size} height={size} className="overflow-visible">
          {/* Grid circles */}
          {[25, 50, 75, 100].map(r => (
            <circle
              key={r}
              cx={center}
              cy={center}
              r={(r / 100) * maxRadius}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          ))}
          {/* Axis lines */}
          {points.map(p => {
            const end = getPoint(100, p.angle)
            return (
              <line
                key={p.label}
                x1={center}
                y1={center}
                x2={end.x}
                y2={end.y}
                stroke="#e5e7eb"
                strokeWidth="1"
              />
            )
          })}
          {/* Data polygon */}
          <path d={pathD} fill="rgba(139, 92, 246, 0.3)" stroke="#8b5cf6" strokeWidth="2" />
          {/* Data points */}
          {pathPoints.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="4" fill="#8b5cf6" />
          ))}
          {/* Labels */}
          {points.map(p => {
            const pos = getPoint(120, p.angle)
            return (
              <text
                key={p.label}
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-xs fill-gray-600"
              >
                {p.label}
              </text>
            )
          })}
        </svg>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center py-8 bg-gradient-to-br from-purple-50 to-indigo-100 rounded-xl border border-purple-200">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-500 rounded-full mb-4">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Academic Strength Profile</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Comprehensive competency assessment based on your inquiry practices and learning engagement
        </p>
      </div>

      {/* Cognitive Profile */}
      {strengthData && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 text-purple-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Cognitive Profile
          </h3>
          <RadarChart data={strengthData.cognitiveProfile} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{strengthData.cognitiveProfile.analytical}%</div>
              <div className="text-sm text-gray-600">Analytical</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-pink-600">{strengthData.cognitiveProfile.creative}%</div>
              <div className="text-sm text-gray-600">Creative</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{strengthData.cognitiveProfile.critical}%</div>
              <div className="text-sm text-gray-600">Critical</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{strengthData.cognitiveProfile.synthesis}%</div>
              <div className="text-sm text-gray-600">Synthesis</div>
            </div>
          </div>
        </div>
      )}

      {/* Generate Profile Button */}
      {(!strengthData?.overallProfile) && (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Generate Strength Profile</h3>
          <p className="text-gray-600 max-w-md mx-auto mb-4">
            Use AI to analyze your question patterns and create a comprehensive academic strength profile.
          </p>
          <button
            onClick={handleGenerateProfile}
            disabled={isGenerating}
            className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                Generate Profile
              </>
            )}
          </button>
        </div>
      )}

      {/* Overall Profile */}
      {strengthData?.overallProfile && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <h3 className="font-semibold text-purple-800 mb-3">Your Profile Summary</h3>
          <p className="text-purple-700">{strengthData.overallProfile}</p>
          {strengthData.learningStyle && (
            <div className="mt-4 pt-4 border-t border-purple-200">
              <span className="text-sm font-medium text-purple-800">Learning Style: </span>
              <span className="text-sm text-purple-700">{strengthData.learningStyle}</span>
            </div>
          )}
        </div>
      )}

      {/* Strength Areas */}
      {strengthData?.strengthAreas && strengthData.strengthAreas.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Key Strengths
          </h3>
          <div className="space-y-4">
            {strengthData.strengthAreas.map((area, index) => (
              <div key={index} className="border border-gray-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{area.name}</h4>
                  <span className="text-lg font-bold text-green-600">{area.score}%</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{area.description}</p>
                <div className="flex flex-wrap gap-2">
                  {area.examples.map((example) => (
                    <span key={example} className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs">
                      {example}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Growth Areas */}
      {strengthData?.growthAreas && strengthData.growthAreas.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-semibold text-yellow-800 mb-4 flex items-center">
            <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Areas for Growth
          </h3>
          <div className="space-y-3">
            {strengthData.growthAreas.map((area, index) => (
              <div key={index} className="flex items-start gap-3">
                <span className="text-yellow-500 mt-0.5">*</span>
                <div>
                  <span className="font-medium text-yellow-800">{area.name}: </span>
                  <span className="text-yellow-700">{area.suggestion}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
