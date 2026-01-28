/**
 * Tests for Inquiry Mode Utils
 */

import {
  formatTime,
  getScoreColor,
  getScoreBgColor,
  getBloomsBadgeColor,
  getScoreQualityLabel,
  getScoreQuality,
  bloomsLevelToNumber,
  calculateAverageScore,
} from '@/features/inquiry-mode/utils'

describe('Inquiry Mode Utils', () => {
  describe('formatTime', () => {
    it('should format seconds into minutes and seconds', () => {
      expect(formatTime(0)).toBe('0m 0s')
      expect(formatTime(30)).toBe('0m 30s')
      expect(formatTime(60)).toBe('1m 0s')
      expect(formatTime(90)).toBe('1m 30s')
      expect(formatTime(125)).toBe('2m 5s')
    })

    it('should handle large values', () => {
      expect(formatTime(3600)).toBe('60m 0s')
      expect(formatTime(3661)).toBe('61m 1s')
    })
  })

  describe('getScoreColor', () => {
    it('should return gray for null scores', () => {
      expect(getScoreColor(null)).toBe('text-gray-500')
    })

    it('should return green for scores >= 8', () => {
      expect(getScoreColor(8)).toBe('text-green-600')
      expect(getScoreColor(9)).toBe('text-green-600')
      expect(getScoreColor(10)).toBe('text-green-600')
    })

    it('should return yellow for scores >= 6 and < 8', () => {
      expect(getScoreColor(6)).toBe('text-yellow-600')
      expect(getScoreColor(7)).toBe('text-yellow-600')
      expect(getScoreColor(7.99)).toBe('text-yellow-600')
    })

    it('should return red for scores < 6', () => {
      expect(getScoreColor(0)).toBe('text-red-600')
      expect(getScoreColor(5)).toBe('text-red-600')
      expect(getScoreColor(5.99)).toBe('text-red-600')
    })
  })

  describe('getScoreBgColor', () => {
    it('should return green bg for scores >= 8', () => {
      expect(getScoreBgColor(8)).toBe('bg-green-100')
      expect(getScoreBgColor(10)).toBe('bg-green-100')
    })

    it('should return yellow bg for scores >= 6 and < 8', () => {
      expect(getScoreBgColor(6)).toBe('bg-yellow-100')
      expect(getScoreBgColor(7.5)).toBe('bg-yellow-100')
    })

    it('should return red bg for scores < 6', () => {
      expect(getScoreBgColor(0)).toBe('bg-red-100')
      expect(getScoreBgColor(5)).toBe('bg-red-100')
    })
  })

  describe('getBloomsBadgeColor', () => {
    it('should return correct colors for each Bloom\'s level', () => {
      expect(getBloomsBadgeColor('remember')).toBe('bg-gray-100 text-gray-700')
      expect(getBloomsBadgeColor('understand')).toBe('bg-blue-100 text-blue-700')
      expect(getBloomsBadgeColor('apply')).toBe('bg-green-100 text-green-700')
      expect(getBloomsBadgeColor('analyze')).toBe('bg-yellow-100 text-yellow-700')
      expect(getBloomsBadgeColor('evaluate')).toBe('bg-orange-100 text-orange-700')
      expect(getBloomsBadgeColor('create')).toBe('bg-purple-100 text-purple-700')
    })

    it('should be case-insensitive', () => {
      expect(getBloomsBadgeColor('REMEMBER')).toBe('bg-gray-100 text-gray-700')
      expect(getBloomsBadgeColor('Create')).toBe('bg-purple-100 text-purple-700')
      expect(getBloomsBadgeColor('ANALYZE')).toBe('bg-yellow-100 text-yellow-700')
    })

    it('should return default gray for null or unknown levels', () => {
      expect(getBloomsBadgeColor(null)).toBe('bg-gray-100 text-gray-700')
      expect(getBloomsBadgeColor('unknown')).toBe('bg-gray-100 text-gray-700')
      expect(getBloomsBadgeColor('')).toBe('bg-gray-100 text-gray-700')
    })
  })

  describe('getScoreQualityLabel', () => {
    it('should return "Excellent" for scores >= 8', () => {
      expect(getScoreQualityLabel(8)).toBe('Excellent')
      expect(getScoreQualityLabel(10)).toBe('Excellent')
    })

    it('should return "Good" for scores >= 6 and < 8', () => {
      expect(getScoreQualityLabel(6)).toBe('Good')
      expect(getScoreQualityLabel(7)).toBe('Good')
    })

    it('should return "Needs Improvement" for scores < 6', () => {
      expect(getScoreQualityLabel(0)).toBe('Needs Improvement')
      expect(getScoreQualityLabel(5)).toBe('Needs Improvement')
    })
  })

  describe('getScoreQuality', () => {
    it('should return "excellent" for scores >= 8', () => {
      expect(getScoreQuality(8)).toBe('excellent')
      expect(getScoreQuality(10)).toBe('excellent')
    })

    it('should return "good" for scores >= 6 and < 8', () => {
      expect(getScoreQuality(6)).toBe('good')
      expect(getScoreQuality(7.5)).toBe('good')
    })

    it('should return "needs_improvement" for scores < 6', () => {
      expect(getScoreQuality(0)).toBe('needs_improvement')
      expect(getScoreQuality(5.9)).toBe('needs_improvement')
    })
  })

  describe('bloomsLevelToNumber', () => {
    it('should convert Bloom\'s levels to numeric values', () => {
      expect(bloomsLevelToNumber('remember')).toBe(1)
      expect(bloomsLevelToNumber('understand')).toBe(2)
      expect(bloomsLevelToNumber('apply')).toBe(3)
      expect(bloomsLevelToNumber('analyze')).toBe(4)
      expect(bloomsLevelToNumber('evaluate')).toBe(5)
      expect(bloomsLevelToNumber('create')).toBe(6)
    })

    it('should be case-insensitive', () => {
      expect(bloomsLevelToNumber('REMEMBER')).toBe(1)
      expect(bloomsLevelToNumber('Create')).toBe(6)
    })

    it('should return 0 for null or unknown levels', () => {
      expect(bloomsLevelToNumber(null)).toBe(0)
      expect(bloomsLevelToNumber('unknown')).toBe(0)
      expect(bloomsLevelToNumber('')).toBe(0)
    })
  })

  describe('calculateAverageScore', () => {
    it('should calculate average of valid scores', () => {
      expect(calculateAverageScore([8, 6, 10])).toBe(8)
      expect(calculateAverageScore([7, 8, 9])).toBe(8)
    })

    it('should ignore null values', () => {
      expect(calculateAverageScore([8, null, 10])).toBe(9)
      expect(calculateAverageScore([6, null, null, 10])).toBe(8)
    })

    it('should return 0 for empty array', () => {
      expect(calculateAverageScore([])).toBe(0)
    })

    it('should return 0 for array with only null values', () => {
      expect(calculateAverageScore([null, null, null])).toBe(0)
    })

    it('should handle single value', () => {
      expect(calculateAverageScore([7.5])).toBe(7.5)
    })

    it('should handle decimal values', () => {
      expect(calculateAverageScore([7.5, 8.5])).toBe(8)
      expect(calculateAverageScore([6.0, 7.0, 8.0])).toBeCloseTo(7, 5)
    })
  })
})
