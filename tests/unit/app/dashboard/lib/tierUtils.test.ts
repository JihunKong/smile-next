import { describe, it, expect } from 'vitest'
import { getTierInfo, TIERS_ARRAY } from '@/app/(dashboard)/dashboard/lib/tierUtils'

describe('TIERS_ARRAY', () => {
  it('has 6 tiers', () => {
    expect(TIERS_ARRAY).toHaveLength(6)
  })

  it('tiers are ordered by minPoints', () => {
    for (let i = 1; i < TIERS_ARRAY.length; i++) {
      expect(TIERS_ARRAY[i].minPoints).toBeGreaterThan(TIERS_ARRAY[i - 1].minPoints)
    }
  })

  it('each tier has required properties', () => {
    for (const tier of TIERS_ARRAY) {
      expect(tier).toHaveProperty('name')
      expect(tier).toHaveProperty('minPoints')
      expect(tier).toHaveProperty('maxPoints')
      expect(tier).toHaveProperty('color')
      expect(tier).toHaveProperty('icon')
      expect(tier).toHaveProperty('description')
    }
  })

  it('first tier starts at 0 points', () => {
    expect(TIERS_ARRAY[0].minPoints).toBe(0)
    expect(TIERS_ARRAY[0].name).toBe('SMILE Starter')
  })

  it('last tier is SMILE Master', () => {
    const lastTier = TIERS_ARRAY[TIERS_ARRAY.length - 1]
    expect(lastTier.name).toBe('SMILE Master')
    expect(lastTier.minPoints).toBe(100000)
  })
})

describe('getTierInfo', () => {
  describe('tier assignment boundaries', () => {
    it('returns SMILE Starter for 0 points', () => {
      const result = getTierInfo(0)
      expect(result.current.tier.name).toBe('SMILE Starter')
      expect(result.is_max_tier).toBe(false)
    })

    it('returns SMILE Starter for 4999 points (upper boundary)', () => {
      const result = getTierInfo(4999)
      expect(result.current.tier.name).toBe('SMILE Starter')
    })

    it('returns SMILE Learner for 5000 points (boundary)', () => {
      const result = getTierInfo(5000)
      expect(result.current.tier.name).toBe('SMILE Learner')
    })

    it('returns SMILE Learner for 9999 points (upper boundary)', () => {
      const result = getTierInfo(9999)
      expect(result.current.tier.name).toBe('SMILE Learner')
    })

    it('returns SMILE Apprentice for 10000 points', () => {
      const result = getTierInfo(10000)
      expect(result.current.tier.name).toBe('SMILE Apprentice')
    })

    it('returns SMILE Maker for 25000 points', () => {
      const result = getTierInfo(25000)
      expect(result.current.tier.name).toBe('SMILE Maker')
    })

    it('returns SMILE Trainer for 50000 points', () => {
      const result = getTierInfo(50000)
      expect(result.current.tier.name).toBe('SMILE Trainer')
    })

    it('returns SMILE Master for 100000 points', () => {
      const result = getTierInfo(100000)
      expect(result.current.tier.name).toBe('SMILE Master')
      expect(result.is_max_tier).toBe(true)
    })

    it('returns SMILE Master for very high points', () => {
      const result = getTierInfo(500000)
      expect(result.current.tier.name).toBe('SMILE Master')
      expect(result.is_max_tier).toBe(true)
    })
  })

  describe('is_max_tier', () => {
    it('is false for all tiers except SMILE Master', () => {
      expect(getTierInfo(0).is_max_tier).toBe(false)
      expect(getTierInfo(5000).is_max_tier).toBe(false)
      expect(getTierInfo(10000).is_max_tier).toBe(false)
      expect(getTierInfo(25000).is_max_tier).toBe(false)
      expect(getTierInfo(50000).is_max_tier).toBe(false)
    })

    it('is true for SMILE Master', () => {
      expect(getTierInfo(100000).is_max_tier).toBe(true)
      expect(getTierInfo(200000).is_max_tier).toBe(true)
    })
  })

  describe('points_to_next calculation', () => {
    it('calculates points_to_next correctly at 0 points', () => {
      const result = getTierInfo(0)
      expect(result.points_to_next).toBe(5000) // Next tier at 5000
    })

    it('calculates points_to_next correctly at 4000 points', () => {
      const result = getTierInfo(4000)
      expect(result.points_to_next).toBe(1000) // 5000 - 4000
    })

    it('calculates points_to_next correctly at tier boundary', () => {
      const result = getTierInfo(5000)
      expect(result.points_to_next).toBe(5000) // Next tier at 10000, so 10000 - 5000
    })

    it('returns 0 points_to_next for max tier', () => {
      const result = getTierInfo(100000)
      expect(result.points_to_next).toBe(0)
    })

    it('returns 0 points_to_next for max tier with extra points', () => {
      const result = getTierInfo(150000)
      expect(result.points_to_next).toBe(0)
    })
  })

  describe('progress percentage calculation', () => {
    it('calculates 0% progress at tier start', () => {
      const result = getTierInfo(0)
      expect(result.current.progress_percentage).toBeCloseTo(0, 1)
    })

    it('calculates 50% progress at midpoint of SMILE Starter (0-4999)', () => {
      // SMILE Starter: 0-4999, next tier at 5000
      // 50% of 5000 = 2500
      const result = getTierInfo(2500)
      expect(result.current.progress_percentage).toBeCloseTo(50, 0)
    })

    it('calculates progress correctly near tier boundary', () => {
      // 4900 points: (4900 - 0) / (5000 - 0) * 100 = 98%
      const result = getTierInfo(4900)
      expect(result.current.progress_percentage).toBeCloseTo(98, 0)
    })

    it('calculates 0% progress at start of new tier', () => {
      // Just crossed into SMILE Learner at 5000
      // Progress: (5000 - 5000) / (10000 - 5000) * 100 = 0%
      const result = getTierInfo(5000)
      expect(result.current.progress_percentage).toBeCloseTo(0, 1)
    })

    it('calculates progress correctly in middle tier', () => {
      // SMILE Learner: 5000-9999, next tier at 10000
      // 7500 points: (7500 - 5000) / (10000 - 5000) * 100 = 50%
      const result = getTierInfo(7500)
      expect(result.current.progress_percentage).toBeCloseTo(50, 0)
    })

    it('returns 100% progress for max tier', () => {
      const result = getTierInfo(100000)
      expect(result.current.progress_percentage).toBe(100)
    })

    it('returns 100% progress for max tier with extra points', () => {
      const result = getTierInfo(200000)
      expect(result.current.progress_percentage).toBe(100)
    })
  })

  describe('return value structure', () => {
    it('returns correct structure', () => {
      const result = getTierInfo(5000)

      expect(result).toHaveProperty('current')
      expect(result).toHaveProperty('points_to_next')
      expect(result).toHaveProperty('is_max_tier')

      expect(result.current).toHaveProperty('tier')
      expect(result.current).toHaveProperty('progress_percentage')

      expect(result.current.tier).toHaveProperty('name')
      expect(result.current.tier).toHaveProperty('minPoints')
      expect(result.current.tier).toHaveProperty('maxPoints')
      expect(result.current.tier).toHaveProperty('color')
      expect(result.current.tier).toHaveProperty('icon')
      expect(result.current.tier).toHaveProperty('description')
    })

    it('tier has correct colors format (hex)', () => {
      const result = getTierInfo(0)
      expect(result.current.tier.color).toMatch(/^#[0-9A-Fa-f]{6}$/)
    })
  })
})
