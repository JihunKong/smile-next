'use client'

import { KeywordBadge } from './KeywordBadge'

interface KeywordPoolProps {
  keywords: string[]
  title: string
  variant: 'concept' | 'action'
  onKeywordClick?: (keyword: string) => void
}

const VARIANT_STYLES = {
  concept: {
    background: 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200',
    titleColor: 'text-yellow-800',
    dotColor: 'bg-yellow-500',
  },
  action: {
    background: 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200',
    titleColor: 'text-orange-800',
    dotColor: 'bg-orange-500',
  },
}

export function KeywordPool({
  keywords,
  title,
  variant,
  onKeywordClick,
}: KeywordPoolProps) {
  if (keywords.length === 0) {
    return null
  }

  const styles = VARIANT_STYLES[variant]

  return (
    <div className={`rounded-lg p-4 border ${styles.background}`}>
      <h4 className={`font-medium ${styles.titleColor} mb-2 text-sm flex items-center gap-1`}>
        <span className={`w-2 h-2 ${styles.dotColor} rounded-full`} />
        {title}
      </h4>
      <div className="flex flex-wrap gap-2">
        {keywords.map((keyword, index) => (
          <KeywordBadge
            key={index}
            keyword={keyword}
            variant={variant}
            onClick={onKeywordClick}
            tooltip={onKeywordClick ? 'Click to add' : undefined}
          />
        ))}
      </div>
    </div>
  )
}
