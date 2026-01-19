/**
 * Attempts Seeder
 *
 * Creates attempt records:
 * - Exam attempts (passed, failed, in-progress)
 * - Inquiry attempts
 * - Case attempts
 * - Leaderboard entries
 */

import { PrismaClientType, SeededUsers, SeededActivities, SeededQuestions } from './types'
import { daysAgo, minutesAgo } from './utils'

export async function seedAttempts(
  prisma: PrismaClientType,
  users: SeededUsers,
  activities: SeededActivities,
  questions: SeededQuestions
): Promise<void> {
  console.log('\n📦 Seeding Attempts...')

  const { activeStudents, moderateStudents } = users
  const { examActivity, inquiryActivity, caseActivity, mathExamActivity, physicsInquiryActivity, researchCaseActivity } =
    activities
  const { csExamQuestionIds, mathExamQuestionIds } = questions

  // === Emma (Active Student 1): Top performer ===
  await prisma.examAttempt.upsert({
    where: { id: 'emma-exam-attempt-1' },
    update: {},
    create: {
      id: 'emma-exam-attempt-1',
      userId: activeStudents[0].user.id,
      activityId: examActivity.id,
      startedAt: daysAgo(7),
      completedAt: daysAgo(7),
      timeSpentSeconds: 1200,
      totalQuestions: 5,
      correctAnswers: 5,
      score: 100,
      passed: true,
      status: 'completed',
      questionOrder: csExamQuestionIds,
    },
  })

  await prisma.inquiryAttempt.upsert({
    where: { id: 'emma-inquiry-attempt-1' },
    update: {},
    create: {
      id: 'emma-inquiry-attempt-1',
      userId: activeStudents[0].user.id,
      activityId: inquiryActivity.id,
      startedAt: daysAgo(5),
      completedAt: daysAgo(5),
      questionsGenerated: 5,
      questionsRequired: 5,
      status: 'completed',
    },
  })

  await prisma.caseAttempt.upsert({
    where: { id: 'emma-case-attempt-1' },
    update: {},
    create: {
      id: 'emma-case-attempt-1',
      userId: activeStudents[0].user.id,
      activityId: caseActivity.id,
      startedAt: daysAgo(3),
      completedAt: daysAgo(3),
      timeSpentSeconds: 2400,
      responses: {
        'scenario-1': {
          issues: 'User trust, legal liability, data breach consequences, ethical responsibility.',
          solution: 'Immediately disclose, delay launch, work with security researchers, implement patches.',
        },
        'scenario-2': {
          issues: 'Short-term profits vs long-term reputation, environmental responsibility.',
          solution: 'Invest in cleaner technology, phase out polluting methods gradually.',
        },
      },
      totalScore: 8.5,
      scenarioScores: {
        'scenario-1': { issuesScore: 9, solutionScore: 8.5, feedback: 'Excellent comprehensive analysis.' },
        'scenario-2': { issuesScore: 8, solutionScore: 8.5, feedback: 'Strong strategic thinking.' },
      },
      passed: true,
      status: 'completed',
    },
  })

  await prisma.examAttempt.upsert({
    where: { id: 'emma-math-exam-attempt-1' },
    update: {},
    create: {
      id: 'emma-math-exam-attempt-1',
      userId: activeStudents[0].user.id,
      activityId: mathExamActivity.id,
      startedAt: daysAgo(2),
      completedAt: daysAgo(2),
      timeSpentSeconds: 2100,
      totalQuestions: 8,
      correctAnswers: 7,
      score: 87.5,
      passed: true,
      status: 'completed',
      questionOrder: mathExamQuestionIds,
    },
  })

  await prisma.caseAttempt.upsert({
    where: { id: 'emma-research-case-attempt-1' },
    update: {},
    create: {
      id: 'emma-research-case-attempt-1',
      userId: activeStudents[0].user.id,
      activityId: researchCaseActivity.id,
      startedAt: daysAgo(1),
      completedAt: daysAgo(1),
      timeSpentSeconds: 3600,
      responses: {
        'ethics-scenario-1': {
          issues: 'Professional integrity, institutional reputation, impact on cited research.',
          solution: 'Document evidence, consult integrity office, follow official channels.',
        },
        'ethics-scenario-2': {
          issues: 'Power imbalance, language barriers, understanding consent.',
          solution: 'Use cultural liaisons, develop simplified consent, establish advisory boards.',
        },
      },
      totalScore: 8.0,
      scenarioScores: {
        'ethics-scenario-1': { issuesScore: 8, solutionScore: 8, feedback: 'Thoughtful consideration.' },
        'ethics-scenario-2': { issuesScore: 8, solutionScore: 8, feedback: 'Good understanding.' },
      },
      passed: true,
      status: 'completed',
    },
  })

  console.log('  ✓ Created attempts for Emma (active student 1)')

  // === Liam (Active Student 2): Good performer ===
  await prisma.examAttempt.upsert({
    where: { id: 'liam-exam-attempt-1' },
    update: {},
    create: {
      id: 'liam-exam-attempt-1',
      userId: activeStudents[1].user.id,
      activityId: examActivity.id,
      startedAt: daysAgo(6),
      completedAt: daysAgo(6),
      timeSpentSeconds: 1500,
      totalQuestions: 5,
      correctAnswers: 4,
      score: 80,
      passed: true,
      status: 'completed',
      questionOrder: csExamQuestionIds,
    },
  })

  await prisma.inquiryAttempt.upsert({
    where: { id: 'liam-inquiry-attempt-1' },
    update: {},
    create: {
      id: 'liam-inquiry-attempt-1',
      userId: activeStudents[1].user.id,
      activityId: physicsInquiryActivity.id,
      startedAt: daysAgo(4),
      completedAt: daysAgo(4),
      questionsGenerated: 5,
      questionsRequired: 5,
      status: 'completed',
    },
  })

  console.log('  ✓ Created attempts for Liam (active student 2)')

  // === Sophia (Active Student 3): Retry behavior ===
  await prisma.examAttempt.upsert({
    where: { id: 'sophia-exam-attempt-1' },
    update: {},
    create: {
      id: 'sophia-exam-attempt-1',
      userId: activeStudents[2].user.id,
      activityId: examActivity.id,
      startedAt: daysAgo(10),
      completedAt: daysAgo(10),
      timeSpentSeconds: 900,
      totalQuestions: 5,
      correctAnswers: 2,
      score: 40,
      passed: false,
      status: 'completed',
      questionOrder: csExamQuestionIds,
    },
  })

  await prisma.examAttempt.upsert({
    where: { id: 'sophia-exam-attempt-2' },
    update: {},
    create: {
      id: 'sophia-exam-attempt-2',
      userId: activeStudents[2].user.id,
      activityId: examActivity.id,
      startedAt: daysAgo(8),
      completedAt: daysAgo(8),
      timeSpentSeconds: 1400,
      totalQuestions: 5,
      correctAnswers: 5,
      score: 100,
      passed: true,
      status: 'completed',
      questionOrder: csExamQuestionIds,
    },
  })

  console.log('  ✓ Created attempts for Sophia (shows retry behavior)')

  // === Ethan (Moderate Student 1): Mixed results ===
  await prisma.examAttempt.upsert({
    where: { id: 'ethan-exam-attempt-1' },
    update: {},
    create: {
      id: 'ethan-exam-attempt-1',
      userId: moderateStudents[0].user.id,
      activityId: examActivity.id,
      startedAt: daysAgo(5),
      completedAt: daysAgo(5),
      timeSpentSeconds: 1800,
      totalQuestions: 5,
      correctAnswers: 3,
      score: 60,
      passed: true,
      status: 'completed',
      questionOrder: csExamQuestionIds,
    },
  })

  await prisma.caseAttempt.upsert({
    where: { id: 'ethan-case-attempt-1' },
    update: {},
    create: {
      id: 'ethan-case-attempt-1',
      userId: moderateStudents[0].user.id,
      activityId: caseActivity.id,
      startedAt: daysAgo(4),
      completedAt: daysAgo(4),
      timeSpentSeconds: 1200,
      responses: {
        'scenario-1': { issues: 'Data could be exposed.', solution: 'Fix the bug.' },
        'scenario-2': { issues: 'Pollution is a concern.', solution: 'Use cleaner methods.' },
      },
      totalScore: 4.0,
      scenarioScores: {
        'scenario-1': { issuesScore: 4, solutionScore: 4, feedback: 'Needs more depth.' },
        'scenario-2': { issuesScore: 4, solutionScore: 4, feedback: 'Response too brief.' },
      },
      passed: false,
      status: 'completed',
    },
  })

  console.log('  ✓ Created attempts for Ethan (moderate student 1)')

  // === Ava (Moderate Student 2): In-progress ===
  await prisma.examAttempt.upsert({
    where: { id: 'ava-exam-attempt-1' },
    update: {},
    create: {
      id: 'ava-exam-attempt-1',
      userId: moderateStudents[1].user.id,
      activityId: examActivity.id,
      startedAt: minutesAgo(15),
      totalQuestions: 5,
      correctAnswers: 0,
      status: 'in_progress',
      questionOrder: csExamQuestionIds,
    },
  })

  console.log('  ✓ Created in-progress attempt for Ava')

  // === Mason (Moderate Student 3): Abandoned ===
  await prisma.inquiryAttempt.upsert({
    where: { id: 'mason-inquiry-attempt-1' },
    update: {},
    create: {
      id: 'mason-inquiry-attempt-1',
      userId: moderateStudents[2].user.id,
      activityId: physicsInquiryActivity.id,
      startedAt: daysAgo(7),
      questionsGenerated: 2,
      questionsRequired: 5,
      status: 'in_progress',
    },
  })

  console.log('  ✓ Created abandoned attempt for Mason')

  // === Leaderboard ===
  const leaderboardEntries = [
    { activityId: examActivity.id, userId: activeStudents[0].user.id, totalScore: 100, rank: 1 },
    { activityId: examActivity.id, userId: activeStudents[2].user.id, totalScore: 100, rank: 1 },
    { activityId: examActivity.id, userId: activeStudents[1].user.id, totalScore: 80, rank: 3 },
    { activityId: examActivity.id, userId: moderateStudents[0].user.id, totalScore: 60, rank: 4 },
    { activityId: mathExamActivity.id, userId: activeStudents[0].user.id, totalScore: 87.5, rank: 1 },
  ]

  for (const entry of leaderboardEntries) {
    await prisma.leaderboard.upsert({
      where: { activityId_userId: { activityId: entry.activityId, userId: entry.userId } },
      update: {},
      create: {
        activityId: entry.activityId,
        userId: entry.userId,
        totalScore: entry.totalScore,
        totalQuestions: 5,
        totalResponses: 5,
        averageScore: entry.totalScore,
        rank: entry.rank,
      },
    })
  }

  console.log('  ✓ Created leaderboard entries')
}
