'use client'

import { useState, useTransition } from 'react'
import { toggleLike } from '@/app/(dashboard)/activities/[id]/questions/[questionId]/actions'

interface LikeButtonProps {
  questionId: string
  initialLiked: boolean
  initialCount: number
  size?: 'sm' | 'md'
  compact?: boolean
}

export function LikeButton({
  questionId,
  initialLiked,
  initialCount,
  size = 'sm',
  compact = false,
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [isPending, startTransition] = useTransition()

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    // Optimistic update
    const newLiked = !liked
    const newCount = newLiked ? count + 1 : count - 1
    setLiked(newLiked)
    setCount(newCount)

    startTransition(async () => {
      const result = await toggleLike(questionId)

      if (result.success && result.data) {
        // Update with server response
        setLiked(result.data.liked)
        setCount(result.data.count)
      } else {
        // Rollback on error
        setLiked(liked)
        setCount(count)
      }
    })
  }

  const sizeClasses = compact
    ? 'text-xs gap-0.5'
    : size === 'sm'
      ? 'text-xs gap-1'
      : 'text-sm gap-1.5'

  const iconSize = compact ? 'w-3.5 h-3.5' : size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`flex items-center ${sizeClasses} transition ${
        liked
          ? 'text-red-500 hover:text-red-600'
          : 'text-gray-500 hover:text-red-500'
      } ${isPending ? 'opacity-50' : ''}`}
      title={liked ? 'Unlike' : 'Like'}
    >
      <svg
        className={`${iconSize} transition-transform ${liked ? 'scale-110' : ''}`}
        fill={liked ? 'currentColor' : 'none'}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={liked ? 0 : 2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      <span>{count}</span>
    </button>
  )
}
