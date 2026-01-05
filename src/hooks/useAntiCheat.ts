'use client'

import { useEffect, useCallback, useRef, useState } from 'react'

export interface AntiCheatStats {
  tabSwitchCount: number
  copyAttempts: number
  pasteAttempts: number
  blurCount: number
  events: AntiCheatEvent[]
}

export interface AntiCheatEvent {
  type: 'tab_switch' | 'copy' | 'paste' | 'blur' | 'focus'
  timestamp: string
}

export interface UseAntiCheatOptions {
  enabled?: boolean
  onTabSwitch?: (count: number) => void
  onCopyAttempt?: (count: number) => void
  onPasteAttempt?: (count: number) => void
  onBlur?: (count: number) => void
  onStatsChange?: (stats: AntiCheatStats) => void
  preventPaste?: boolean
  showWarningOnTabSwitch?: boolean
}

export interface UseAntiCheatReturn {
  stats: AntiCheatStats
  isWarningVisible: boolean
  dismissWarning: () => void
  handlePaste: (e: React.ClipboardEvent) => void
  handleCopy: (e: React.ClipboardEvent) => void
  resetStats: () => void
}

const initialStats: AntiCheatStats = {
  tabSwitchCount: 0,
  copyAttempts: 0,
  pasteAttempts: 0,
  blurCount: 0,
  events: [],
}

export function useAntiCheat(options: UseAntiCheatOptions = {}): UseAntiCheatReturn {
  const {
    enabled = true,
    onTabSwitch,
    onCopyAttempt,
    onPasteAttempt,
    onBlur,
    onStatsChange,
    preventPaste = true,
    showWarningOnTabSwitch = true,
  } = options

  const [stats, setStats] = useState<AntiCheatStats>(initialStats)
  const [isWarningVisible, setIsWarningVisible] = useState(false)
  const statsRef = useRef(stats)

  // Keep statsRef in sync with stats
  useEffect(() => {
    statsRef.current = stats
  }, [stats])

  // Add event to the log
  const addEvent = useCallback((type: AntiCheatEvent['type']) => {
    const event: AntiCheatEvent = {
      type,
      timestamp: new Date().toISOString(),
    }

    setStats((prev) => {
      const newStats = {
        ...prev,
        events: [...prev.events, event],
      }

      // Update specific counter based on event type
      switch (type) {
        case 'tab_switch':
          newStats.tabSwitchCount = prev.tabSwitchCount + 1
          break
        case 'copy':
          newStats.copyAttempts = prev.copyAttempts + 1
          break
        case 'paste':
          newStats.pasteAttempts = prev.pasteAttempts + 1
          break
        case 'blur':
          newStats.blurCount = prev.blurCount + 1
          break
      }

      return newStats
    })

    return event
  }, [])

  // Handle visibility change (tab switching)
  useEffect(() => {
    if (!enabled) return

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        addEvent('tab_switch')

        const newCount = statsRef.current.tabSwitchCount + 1
        onTabSwitch?.(newCount)

        if (showWarningOnTabSwitch) {
          setIsWarningVisible(true)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [enabled, onTabSwitch, showWarningOnTabSwitch, addEvent])

  // Handle window blur (focus loss)
  useEffect(() => {
    if (!enabled) return

    const handleBlur = () => {
      addEvent('blur')
      const newCount = statsRef.current.blurCount + 1
      onBlur?.(newCount)
    }

    const handleFocus = () => {
      addEvent('focus')
    }

    window.addEventListener('blur', handleBlur)
    window.addEventListener('focus', handleFocus)

    return () => {
      window.removeEventListener('blur', handleBlur)
      window.removeEventListener('focus', handleFocus)
    }
  }, [enabled, onBlur, addEvent])

  // Handle global copy event
  useEffect(() => {
    if (!enabled) return

    const handleCopy = (e: ClipboardEvent) => {
      addEvent('copy')
      const newCount = statsRef.current.copyAttempts + 1
      onCopyAttempt?.(newCount)
    }

    document.addEventListener('copy', handleCopy)

    return () => {
      document.removeEventListener('copy', handleCopy)
    }
  }, [enabled, onCopyAttempt, addEvent])

  // Notify parent when stats change
  useEffect(() => {
    onStatsChange?.(stats)
  }, [stats, onStatsChange])

  // Handle paste on input elements
  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      if (!enabled) return

      addEvent('paste')
      const newCount = statsRef.current.pasteAttempts + 1
      onPasteAttempt?.(newCount)

      if (preventPaste) {
        e.preventDefault()
      }
    },
    [enabled, preventPaste, onPasteAttempt, addEvent]
  )

  // Handle copy on input elements
  const handleCopy = useCallback(
    (e: React.ClipboardEvent) => {
      if (!enabled) return

      addEvent('copy')
      const newCount = statsRef.current.copyAttempts + 1
      onCopyAttempt?.(newCount)
    },
    [enabled, onCopyAttempt, addEvent]
  )

  // Dismiss warning
  const dismissWarning = useCallback(() => {
    setIsWarningVisible(false)
  }, [])

  // Reset stats
  const resetStats = useCallback(() => {
    setStats(initialStats)
  }, [])

  return {
    stats,
    isWarningVisible,
    dismissWarning,
    handlePaste,
    handleCopy,
    resetStats,
  }
}

export default useAntiCheat
