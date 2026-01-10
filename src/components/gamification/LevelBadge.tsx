'use client'

import { useMemo } from 'react'

export interface LevelBadgeProps {
  level: number // 1-6
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
  className?: string
}

interface LevelConfig {
  name: string
  icon: string
  color: string
  bgColor: string
  borderColor: string
  gradient: string
}

const LEVEL_CONFIGS: Record<number, LevelConfig> = {
  1: {
    name: 'Starter',
    icon: 'fa-seedling',
    color: '#6b7280', // gray-500
    bgColor: '#f3f4f6', // gray-100
    borderColor: '#d1d5db', // gray-300
    gradient: 'linear-gradient(135deg, #9ca3af, #6b7280)',
  },
  2: {
    name: 'Learner',
    icon: 'fa-book-open',
    color: '#3b82f6', // blue-500
    bgColor: '#dbeafe', // blue-100
    borderColor: '#93c5fd', // blue-300
    gradient: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
  },
  3: {
    name: 'Apprentice',
    icon: 'fa-graduation-cap',
    color: '#22c55e', // green-500
    bgColor: '#dcfce7', // green-100
    borderColor: '#86efac', // green-300
    gradient: 'linear-gradient(135deg, #4ade80, #22c55e)',
  },
  4: {
    name: 'Maker',
    icon: 'fa-hammer',
    color: '#f59e0b', // amber-500
    bgColor: '#fef3c7', // amber-100
    borderColor: '#fcd34d', // amber-300
    gradient: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
  },
  5: {
    name: 'Trainer',
    icon: 'fa-chalkboard-teacher',
    color: '#8b5cf6', // violet-500
    bgColor: '#ede9fe', // violet-100
    borderColor: '#c4b5fd', // violet-300
    gradient: 'linear-gradient(135deg, #a78bfa, #8b5cf6)',
  },
  6: {
    name: 'Master',
    icon: 'fa-crown',
    color: '#8C1515', // Stanford Cardinal
    bgColor: '#fee2e2', // red-100
    borderColor: '#fca5a5', // red-300
    gradient: 'linear-gradient(135deg, #B91E1E, #8C1515)',
  },
}

const SIZE_CLASSES = {
  sm: {
    container: 'w-8 h-8',
    icon: 'text-sm',
    text: 'text-xs',
    gap: 'gap-1',
  },
  md: {
    container: 'w-12 h-12',
    icon: 'text-xl',
    text: 'text-sm',
    gap: 'gap-2',
  },
  lg: {
    container: 'w-16 h-16',
    icon: 'text-2xl',
    text: 'text-base',
    gap: 'gap-2',
  },
}

export default function LevelBadge({
  level,
  size = 'md',
  showName = false,
  className = '',
}: LevelBadgeProps) {
  const config = useMemo(() => {
    // Clamp level between 1 and 6
    const clampedLevel = Math.min(Math.max(level, 1), 6)
    return LEVEL_CONFIGS[clampedLevel]
  }, [level])

  const sizeClasses = SIZE_CLASSES[size]

  return (
    <div
      className={`inline-flex items-center ${sizeClasses.gap} ${className}`}
      role="img"
      aria-label={`Level ${level}: ${config.name}`}
    >
      <div
        className={`${sizeClasses.container} rounded-full flex items-center justify-center text-white shadow-md transition-transform hover:scale-105`}
        style={{ background: config.gradient }}
      >
        <i className={`fas ${config.icon} ${sizeClasses.icon}`} aria-hidden="true" />
      </div>
      {showName && (
        <div className="flex flex-col">
          <span className={`font-semibold ${sizeClasses.text}`} style={{ color: config.color }}>
            {config.name}
          </span>
          <span className="text-xs text-gray-500">Level {level}</span>
        </div>
      )}
    </div>
  )
}

// Export level configurations for use in other components
export { LEVEL_CONFIGS }
export type { LevelConfig }
