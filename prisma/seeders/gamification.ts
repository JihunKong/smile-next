/**
 * Gamification Seeder
 *
 * Creates gamification data:
 * - User Preferences (themes, languages)
 * - User Streaks
 * - User Levels & Points
 * - Badges Earned
 */

import { User } from '@prisma/client'
import { PrismaClientType, SeededUsers } from './types'
import { daysAgo } from './utils'

const TIER_NAMES = ['CURIOUS_STARTER', 'QUESTION_EXPLORER', 'INSIGHT_SEEKER', 'KNOWLEDGE_BUILDER', 'BLOOM_MASTER']

const BADGE_TYPES = [
  { id: 'first_question', name: 'First Question', icon: '❓', type: 'milestone' },
  { id: 'week_warrior', name: 'Week Warrior', icon: '🔥', type: 'streak' },
  { id: 'perfect_score', name: 'Perfect Score', icon: '💯', type: 'achievement' },
  { id: 'helpful_peer', name: 'Helpful Peer', icon: '🤝', type: 'achievement' },
  { id: 'curious_mind', name: 'Curious Mind', icon: '🧠', type: 'milestone' },
  { id: 'month_master', name: 'Month Master', icon: '🏆', type: 'streak' },
  { id: 'early_bird', name: 'Early Bird', icon: '🌅', type: 'achievement' },
  { id: 'night_owl', name: 'Night Owl', icon: '🦉', type: 'achievement' },
]

export async function seedGamification(prisma: PrismaClientType, users: SeededUsers): Promise<void> {
  console.log('\n📦 Seeding Gamification...')

  await seedUserPreferences(prisma, users)
  await seedUserStreaks(prisma, users)
  await seedUserLevels(prisma, users)
  await seedBadges(prisma, users)
}

async function seedUserPreferences(prisma: PrismaClientType, users: SeededUsers): Promise<void> {
  const allUsers: User[] = [
    users.superAdmin,
    users.admin,
    users.teachers.teacher1,
    users.teachers.teacher2,
    users.teachers.teacher3,
    ...users.students.map((s) => s.user),
  ]

  const themes = ['light', 'dark', 'system']
  const languages = ['en', 'ko']

  for (let i = 0; i < allUsers.length; i++) {
    const user = allUsers[i]
    await prisma.userPreference.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        theme: themes[i % 3],
        language: languages[i % 2],
        timezone: 'Asia/Seoul',
        emailDigest: i % 3 !== 0,
        emailFrequency: i % 2 === 0 ? 'daily' : 'weekly',
        showOnlineStatus: i % 4 !== 0,
        showActivityStatus: true,
        fontSize: i % 5 === 0 ? 'large' : 'medium',
        reduceMotion: i % 10 === 0,
      },
    })
  }
  console.log('  ✓ Created user preferences for all users')
}

async function seedUserStreaks(prisma: PrismaClientType, users: SeededUsers): Promise<void> {
  const { activeStudents, moderateStudents } = users

  const streakData = [
    { userId: activeStudents[0].user.id, currentStreak: 15, longestStreak: 30, daysAgoLastActivity: 0 },
    { userId: activeStudents[1].user.id, currentStreak: 7, longestStreak: 14, daysAgoLastActivity: 0 },
    { userId: activeStudents[2].user.id, currentStreak: 21, longestStreak: 21, daysAgoLastActivity: 1 },
    { userId: activeStudents[3].user.id, currentStreak: 5, longestStreak: 10, daysAgoLastActivity: 0 },
    { userId: activeStudents[4].user.id, currentStreak: 3, longestStreak: 7, daysAgoLastActivity: 1 },
    { userId: moderateStudents[0].user.id, currentStreak: 2, longestStreak: 5, daysAgoLastActivity: 2 },
    { userId: moderateStudents[1].user.id, currentStreak: 0, longestStreak: 3, daysAgoLastActivity: 5 },
    { userId: moderateStudents[2].user.id, currentStreak: 1, longestStreak: 4, daysAgoLastActivity: 1 },
  ]

  for (const data of streakData) {
    await prisma.userStreak.upsert({
      where: { userId: data.userId },
      update: {},
      create: {
        userId: data.userId,
        currentStreak: data.currentStreak,
        longestStreak: data.longestStreak,
        lastActivityDate: daysAgo(data.daysAgoLastActivity),
        weeklyActivityDays: Math.min(data.currentStreak, 7),
        monthlyActivityDays: Math.min(data.currentStreak, 30),
      },
    })
  }
  console.log('  ✓ Created user streaks')
}

