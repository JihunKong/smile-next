'use client'

import React from 'react'
import { ActivityModes, modeInfoList, type ActivityMode } from '@/types/activities'

interface ModeSelectorProps {
  selectedMode: ActivityMode
  onModeChange: (mode: ActivityMode) => void
  disabled?: boolean
}

const modeIcons: Record<string, React.ReactNode> = {
  chat: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  clipboard: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  lightbulb: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  briefcase: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
}

const modeColors: Record<string, { bg: string; border: string; text: string; selected: string }> = {
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    selected: 'ring-blue-500 border-blue-500 bg-blue-100',
  },
  red: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    selected: 'ring-red-500 border-red-500 bg-red-100',
  },
  yellow: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-700',
    selected: 'ring-yellow-500 border-yellow-500 bg-yellow-100',
  },
  green: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    selected: 'ring-green-500 border-green-500 bg-green-100',
  },
}

export function ModeSelector({ selectedMode, onModeChange, disabled = false }: ModeSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {modeInfoList.map((mode) => {
        const isSelected = selectedMode === mode.id
        const colors = modeColors[mode.color]

        return (
          <button
            key={mode.id}
            type="button"
            data-mode={mode.id}
            onClick={() => !disabled && onModeChange(mode.id)}
            disabled={disabled}
            className={`
              relative p-4 rounded-lg border-2 transition-all text-left
              ${isSelected ? `${colors.selected} ring-2` : `${colors.bg} ${colors.border} hover:shadow-md`}
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {isSelected && (
              <div className="absolute top-2 right-2">
                <svg className={`w-5 h-5 ${colors.text}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            <div className={`${colors.text} mb-2`}>
              {modeIcons[mode.icon]}
            </div>
            <h3 className={`font-semibold ${colors.text}`}>{mode.name}</h3>
            <p className="text-sm text-gray-600 mt-1">{mode.description}</p>
          </button>
        )
      })}
    </div>
  )
}
