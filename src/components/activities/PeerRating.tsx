'use client'

import { useState } from 'react'

interface PeerRatingProps {
  questionId: string
  initialRating?: number | null
  isOwnQuestion?: boolean
  compact?: boolean
  onRate?: (rating: number) => void
}

export function PeerRating({
  questionId,
  initialRating,
  isOwnQuestion = false,
  compact = false,
  onRate
}: PeerRatingProps) {
  const [rating, setRating] = useState<number | null>(initialRating ?? null)
  const [hoverRating, setHoverRating] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleRate(value: number) {
    if (isSubmitting || isOwnQuestion) return

    setIsSubmitting(true)
    setError(null)
    try {
      const response = await fetch(`/api/questions/${questionId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: value }),
      })

      const data = await response.json()

      if (response.ok) {
        setRating(value)
        onRate?.(value)
      } else {
        setError(data.error || 'Failed to submit rating')
      }
    } catch (err) {
      console.error('Failed to submit rating:', err)
      setError('Failed to submit rating')
    } finally {
      setIsSubmitting(false)
    }
  }

  const displayRating = hoverRating ?? rating ?? 0

  const isDisabled = isSubmitting || isOwnQuestion

  if (compact) {
    return (
      <div className="relative">
        <div
          className={`flex items-center gap-0.5 group ${isOwnQuestion ? 'opacity-50 cursor-not-allowed' : ''}`}
          onMouseLeave={() => setHoverRating(null)}
          title={isOwnQuestion ? 'You cannot rate your own question' : 'Rate this question'}
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => handleRate(star)}
              onMouseEnter={() => !isOwnQuestion && setHoverRating(star)}
              disabled={isDisabled}
              className="p-0 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                className={`w-3.5 h-3.5 transition ${
                  star <= displayRating
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-300 fill-gray-300'
                }`}
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          ))}
          {rating !== null && (
            <span className="ml-1 text-xs text-gray-500">{rating.toFixed(1)}</span>
          )}
        </div>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
    )
  }

  return (
    <div className="relative">
      <div
        className={`flex items-center gap-1 group ${isOwnQuestion ? 'opacity-50 cursor-not-allowed' : ''}`}
        onMouseLeave={() => setHoverRating(null)}
        title={isOwnQuestion ? 'You cannot rate your own question' : 'Rate this question'}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleRate(star)}
            onMouseEnter={() => !isOwnQuestion && setHoverRating(star)}
            disabled={isDisabled}
            className="p-0.5 focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              className={`w-5 h-5 transition ${
                star <= displayRating
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300 fill-gray-300 group-hover:text-yellow-200'
              }`}
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
        {rating !== null && (
          <span className="ml-1.5 text-sm text-gray-600 font-medium">{rating.toFixed(1)}</span>
        )}
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}