async function seedUserLevels(prisma: PrismaClientType, users: SeededUsers): Promise<void> {
  const { activeStudents, moderateStudents } = users

  const levelData = [
    { userId: activeStudents[0].user.id, totalPoints: 2500, currentLevel: 12, tier: 3 },
    { userId: activeStudents[1].user.id, totalPoints: 1800, currentLevel: 9, tier: 2 },
    { userId: activeStudents[2].user.id, totalPoints: 3200, currentLevel: 15, tier: 4 },
    { userId: activeStudents[3].user.id, totalPoints: 900, currentLevel: 5, tier: 1 },
    { userId: activeStudents[4].user.id, totalPoints: 600, currentLevel: 4, tier: 1 },
    { userId: moderateStudents[0].user.id, totalPoints: 350, currentLevel: 3, tier: 0 },
    { userId: moderateStudents[1].user.id, totalPoints: 150, currentLevel: 2, tier: 0 },
    { userId: moderateStudents[2].user.id, totalPoints: 250, currentLevel: 2, tier: 0 },
  ]

  for (const data of levelData) {
    await prisma.userLevel.upsert({
      where: { userId: data.userId },
      update: {},
      create: {
        userId: data.userId,
        totalPoints: data.totalPoints,
        currentLevel: data.currentLevel,
        currentTier: TIER_NAMES[data.tier],
        tierProgress: (data.totalPoints % 500) / 500,
        questionPoints: Math.floor(data.totalPoints * 0.4),
        responsePoints: Math.floor(data.totalPoints * 0.3),
        evaluationPoints: Math.floor(data.totalPoints * 0.2),
        streakPoints: Math.floor(data.totalPoints * 0.1),
        questionsCreated: Math.floor(data.totalPoints / 50),
        responsesGiven: Math.floor(data.totalPoints / 30),
        evaluationsReceived: Math.floor(data.totalPoints / 100),
        perfectScores: Math.floor(data.totalPoints / 500),
        lastPointsAt: daysAgo(Math.floor(Math.random() * 5)),
      },
    })
  }
  console.log('  ✓ Created user levels')
}

async function seedBadges(prisma: PrismaClientType, users: SeededUsers): Promise<void> {
  const { activeStudents, moderateStudents } = users

  const badgeAssignments = [
    { userId: activeStudents[0].user.id, badges: [0, 1, 2, 3, 4, 5] },
    { userId: activeStudents[1].user.id, badges: [0, 1, 3, 4] },
    { userId: activeStudents[2].user.id, badges: [0, 1, 2, 4, 5, 6] },
    { userId: activeStudents[3].user.id, badges: [0, 1, 4] },
    { userId: activeStudents[4].user.id, badges: [0, 4, 7] },
    { userId: moderateStudents[0].user.id, badges: [0, 4] },
    { userId: moderateStudents[1].user.id, badges: [0] },
  ]

  for (const assignment of badgeAssignments) {
    for (const badgeIndex of assignment.badges) {
      const badge = BADGE_TYPES[badgeIndex]
      await prisma.badgeEarned.upsert({
        where: { userId_badgeId: { userId: assignment.userId, badgeId: badge.id } },
        update: {},
        create: {
          userId: assignment.userId,
          badgeId: badge.id,
          badgeName: badge.name,
          badgeIcon: badge.icon,
          badgeType: badge.type,
          earnedAt: daysAgo(Math.floor(Math.random() * 30)),
          context: { source: 'seed' },
        },
      })
    }
  }
  console.log('  ✓ Created badges earned')
}
