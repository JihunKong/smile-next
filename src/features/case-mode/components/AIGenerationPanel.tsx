'use client'

interface AIGenerationPanelProps {
  sourceMaterial: string
  onSourceMaterialChange: (value: string) => void
  onGenerate: () => Promise<void>
  generating: boolean
  generationProgress: number
  generationMessage: string
  isExpanded: boolean
  onToggleExpand: () => void
}

/**
 * Panel for AI-powered scenario generation.
 * Collapsible section with source material input and generation progress.
 */
export function AIGenerationPanel({
  sourceMaterial,
  onSourceMaterialChange,
  onGenerate,
  generating,
  generationProgress,
  generationMessage,
  isExpanded,
  onToggleExpand,
}: AIGenerationPanelProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <svg className="w-6 h-6 text-purple-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Generate with AI
        </h2>
        <button
          onClick={onToggleExpand}
          className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold"
        >
          {isExpanded ? 'Hide' : 'Show'}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Source Material (Chapter/Article Text)
            </label>
            <textarea
              value={sourceMaterial}
              onChange={(e) => onSourceMaterialChange(e.target.value)}
              rows={8}
              placeholder={`Paste the chapter, article, or educational material that will be the basis for case generation...

AI will extract key concepts and generate realistic business scenarios with embedded flaws for students to identify.`}
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
            onClick={onGenerate}
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
  )
}
