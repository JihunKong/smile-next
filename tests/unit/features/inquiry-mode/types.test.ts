/**
 * Tests for Inquiry Mode Types
 */

import {
  BLOOMS_LEVELS,
  BLOOMS_LEVEL_VALUES,
  getScoreQuality,
  type BloomsLevel,
  type EvaluationStatus,
  type SubmittedQuestion,
  type EvaluationData,
  type LeaderboardEntry,
  type InquiryStats,
  type UserSummary,
  type DimensionScores,
  type ScoreQuality,
} from '@/features/inquiry-mode/types'

describe('Inquiry Mode Types', () => {
  describe('BLOOMS_LEVELS', () => {
    it('should contain all 6 Bloom\'s taxonomy levels', () => {
      expect(BLOOMS_LEVELS).toHaveLength(6)
      expect(BLOOMS_LEVELS).toEqual([
        'remember',
        'understand',
        'apply',
        'analyze',
        'evaluate',
        'create',
      ])
    })

    it('should be ordered from lowest to highest cognitive level', () => {
      expect(BLOOMS_LEVELS[0]).toBe('remember')
      expect(BLOOMS_LEVELS[5]).toBe('create')
    })
  })

  describe('BLOOMS_LEVEL_VALUES', () => {
    it('should map all levels to numeric values 1-6', () => {
      expect(BLOOMS_LEVEL_VALUES.remember).toBe(1)
      expect(BLOOMS_LEVEL_VALUES.understand).toBe(2)
      expect(BLOOMS_LEVEL_VALUES.apply).toBe(3)
      expect(BLOOMS_LEVEL_VALUES.analyze).toBe(4)
      expect(BLOOMS_LEVEL_VALUES.evaluate).toBe(5)
      expect(BLOOMS_LEVEL_VALUES.create).toBe(6)
    })

    it('should have values for all defined levels', () => {
      BLOOMS_LEVELS.forEach((level) => {
        expect(BLOOMS_LEVEL_VALUES[level]).toBeDefined()
        expect(typeof BLOOMS_LEVEL_VALUES[level]).toBe('number')
      })
    })
  })

  describe('getScoreQuality', () => {
    it('should return "excellent" for scores >= 8', () => {
      expect(getScoreQuality(8)).toBe('excellent')
      expect(getScoreQuality(9)).toBe('excellent')
      expect(getScoreQuality(10)).toBe('excellent')
    })

    it('should return "good" for scores >= 6 and < 8', () => {
      expect(getScoreQuality(6)).toBe('good')
      expect(getScoreQuality(7)).toBe('good')
      expect(getScoreQuality(7.9)).toBe('good')
    })

    it('should return "needs_improvement" for scores < 6', () => {
      expect(getScoreQuality(0)).toBe('needs_improvement')
      expect(getScoreQuality(5)).toBe('needs_improvement')
      expect(getScoreQuality(5.9)).toBe('needs_improvement')
    })
  })

  describe('Type Structures', () => {
    it('should allow creating a valid SubmittedQuestion', () => {
      const question: SubmittedQuestion = {
        id: 'q-1',
        content: 'What is photosynthesis?',
        score: 8.5,
        bloomsLevel: 'understand',
        feedback: 'Good question!',
        evaluationStatus: 'completed',
      }

      expect(question.id).toBe('q-1')
      expect(question.score).toBe(8.5)
      expect(question.bloomsLevel).toBe('understand')
    })

    it('should allow null values for optional SubmittedQuestion fields', () => {
      const question: SubmittedQuestion = {
        id: 'q-2',
        content: 'Pending question',
        score: null,
        bloomsLevel: null,
        feedback: null,
        evaluationStatus: 'pending',
      }

      expect(question.score).toBeNull()
      expect(question.bloomsLevel).toBeNull()
    })

    it('should allow creating a valid EvaluationData', () => {
      const evaluation: EvaluationData = {
        overallScore: 8.0,
        creativityScore: 7.5,
        clarityScore: 8.5,
        relevanceScore: 8.0,
        innovationScore: 7.0,
        complexityScore: 8.0,
        bloomsLevel: 'analyze',
        evaluationText: 'Well-crafted question',
        strengths: ['Clear', 'Relevant'],
        improvements: ['Could be more specific'],
        enhancedQuestions: [{ level: 'evaluate', question: 'How would you...' }],
      }

      expect(evaluation.overallScore).toBe(8.0)
      expect(evaluation.strengths).toHaveLength(2)
    })

    it('should allow creating a valid LeaderboardEntry', () => {
      const entry: LeaderboardEntry = {
        rank: 1,
        userId: 'user-1',
        userName: 'John Doe',
        qualityScore: 8.5,
        qualityPercentage: 85,
        passed: true,
        questionsGenerated: 5,
        questionsRequired: 5,
        avgBloomLevel: 4.2,
        timeTaken: '12m 30s',
        attemptNumber: 1,
        submittedAt: new Date(),
        filterType: 'best',
      }

      expect(entry.rank).toBe(1)
      expect(entry.passed).toBe(true)
      expect(entry.filterType).toBe('best')
    })

    it('should allow creating valid InquiryStats', () => {
      const stats: InquiryStats = {
        totalAttempts: 50,
        uniqueStudents: 25,
        averageScore: 72.5,
        passRate: 80,
      }

      expect(stats.totalAttempts).toBe(50)
      expect(stats.passRate).toBe(80)
    })

    it('should allow creating valid UserSummary', () => {
      const summary: UserSummary = {
        bestScore: 85,
        totalAttempts: 3,
        passRate: 66.7,
        rank: 5,
      }

      expect(summary.bestScore).toBe(85)
      expect(summary.rank).toBe(5)
    })

    it('should allow creating valid DimensionScores', () => {
      const scores: DimensionScores = {
        creativity: 7.5,
        clarity: 8.0,
        relevance: 8.5,
        innovation: 7.0,
        complexity: 6.5,
      }

      expect(scores.creativity).toBe(7.5)
      expect(scores.complexity).toBe(6.5)
    })
  })

  describe('EvaluationStatus', () => {
    it('should support all valid status values', () => {
      const statuses: EvaluationStatus[] = ['pending', 'evaluating', 'completed', 'error']

      statuses.forEach((status) => {
        expect(typeof status).toBe('string')
      })
    })
  })

  describe('BloomsLevel', () => {
    it('should support all Bloom\'s taxonomy levels', () => {
      const levels: BloomsLevel[] = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create']

      levels.forEach((level) => {
        expect(BLOOMS_LEVELS.includes(level)).toBe(true)
      })
    })
  })

  describe('ScoreQuality', () => {
    it('should be one of the valid quality types', () => {
      const qualities: ScoreQuality[] = ['excellent', 'good', 'needs_improvement']

      qualities.forEach((quality) => {
        expect(['excellent', 'good', 'needs_improvement']).toContain(quality)
      })
    })
  })
})
