'use client'

import { useState, useCallback } from 'react'
import type { CaseScenario } from '../types'

// ============================================================================
// Types
// ============================================================================

export interface UseScenarioDragDropOptions {
  scenarios: CaseScenario[]
  onReorder: (scenarios: CaseScenario[]) => void
  onDragEnd: () => void
}

export interface UseScenarioDragDropReturn {
  draggedIndex: number | null
  handleDragStart: (index: number) => void
  handleDragOver: (e: React.DragEvent, index: number) => void
  handleDragEnd: () => void
  isDragging: (index: number) => boolean
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useScenarioDragDrop(options: UseScenarioDragDropOptions): UseScenarioDragDropReturn {
  const { scenarios, onReorder, onDragEnd: onDragEndCallback } = options
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index)
  }, [])

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault()
      if (draggedIndex === null || draggedIndex === index) return

      const newScenarios = [...scenarios]
      const [removed] = newScenarios.splice(draggedIndex, 1)
      newScenarios.splice(index, 0, removed)
      onReorder(newScenarios)
      setDraggedIndex(index)
    },
    [draggedIndex, scenarios, onReorder]
  )

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null)
    onDragEndCallback()
  }, [onDragEndCallback])

  const isDragging = useCallback(
    (index: number) => draggedIndex === index,
    [draggedIndex]
  )

  return {
    draggedIndex,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    isDragging,
  }
}
