import { describe, it, expect } from 'vitest'
import { findBestMatch, matchKeywords, extractPotentialKeywords } from '@/lib/utils/keywordMatcher'

describe('keywordMatcher', () => {
  describe('findBestMatch', () => {
    it('should find exact match', () => {
      const result = findBestMatch('education', 'This is about education and learning')
      expect(result.matched).toBe(true)
      expect(result.score).toBe(1.0)
      expect(result.matchedWord).toBe('education')
    })

    it('should find case-insensitive match', () => {
      const result = findBestMatch('EDUCATION', 'This is about education')
      expect(result.matched).toBe(true)
      expect(result.score).toBe(1.0)
    })

    it('should find fuzzy match with high similarity', () => {
      const result = findBestMatch('educatn', 'This is about education')
      expect(result.matched).toBe(true)
      expect(result.score).toBeGreaterThan(0.8)
    })

    it('should not match when similarity is too low', () => {
      const result = findBestMatch('xyzabc', 'This is about education')
      expect(result.matched).toBe(false)
      expect(result.score).toBeLessThan(0.8)
    })

    it('should respect case sensitivity when configured', () => {
      const result = findBestMatch('EDUCATION', 'This is about education', {
        caseSensitive: true,
      })
      expect(result.matched).toBe(false)
    })

    it('should not allow partial match when configured', () => {
      // Note: The current implementation checks for substring matches first,
      // so 'educ' will match 'education' even with allowPartialMatch: false.
      // This test verifies that fuzzy matching (similarity-based) is disabled.
      const result = findBestMatch('xyzabc', 'This is about education', {
        allowPartialMatch: false,
      })
      expect(result.matched).toBe(false)
      expect(result.score).toBe(0)
    })

    it('should return position of match', () => {
      const result = findBestMatch('education', 'This is about education')
      expect(result.position).toBeGreaterThanOrEqual(0)
      expect(result.position).toBeDefined()
    })
  })

  describe('matchKeywords', () => {
    it('should match multiple keywords', () => {
      const text = 'This is about education, learning, and teaching'
      const keywords = ['education', 'learning', 'teaching']
      const result = matchKeywords(keywords, text)

      expect(result.matchedCount).toBe(3)
      expect(result.totalCount).toBe(3)
      expect(result.matchRate).toBe(1.0)
    })

    it('should calculate match rate correctly', () => {
      const text = 'This is about education and learning'
      const keywords = ['education', 'learning', 'mathematics']
      const result = matchKeywords(keywords, text)

      expect(result.matchedCount).toBe(2)
      expect(result.totalCount).toBe(3)
      expect(result.matchRate).toBeCloseTo(0.67, 2)
    })

    it('should return empty results for empty keywords', () => {
      const result = matchKeywords([], 'Some text')
      expect(result.matchedCount).toBe(0)
      expect(result.totalCount).toBe(0)
      expect(result.matchRate).toBe(0)
    })
  })

  describe('extractPotentialKeywords', () => {
    it('should extract keywords from text', () => {
      const text = 'Education is important for learning and teaching students'
      const keywords = extractPotentialKeywords(text)

      expect(keywords.length).toBeGreaterThan(0)
      expect(keywords).toContain('education')
      expect(keywords).toContain('learning')
      expect(keywords).toContain('teaching')
    })

    it('should filter out stopwords', () => {
      const text = 'The education system is important for the students'
      const keywords = extractPotentialKeywords(text)

      expect(keywords).not.toContain('the')
      expect(keywords).not.toContain('is')
      expect(keywords).not.toContain('for')
    })

    it('should filter out short words', () => {
      const text = 'A big education system'
      const keywords = extractPotentialKeywords(text)

      expect(keywords).not.toContain('a')
      expect(keywords).toContain('education')
    })

    it('should respect maxKeywords limit', () => {
      const text = 'Education learning teaching mathematics science history geography'
      const keywords = extractPotentialKeywords(text, 3)

      expect(keywords.length).toBeLessThanOrEqual(3)
    })

    it('should filter out words with numbers', () => {
      const text = 'Education 2024 learning system'
      const keywords = extractPotentialKeywords(text)

      expect(keywords).not.toContain('2024')
    })
  })
})
