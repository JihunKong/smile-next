/**
 * User Feature Types Tests
 *
 * Verify that types can be imported and used correctly.
 */

import { describe, it, expect } from 'vitest'
import type {
  UserProfile,
  UserPreferences,
  UserStats,
  LevelTier,
  LevelInfo,
  Badge,
  EarnedBadge,
  TimelineEvent,
  SettingsTabId,
  ProfileTabId,
  FormMessage,
} from '@/features/user'

describe('User Feature Types', () => {
  describe('UserProfile', () => {
    it('should allow valid user profile structure', () => {
      const profile: UserProfile = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        avatarUrl: null,
      }
      expect(profile.email).toBe('john@example.com')
    })

    it('should allow null values for optional fields', () => {
      const profile: UserProfile = {
        firstName: null,
        lastName: null,
        username: null,
        email: 'user@example.com',
      }
      expect(profile.firstName).toBeNull()
    })
  })

  describe('UserPreferences', () => {
    it('should allow valid preferences structure', () => {
      const prefs: UserPreferences = {
        theme: 'light',
        language: 'en',
        emailDigest: true,
        emailFrequency: 'daily',
        showOnlineStatus: true,
        showActivityStatus: true,
        fontSize: 'medium',
        reduceMotion: false,
      }
      expect(prefs.theme).toBe('light')
    })

    it('should allow additional settings', () => {
      const prefs: UserPreferences = {
        theme: 'dark',
        language: 'ko',
        emailDigest: false,
        emailFrequency: 'weekly',
        showOnlineStatus: false,
        showActivityStatus: false,
        fontSize: 'large',
        reduceMotion: true,
        additionalSettings: {
          groupUpdates: true,
          activityReminders: true,
          itemsPerPage: 25,
        },
      }
      expect(prefs.additionalSettings?.itemsPerPage).toBe(25)
    })
  })

  describe('UserStats', () => {
    it('should allow valid stats structure', () => {
      const stats: UserStats = {
        totalQuestions: 10,
        totalActivities: 5,
        totalGroups: 3,
        totalPoints: 150,
        memberSince: '2024-01-01',
      }
      expect(stats.totalPoints).toBe(150)
    })

    it('should allow levelInfo with tier data', () => {
      const stats: UserStats = {
        totalQuestions: 10,
        totalActivities: 5,
        totalGroups: 3,
        totalPoints: 150,
        levelInfo: {
          current: {
            tier: {
              name: 'SMILE Explorer',
              icon: '🌟',
            },
          },
        },
      }
      expect(stats.levelInfo?.current?.tier.name).toBe('SMILE Explorer')
    })
  })

  describe('LevelTier', () => {
    it('should allow valid level tier structure', () => {
      const tier: LevelTier = {
        name: 'SMILE Starter',
        icon: '✨',
        minPoints: 0,
        maxPoints: 99,
        color: '#3B82F6',
        description: 'Beginning your SMILE journey',
      }
      expect(tier.name).toBe('SMILE Starter')
    })

    it('should allow null maxPoints for top tier', () => {
      const tier: LevelTier = {
        name: 'SMILE Legend',
        icon: '👑',
        minPoints: 10000,
        maxPoints: null,
        color: '#F59E0B',
        description: 'The ultimate achiever',
      }
      expect(tier.maxPoints).toBeNull()
    })
  })

  describe('Badge', () => {
    it('should allow valid badge structure', () => {
      const badge: Badge = {
        id: 'first-question',
        name: 'First Question',
        description: 'Asked your first question',
        icon: '❓',
        level: 'bronze',
        points: 10,
        category: 'Questions',
      }
      expect(badge.level).toBe('bronze')
    })
  })

  describe('EarnedBadge', () => {
    it('should allow valid earned badge structure', () => {
      const earned: EarnedBadge = {
        id: 'earned-1',
        badge: {
          id: 'first-question',
          name: 'First Question',
          description: 'Asked your first question',
          icon: '❓',
          level: 'bronze',
          points: 10,
          category: 'Questions',
        },
        earnedAt: new Date('2024-01-15'),
        isFeatured: true,
      }
      expect(earned.isFeatured).toBe(true)
    })
  })

  describe('TimelineEvent', () => {
    it('should allow valid timeline event structure', () => {
      const event: TimelineEvent = {
        id: 'event-1',
        type: 'question',
        title: 'Asked a question',
        description: 'What is TypeScript?',
        timestamp: new Date(),
        icon: '❓',
        color: 'blue',
        metadata: { activityId: '123' },
      }
      expect(event.type).toBe('question')
    })

    it('should allow all event types', () => {
      const types: TimelineEvent['type'][] = [
        'question',
        'response',
        'exam',
        'inquiry',
        'case',
        'badge',
        'group',
        'certificate',
      ]
      expect(types).toHaveLength(8)
    })
  })

  describe('Tab IDs', () => {
    it('should have valid settings tab IDs', () => {
      const tabs: SettingsTabId[] = [
        'account',
        'password',
        'notifications',
        'privacy',
        'display',
        'danger',
      ]
      expect(tabs).toHaveLength(6)
    })

    it('should have valid profile tab IDs', () => {
      const tabs: ProfileTabId[] = [
        'smile-score',
        'inquiry-journey',
        'career-directions',
        'strength-summary',
        'achievements',
        'stats',
        'activity',
        'settings',
      ]
      expect(tabs).toHaveLength(8)
    })
  })

  describe('FormMessage', () => {
    it('should allow success message', () => {
      const msg: FormMessage = { type: 'success', text: 'Saved!' }
      expect(msg.type).toBe('success')
    })

    it('should allow error message', () => {
      const msg: FormMessage = { type: 'error', text: 'Failed!' }
      expect(msg.type).toBe('error')
    })
  })
})
