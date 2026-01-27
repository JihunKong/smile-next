/**
 * ActivitySelector Component Tests
 *
 * TDD tests for the ActivitySelector component that allows
 * searching and selecting activities for a certificate.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ActivitySelector } from '@/features/certificates/components/ActivitySelector'
import type { Activity, SelectedActivity } from '@/features/certificates/types'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

const mockActivities: Activity[] = [
  {
    id: 'act-1',
    name: 'Introduction to Web Dev',
    description: 'Learn basics of web development',
    activityType: 'lesson',
    owningGroup: { id: 'group-1', name: 'Web Development' },
  },
  {
    id: 'act-2',
    name: 'HTML Basics Quiz',
    description: 'Test your HTML knowledge',
    activityType: 'quiz',
    owningGroup: { id: 'group-1', name: 'Web Development' },
  },
  {
    id: 'act-3',
    name: 'CSS Styling Project',
    description: 'Build a styled website',
    activityType: 'project',
    owningGroup: null,
  },
]

const mockSelectedActivities: SelectedActivity[] = [
  {
    activityId: 'act-1',
    name: 'Introduction to Web Dev',
    activityType: 'lesson',
    sequenceOrder: 1,
    required: true,
  },
]

describe('ActivitySelector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
  })

  // ===========================================================================
  // Rendering Tests
  // ===========================================================================

  describe('Rendering', () => {
    it('renders search input', () => {
      render(
        <ActivitySelector
          selectedActivities={[]}
          onAdd={vi.fn()}
          onRemove={vi.fn()}
        />
      )

      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument()
    })

    it('renders empty state when no activities selected', () => {
      render(
        <ActivitySelector
          selectedActivities={[]}
          onAdd={vi.fn()}
          onRemove={vi.fn()}
        />
      )

      expect(screen.getByText(/no activities added/i)).toBeInTheDocument()
    })

    it('renders selected activities', () => {
      render(
        <ActivitySelector
          selectedActivities={mockSelectedActivities}
          onAdd={vi.fn()}
          onRemove={vi.fn()}
        />
      )

      expect(screen.getByText('Introduction to Web Dev')).toBeInTheDocument()
    })

    it('shows activity count in header', () => {
      render(
        <ActivitySelector
          selectedActivities={mockSelectedActivities}
          onAdd={vi.fn()}
          onRemove={vi.fn()}
        />
      )

      expect(screen.getByText(/Selected Activities \(1\)/)).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // Search Tests
  // ===========================================================================

  describe('Search', () => {
    it('calls API when user types in search', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ activities: mockActivities }),
      })

      render(
        <ActivitySelector
          selectedActivities={[]}
          onAdd={vi.fn()}
          onRemove={vi.fn()}
        />
      )

      const input = screen.getByPlaceholderText(/search/i)
      fireEvent.change(input, { target: { value: 'web' } })

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled()
      })
    })

    it('shows search results', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ activities: mockActivities }),
      })

      render(
        <ActivitySelector
          selectedActivities={[]}
          onAdd={vi.fn()}
          onRemove={vi.fn()}
        />
      )

      const input = screen.getByPlaceholderText(/search/i)
      fireEvent.change(input, { target: { value: 'web' } })

      await waitFor(() => {
        expect(screen.getByText('Introduction to Web Dev')).toBeInTheDocument()
      })
    })

    it('shows loading state during search', async () => {
      mockFetch.mockImplementation(() => new Promise(() => {})) // Never resolves

      render(
        <ActivitySelector
          selectedActivities={[]}
          onAdd={vi.fn()}
          onRemove={vi.fn()}
        />
      )

      const input = screen.getByPlaceholderText(/search/i)
      fireEvent.change(input, { target: { value: 'web' } })

      await waitFor(() => {
        expect(screen.getByTestId('search-loading')).toBeInTheDocument()
      })
    })

    it('filters out already selected activities from results', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ activities: mockActivities }),
      })

      render(
        <ActivitySelector
          selectedActivities={mockSelectedActivities}
          onAdd={vi.fn()}
          onRemove={vi.fn()}
        />
      )

      const input = screen.getByPlaceholderText(/search/i)
      fireEvent.change(input, { target: { value: 'web' } })

      await waitFor(() => {
        // act-1 is already selected, so only act-2 and act-3 should appear
        const results = screen.getAllByRole('button', { name: /add/i })
        expect(results).toHaveLength(2)
      })
    })
  })

  // ===========================================================================
  // Add Activity Tests
  // ===========================================================================

  describe('Add Activity', () => {
    it('calls onAdd when activity is clicked', async () => {
      const onAdd = vi.fn()
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ activities: mockActivities }),
      })

      render(
        <ActivitySelector
          selectedActivities={[]}
          onAdd={onAdd}
          onRemove={vi.fn()}
        />
      )

      const input = screen.getByPlaceholderText(/search/i)
      fireEvent.change(input, { target: { value: 'web' } })

      await waitFor(() => {
        expect(screen.getByText('Introduction to Web Dev')).toBeInTheDocument()
      })

      const addButtons = screen.getAllByRole('button', { name: /add/i })
      fireEvent.click(addButtons[0])

      expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({
        activityId: 'act-1',
        name: 'Introduction to Web Dev',
      }))
    })

    it('clears search after adding activity', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ activities: mockActivities }),
      })

      render(
        <ActivitySelector
          selectedActivities={[]}
          onAdd={vi.fn()}
          onRemove={vi.fn()}
        />
      )

      const input = screen.getByPlaceholderText(/search/i) as HTMLInputElement
      fireEvent.change(input, { target: { value: 'web' } })

      await waitFor(() => {
        expect(screen.getByText('Introduction to Web Dev')).toBeInTheDocument()
      })

      const addButtons = screen.getAllByRole('button', { name: /add/i })
      fireEvent.click(addButtons[0])

      expect(input.value).toBe('')
    })
  })

  // ===========================================================================
  // Remove Activity Tests
  // ===========================================================================

  describe('Remove Activity', () => {
    it('calls onRemove when remove button clicked', () => {
      const onRemove = vi.fn()

      render(
        <ActivitySelector
          selectedActivities={mockSelectedActivities}
          onAdd={vi.fn()}
          onRemove={onRemove}
        />
      )

      const removeButton = screen.getByRole('button', { name: /remove/i })
      fireEvent.click(removeButton)

      expect(onRemove).toHaveBeenCalledWith('act-1')
    })
  })

  // ===========================================================================
  // Reorder Tests
  // ===========================================================================

  describe('Reorder', () => {
    const twoActivities: SelectedActivity[] = [
      { activityId: 'act-1', name: 'First', activityType: 'lesson', sequenceOrder: 1, required: true },
      { activityId: 'act-2', name: 'Second', activityType: 'quiz', sequenceOrder: 2, required: true },
    ]

    it('calls onReorder when move up clicked', () => {
      const onReorder = vi.fn()

      render(
        <ActivitySelector
          selectedActivities={twoActivities}
          onAdd={vi.fn()}
          onRemove={vi.fn()}
          onReorder={onReorder}
        />
      )

      // Second activity's move up button
      const moveUpButtons = screen.getAllByRole('button', { name: /move up/i })
      fireEvent.click(moveUpButtons[1])

      expect(onReorder).toHaveBeenCalledWith(1, 0)
    })

    it('calls onReorder when move down clicked', () => {
      const onReorder = vi.fn()

      render(
        <ActivitySelector
          selectedActivities={twoActivities}
          onAdd={vi.fn()}
          onRemove={vi.fn()}
          onReorder={onReorder}
        />
      )

      // First activity's move down button
      const moveDownButtons = screen.getAllByRole('button', { name: /move down/i })
      fireEvent.click(moveDownButtons[0])

      expect(onReorder).toHaveBeenCalledWith(0, 1)
    })

    it('disables move up for first activity', () => {
      render(
        <ActivitySelector
          selectedActivities={twoActivities}
          onAdd={vi.fn()}
          onRemove={vi.fn()}
          onReorder={vi.fn()}
        />
      )

      const moveUpButtons = screen.getAllByRole('button', { name: /move up/i })
      expect(moveUpButtons[0]).toBeDisabled()
    })

    it('disables move down for last activity', () => {
      render(
        <ActivitySelector
          selectedActivities={twoActivities}
          onAdd={vi.fn()}
          onRemove={vi.fn()}
          onReorder={vi.fn()}
        />
      )

      const moveDownButtons = screen.getAllByRole('button', { name: /move down/i })
      expect(moveDownButtons[1]).toBeDisabled()
    })
  })

  // ===========================================================================
  // Required Toggle Tests
  // ===========================================================================

  describe('Required Toggle', () => {
    it('calls onToggleRequired when checkbox clicked', () => {
      const onToggleRequired = vi.fn()

      render(
        <ActivitySelector
          selectedActivities={mockSelectedActivities}
          onAdd={vi.fn()}
          onRemove={vi.fn()}
          onToggleRequired={onToggleRequired}
        />
      )

      const checkbox = screen.getByRole('checkbox')
      fireEvent.click(checkbox)

      expect(onToggleRequired).toHaveBeenCalledWith('act-1', false)
    })

    it('shows checked state for required activities', () => {
      const onToggleRequired = vi.fn()

      render(
        <ActivitySelector
          selectedActivities={mockSelectedActivities}
          onAdd={vi.fn()}
          onRemove={vi.fn()}
          onToggleRequired={onToggleRequired}
        />
      )

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toBeChecked()
    })

    it('does not show checkbox when onToggleRequired not provided', () => {
      render(
        <ActivitySelector
          selectedActivities={mockSelectedActivities}
          onAdd={vi.fn()}
          onRemove={vi.fn()}
        />
      )

      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    })
  })
})
