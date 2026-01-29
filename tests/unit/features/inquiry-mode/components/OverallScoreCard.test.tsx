/**
 * Tests for OverallScoreCard Component
 */

import { render, screen } from '@testing-library/react'
import { OverallScoreCard } from '@/features/inquiry-mode/components/OverallScoreCard'

const defaultLabels = {
  passedTitle: 'Congratulations!',
  failedTitle: 'Good Effort!',
  questionsGenerated: 'You generated {count} questions',
  passThresholdLabel: 'Pass threshold',
  statusLabel: 'Status',
  passed: 'Passed',
  needsImprovement: 'Needs Improvement',
  average: 'Average',
}

describe('OverallScoreCard', () => {
  describe('Passed State', () => {
    it('should render passed title when passed is true', () => {
      render(
        <OverallScoreCard
          passed={true}
          avgScore={8.5}
          questionsCount={5}
          passThreshold={6.0}
          labels={defaultLabels}
        />
      )
      expect(screen.getByText('Congratulations!')).toBeInTheDocument()
    })

    it('should show Passed status', () => {
      render(
        <OverallScoreCard
          passed={true}
          avgScore={8.5}
          questionsCount={5}
          passThreshold={6.0}
          labels={defaultLabels}
        />
      )
      expect(screen.getByText(/Passed/)).toBeInTheDocument()
    })

    it('should have green styling when passed', () => {
      const { container } = render(
        <OverallScoreCard
          passed={true}
          avgScore={8.5}
          questionsCount={5}
          passThreshold={6.0}
          labels={defaultLabels}
        />
      )
      const card = container.firstChild as HTMLElement
      expect(card.className).toContain('bg-green')
    })
  })

  describe('Failed State', () => {
    it('should render failed title when passed is false', () => {
      render(
        <OverallScoreCard
          passed={false}
          avgScore={4.5}
          questionsCount={5}
          passThreshold={6.0}
          labels={defaultLabels}
        />
      )
      expect(screen.getByText('Good Effort!')).toBeInTheDocument()
    })

    it('should show Needs Improvement status', () => {
      render(
        <OverallScoreCard
          passed={false}
          avgScore={4.5}
          questionsCount={5}
          passThreshold={6.0}
          labels={defaultLabels}
        />
      )
      expect(screen.getByText(/Needs Improvement/)).toBeInTheDocument()
    })

    it('should have yellow styling when failed', () => {
      const { container } = render(
        <OverallScoreCard
          passed={false}
          avgScore={4.5}
          questionsCount={5}
          passThreshold={6.0}
          labels={defaultLabels}
        />
      )
      const card = container.firstChild as HTMLElement
      expect(card.className).toContain('bg-yellow')
    })
  })

  describe('Score Display', () => {
    it('should display average score', () => {
      render(
        <OverallScoreCard
          passed={true}
          avgScore={7.5}
          questionsCount={5}
          passThreshold={6.0}
          labels={defaultLabels}
        />
      )
      expect(screen.getByText('7.5')).toBeInTheDocument()
    })

    it('should display / 10 Average text', () => {
      render(
        <OverallScoreCard
          passed={true}
          avgScore={7.5}
          questionsCount={5}
          passThreshold={6.0}
          labels={defaultLabels}
        />
      )
      expect(screen.getByText(/\/ 10/)).toBeInTheDocument()
      expect(screen.getByText(/Average/)).toBeInTheDocument()
    })

    it('should format score to one decimal place', () => {
      render(
        <OverallScoreCard
          passed={true}
          avgScore={7.333}
          questionsCount={5}
          passThreshold={6.0}
          labels={defaultLabels}
        />
      )
      expect(screen.getByText('7.3')).toBeInTheDocument()
    })
  })

  describe('Questions Count', () => {
    it('should display questions count', () => {
      render(
        <OverallScoreCard
          passed={true}
          avgScore={7.5}
          questionsCount={5}
          passThreshold={6.0}
          labels={defaultLabels}
        />
      )
      expect(screen.getByText('You generated 5 questions')).toBeInTheDocument()
    })

    it('should display different counts correctly', () => {
      render(
        <OverallScoreCard
          passed={true}
          avgScore={7.5}
          questionsCount={10}
          passThreshold={6.0}
          labels={defaultLabels}
        />
      )
      expect(screen.getByText('You generated 10 questions')).toBeInTheDocument()
    })
  })

  describe('Pass Threshold', () => {
    it('should display pass threshold', () => {
      render(
        <OverallScoreCard
          passed={true}
          avgScore={7.5}
          questionsCount={5}
          passThreshold={6.0}
          labels={defaultLabels}
        />
      )
      expect(screen.getByText(/Pass threshold: 6/)).toBeInTheDocument()
    })

    it('should display different thresholds correctly', () => {
      render(
        <OverallScoreCard
          passed={false}
          avgScore={6.5}
          questionsCount={5}
          passThreshold={7.0}
          labels={defaultLabels}
        />
      )
      expect(screen.getByText(/Pass threshold: 7/)).toBeInTheDocument()
    })
  })

  describe('Score Color', () => {
    it('should show green color for high scores', () => {
      const { container } = render(
        <OverallScoreCard
          passed={true}
          avgScore={8.5}
          questionsCount={5}
          passThreshold={6.0}
          labels={defaultLabels}
        />
      )
      expect(container.querySelector('.text-green-600')).toBeInTheDocument()
    })

    it('should show yellow color for medium scores', () => {
      const { container } = render(
        <OverallScoreCard
          passed={true}
          avgScore={6.5}
          questionsCount={5}
          passThreshold={6.0}
          labels={defaultLabels}
        />
      )
      expect(container.querySelector('.text-yellow-600')).toBeInTheDocument()
    })

    it('should show red color for low scores', () => {
      const { container } = render(
        <OverallScoreCard
          passed={false}
          avgScore={4.5}
          questionsCount={5}
          passThreshold={6.0}
          labels={defaultLabels}
        />
      )
      expect(container.querySelector('.text-red-600')).toBeInTheDocument()
    })
  })
})
