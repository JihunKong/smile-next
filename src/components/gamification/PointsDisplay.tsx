'use client'

import { useEffect, useState, useRef } from 'react'

export interface PointsBreakdownItem {
  category: string
  points: number
  icon?: string
  color?: string
}

export interface PointsDisplayProps {
  points: number
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
  breakdown?: PointsBreakdownItem[]
  showBreakdown?: 'tooltip' | 'accordion' | 'none'
  label?: string
  className?: string
}

const SIZE_CLASSES = {
  sm: {
    container: 'p-3',
    points: 'text-2xl',
    label: 'text-xs',
    icon: 'text-lg',
  },
  md: {
    container: 'p-4',
    points: 'text-4xl',
    label: 'text-sm',
    icon: 'text-xl',
  },
  lg: {
    container: 'p-6',
    points: 'text-5xl',
    label: 'text-base',
    icon: 'text-2xl',
  },
}

// Animate counting up to target number
function useCountAnimation(target: number, duration: number = 1000, enabled: boolean = true) {
  const [count, setCount] = useState(enabled ? 0 : target)
  const prevTarget = useRef(target)

  useEffect(() => {
    if (!enabled) {
      setCount(target)
      return
    }

    const startValue = prevTarget.current
    const difference = target - startValue
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const currentValue = Math.round(startValue + difference * easeOutQuart)

      setCount(currentValue)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
    prevTarget.current = target
  }, [target, duration, enabled])

  return count
}

export default function PointsDisplay({
  points,
  size = 'md',
  animated = true,
  breakdown = [],
  showBreakdown = 'none',
  label = 'SMILE Points',
  className = '',
}: PointsDisplayProps) {
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const displayPoints = useCountAnimation(points, 1000, animated)
  const sizeClasses = SIZE_CLASSES[size]

  const hasBreakdown = breakdown.length > 0

  return (
    <div className={`relative ${className}`}>
      <div
        className={`bg-white rounded-xl shadow-md ${sizeClasses.container} text-center`}
        onMouseEnter={() => showBreakdown === 'tooltip' && hasBreakdown && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {/* Main points display */}
        <div className="flex items-center justify-center gap-3">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${sizeClasses.icon}`}
            style={{ background: 'linear-gradient(135deg, #8C1515, #6B1010)' }}
          >
            <i className="fas fa-star" aria-hidden="true" />
          </div>
          <div>
            <div
              className={`${sizeClasses.points} font-bold text-[#8C1515] tabular-nums`}
              role="status"
              aria-live="polite"
              aria-label={`${points.toLocaleString()} ${label}`}
            >
              {displayPoints.toLocaleString()}
            </div>
            <div className={`${sizeClasses.label} text-gray-500`}>
              {label}
            </div>
          </div>
        </div>

        {/* Accordion breakdown toggle */}
        {showBreakdown === 'accordion' && hasBreakdown && (
          <button
            onClick={() => setIsBreakdownOpen(!isBreakdownOpen)}
            className="mt-3 text-sm text-[#8C1515] hover:underline flex items-center justify-center gap-1 w-full"
            aria-expanded={isBreakdownOpen}
            aria-controls="points-breakdown"
          >
            <span>View breakdown</span>
            <i
              className={`fas fa-chevron-down transition-transform ${isBreakdownOpen ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </button>
        )}

        {/* Accordion breakdown content */}
        {showBreakdown === 'accordion' && isBreakdownOpen && (
          <div
            id="points-breakdown"
            className="mt-4 pt-4 border-t border-gray-200 space-y-2"
          >
            {breakdown.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-sm"
              >
                <span className="flex items-center gap-2 text-gray-600">
                  {item.icon && (
                    <i
                      className={`fas ${item.icon}`}
                      style={{ color: item.color || '#6b7280' }}
                      aria-hidden="true"
                    />
                  )}
                  {item.category}
                </span>
                <span
                  className="font-medium tabular-nums"
                  style={{ color: item.color || '#8C1515' }}
                >
                  +{item.points.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tooltip breakdown */}
      {showBreakdown === 'tooltip' && showTooltip && hasBreakdown && (
        <div
          className="absolute left-1/2 -translate-x-1/2 top-full mt-2 bg-gray-900 text-white rounded-lg p-3 shadow-lg z-10 min-w-[200px]"
          role="tooltip"
        >
          <div className="text-xs font-medium text-gray-400 mb-2">Points Breakdown</div>
          <div className="space-y-1.5">
            {breakdown.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-sm"
              >
                <span className="flex items-center gap-2">
                  {item.icon && (
                    <i
                      className={`fas ${item.icon}`}
                      style={{ color: item.color || '#9ca3af' }}
                      aria-hidden="true"
                    />
                  )}
                  {item.category}
                </span>
                <span className="font-medium tabular-nums text-green-400">
                  +{item.points.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
          {/* Tooltip arrow */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-gray-900 rotate-45" />
        </div>
      )}
    </div>
  )
}
