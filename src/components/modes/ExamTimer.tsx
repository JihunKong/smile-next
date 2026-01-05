'use client'

import { useState, useEffect, useCallback } from 'react'

interface ExamTimerProps {
  totalSeconds: number
  onTimeUp: () => void
  paused?: boolean
  size?: 'sm' | 'md' | 'lg'
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

function getTimeColor(remaining: number, total: number): string {
  const percentage = (remaining / total) * 100
  if (percentage <= 10) return 'text-red-600 bg-red-50'
  if (percentage <= 25) return 'text-yellow-600 bg-yellow-50'
  return 'text-green-600 bg-green-50'
}

export function ExamTimer({ totalSeconds, onTimeUp, paused = false, size = 'md' }: ExamTimerProps) {
  const [remaining, setRemaining] = useState(totalSeconds)
  const [isWarning, setIsWarning] = useState(false)

  const handleTimeUp = useCallback(() => {
    onTimeUp()
  }, [onTimeUp])

  useEffect(() => {
    if (paused || remaining <= 0) return

    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          handleTimeUp()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [paused, handleTimeUp, remaining])

  // Warning animation when time is low
  useEffect(() => {
    const percentage = (remaining / totalSeconds) * 100
    if (percentage <= 10 && remaining > 0) {
      setIsWarning(true)
      const interval = setInterval(() => {
        setIsWarning((prev) => !prev)
      }, 500)
      return () => clearInterval(interval)
    } else {
      setIsWarning(false)
    }
  }, [remaining, totalSeconds])

  const sizeClasses = {
    sm: 'text-sm px-2 py-1',
    md: 'text-lg px-4 py-2',
    lg: 'text-2xl px-6 py-3',
  }

  const colorClass = getTimeColor(remaining, totalSeconds)

  return (
    <div
      className={`
        inline-flex items-center gap-2 rounded-lg font-mono font-bold
        ${sizeClasses[size]}
        ${colorClass}
        ${isWarning ? 'animate-pulse' : ''}
        transition-colors duration-300
      `}
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{formatTime(remaining)}</span>
    </div>
  )
}

// Simple countdown display (no callback)
interface CountdownDisplayProps {
  seconds: number
  size?: 'sm' | 'md' | 'lg'
}

export function CountdownDisplay({ seconds, size = 'md' }: CountdownDisplayProps) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  }

  return (
    <span className={`font-mono font-bold ${sizeClasses[size]}`}>
      {formatTime(seconds)}
    </span>
  )
}
