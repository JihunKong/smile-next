'use client'

interface KeywordBadgeProps {
  keyword: string
  variant?: 'concept' | 'action'
  onClick?: (keyword: string) => void
  tooltip?: string
  selected?: boolean
}

const VARIANT_STYLES = {
  concept: {
    base: 'bg-white text-yellow-800 border border-yellow-300',
    hover: 'hover:bg-yellow-200 hover:border-yellow-400',
    selected: 'ring-2 ring-yellow-500',
  },
  action: {
    base: 'bg-white text-orange-800 border border-orange-300',
    hover: 'hover:bg-orange-200 hover:border-orange-400',
    selected: 'ring-2 ring-orange-500',
  },
}

export function KeywordBadge({
  keyword,
  variant = 'concept',
  onClick,
  tooltip,
  selected = false,
}: KeywordBadgeProps) {
  const styles = VARIANT_STYLES[variant]
  const baseClasses = `px-3 py-1 rounded-full text-sm font-medium transition ${styles.base}`
  const selectedClasses = selected ? styles.selected : ''

  if (onClick) {
    return (
      <button
        type="button"
        onClick={() => onClick(keyword)}
        className={`${baseClasses} ${styles.hover} ${selectedClasses} cursor-pointer`}
        title={tooltip}
      >
        {keyword}
      </button>
    )
  }

  return (
    <span className={`${baseClasses} ${selectedClasses}`}>
      {keyword}
    </span>
  )
}
