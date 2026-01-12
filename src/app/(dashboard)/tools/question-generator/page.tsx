'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Activity {
  id: string
  name: string
  groupName: string
  mode: number
}

interface GeneratedQuestion {
  content: string
  bloomsLevel: string
  qualityScore: number
}

export default function QuestionGeneratorPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [activities, setActivities] = useState<Activity[]>([])
  const [selectedActivityId, setSelectedActivityId] = useState('')
  const [sourceText, setSourceText] = useState('')
  const [questionCount, setQuestionCount] = useState<5 | 10>(5)
  const [targetLevel, setTargetLevel] = useState<'analyze' | 'evaluate' | 'create'>('evaluate')
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([])
  const [selectedQuestions, setSelectedQuestions] = useState<Set<number>>(new Set())

  // Fetch activities
  useEffect(() => {
    const fetchActivities = async () => {
      if (!session) return

      try {
        const response = await fetch('/api/activities?limit=100')
        if (response.ok) {
          const data = await response.json()
          setActivities(
            (data.activities || []).map((a: { id: string; name: string; mode: number; owningGroup?: { name: string } }) => ({
              id: a.id,
              name: a.name,
              mode: a.mode,
              groupName: a.owningGroup?.name || 'Unknown',
            }))
          )
        }
      } catch (err) {
        console.error('Failed to fetch activities:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchActivities()
  }, [session])

  const handleGenerate = async () => {
    if (!sourceText.trim()) {
      setError('Please enter source text to generate questions from')
      return
    }

    if (sourceText.trim().length < 100) {
      setError('Source text must be at least 100 characters')
      return
    }

    setIsGenerating(true)
    setError('')
    setGeneratedQuestions([])

    try {
      const response = await fetch('/api/tools/question-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceText: sourceText.trim(),
          questionCount,
          targetLevel,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate questions')
      }

      setGeneratedQuestions(result.data.questions)
      // Select all questions by default
      setSelectedQuestions(new Set(result.data.questions.map((_: GeneratedQuestion, i: number) => i)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate questions')
    } finally {
      setIsGenerating(false)
    }
  }

  const toggleQuestion = (index: number) => {
    setSelectedQuestions((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  const toggleAll = () => {
    if (selectedQuestions.size === generatedQuestions.length) {
      setSelectedQuestions(new Set())
    } else {
      setSelectedQuestions(new Set(generatedQuestions.map((_, i) => i)))
    }
  }

  const handleSave = async () => {
    if (!selectedActivityId) {
      setError('Please select an activity to add questions to')
      return
    }

    if (selectedQuestions.size === 0) {
      setError('Please select at least one question to save')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      const questionsToSave = generatedQuestions.filter((_, i) => selectedQuestions.has(i))

      const response = await fetch('/api/tools/question-generator/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityId: selectedActivityId,
          questions: questionsToSave,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save questions')
      }

      // Navigate to the activity
      router.push(`/activities/${selectedActivityId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save questions')
      setIsSaving(false)
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Please sign in to use the Question Generator.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/tools"
            className="inline-flex items-center gap-1 text-white/80 hover:text-white mb-3"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Tools
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            AI Question Generator
          </h1>
          <p className="text-white/80 mt-1">Generate high-quality questions from your learning materials using AI</p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Input Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-[#2E2D29] mb-4">Source Material</h2>

          {/* Source Text */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Learning Material <span className="text-red-500">*</span>
            </label>
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Paste your learning material, textbook content, or any text you want to generate questions from..."
              rows={8}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8C1515] focus:border-transparent resize-none"
            />
            <p className="text-sm text-gray-500 mt-1">
              {sourceText.length} characters (minimum 100 required)
            </p>
          </div>

          {/* Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Questions
              </label>
              <div className="flex gap-3">
                {[5, 10].map((count) => (
                  <button
                    key={count}
                    onClick={() => setQuestionCount(count as 5 | 10)}
                    className={`flex-1 py-2 rounded-lg border-2 transition-all ${
                      questionCount === count
                        ? 'border-[#8C1515] bg-[#8C1515]/5 text-[#8C1515]'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {count} Questions
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cognitive Level (Bloom&apos;s Taxonomy)
              </label>
              <select
                value={targetLevel}
                onChange={(e) => setTargetLevel(e.target.value as 'analyze' | 'evaluate' | 'create')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8C1515] focus:border-transparent"
              >
                <option value="analyze">Level 4 - Analyze</option>
                <option value="evaluate">Level 5 - Evaluate</option>
                <option value="create">Level 6 - Create</option>
              </select>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || sourceText.trim().length < 100}
            className="w-full py-3 bg-[#8C1515] text-white rounded-lg hover:bg-[#6D1010] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating Questions...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Generate Questions with AI
              </>
            )}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Generated Questions */}
        {generatedQuestions.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#2E2D29]">
                Generated Questions ({generatedQuestions.length})
              </h2>
              <button
                onClick={toggleAll}
                className="text-sm text-[#8C1515] hover:underline"
              >
                {selectedQuestions.size === generatedQuestions.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="space-y-3">
              {generatedQuestions.map((question, index) => (
                <div
                  key={index}
                  onClick={() => toggleQuestion(index)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedQuestions.has(index)
                      ? 'border-[#8C1515] bg-[#8C1515]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex-shrink-0 w-5 h-5 mt-1 rounded border-2 flex items-center justify-center ${
                        selectedQuestions.has(index)
                          ? 'border-[#8C1515] bg-[#8C1515]'
                          : 'border-gray-300'
                      }`}
                    >
                      {selectedQuestions.has(index) && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900">{question.content}</p>
                      <div className="flex gap-4 mt-2 text-sm text-gray-500">
                        <span>Level: {question.bloomsLevel}</span>
                        <span>Quality: {question.qualityScore.toFixed(1)}/10</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Save Section */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Save to Activity
                </label>
                {isLoading ? (
                  <div className="flex justify-center py-4">
                    <svg className="animate-spin h-6 w-6 text-[#8C1515]" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </div>
                ) : (
                  <select
                    value={selectedActivityId}
                    onChange={(e) => setSelectedActivityId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8C1515] focus:border-transparent"
                  >
                    <option value="">-- Select an activity --</option>
                    {activities.map((activity) => (
                      <option key={activity.id} value={activity.id}>
                        {activity.name} ({activity.groupName})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <button
                onClick={handleSave}
                disabled={isSaving || selectedQuestions.size === 0 || !selectedActivityId}
                className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save {selectedQuestions.size} Question{selectedQuestions.size !== 1 ? 's' : ''} to Activity
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-[#2E2D29] mb-4">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                1
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Paste Content</h3>
                <p className="text-sm text-gray-600">Add your learning material, textbook content, or article text.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                2
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Configure & Generate</h3>
                <p className="text-sm text-gray-600">Choose question count and cognitive level, then generate.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                3
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Review & Save</h3>
                <p className="text-sm text-gray-600">Select the best questions and save them to your activity.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
