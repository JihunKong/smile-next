'use client'

import type { BloomsLevel } from '../types'

interface BloomsBadgeProps {
  level: BloomsLevel | string
  label?: string
  size?: 'sm' | 'md' | 'lg'
  showDescription?: boolean
  showIcon?: boolean
}

const BLOOMS_COLORS: Record<string, string> = {
  remember: 'bg-gray-100 text-gray-700',
  understand: 'bg-blue-100 text-blue-700',
  apply: 'bg-green-100 text-green-700',
  analyze: 'bg-yellow-100 text-yellow-700',
  evaluate: 'bg-orange-100 text-orange-700',
  create: 'bg-purple-100 text-purple-700',
}

const BLOOMS_DESCRIPTIONS: Record<string, string> = {
  remember: 'Recall facts and basic concepts',
  understand: 'Explain ideas or concepts',
  apply: 'Use information in new situations',
  analyze: 'Draw connections among ideas',
  evaluate: 'Justify a decision or course of action',
  create: 'Produce new or original work',
}

const BLOOMS_ICONS: Record<string, React.ReactNode> = {
  remember: (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
  understand: (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  apply: (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  analyze: (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  evaluate: (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  create: (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
  ),
}

const SIZE_CLASSES = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
  lg: 'px-4 py-2 text-base',
}

export function BloomsBadge({
  level,
  label,
  size = 'sm',
  showDescription = false,
  showIcon = false,
}: BloomsBadgeProps) {
  const normalizedLevel = level.toLowerCase()
  const colorClasses = BLOOMS_COLORS[normalizedLevel] || BLOOMS_COLORS.remember
  const sizeClasses = SIZE_CLASSES[size]
  const description = BLOOMS_DESCRIPTIONS[normalizedLevel]
  const icon = BLOOMS_ICONS[normalizedLevel]

  // Capitalize the label
  const displayLabel = label || normalizedLevel.charAt(0).toUpperCase() + normalizedLevel.slice(1)

  if (showIcon) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded font-medium ${colorClasses} ${sizeClasses}`}
        title={showDescription ? `${displayLabel}: ${description}` : undefined}
      >
        {icon}
        <span>{displayLabel}</span>
      </span>
    )
  }

  return (
    <span
      className={`inline-block rounded font-medium ${colorClasses} ${sizeClasses}`}
      title={showDescription ? `${displayLabel}: ${description}` : undefined}
    >
      {displayLabel}
    </span>
  )
}
