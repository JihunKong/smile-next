'use client'

import { KeywordPool } from './KeywordPool'

interface KeywordPoolsProps {
  keywordPool1: string[]
  keywordPool2: string[]
  onKeywordClick: (keyword: string) => void
  labels: {
    hint: string
    concepts: string
    actions: string
    tip: string
  }
}

export function KeywordPools({
  keywordPool1,
  keywordPool2,
  onKeywordClick,
  labels,
}: KeywordPoolsProps) {
  if (keywordPool1.length === 0 && keywordPool2.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <h3 className="font-medium text-gray-800">{labels.hint}</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <KeywordPool
          keywords={keywordPool1}
          title={labels.concepts}
          variant="concept"
          onKeywordClick={onKeywordClick}
        />
        <KeywordPool
          keywords={keywordPool2}
          title={labels.actions}
          variant="action"
          onKeywordClick={onKeywordClick}
        />
      </div>

      <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {labels.tip}
      </p>
    </div>
  )
}
