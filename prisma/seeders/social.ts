/**
 * Social Seeder
 *
 * Creates social interaction data:
 * - Likes on questions
 * - Comments and replies
 */

import { PrismaClientType, SeededUsers } from './types'

export async function seedSocial(prisma: PrismaClientType, users: SeededUsers): Promise<void> {
  console.log('\n📦 Seeding Social Interactions...')

  const { teachers, activeStudents, moderateStudents } = users

  // === Likes ===
  const likePairs = [
    // CS Open Questions
    { userId: activeStudents[1].user.id, questionId: 'open-q1' },
    { userId: activeStudents[2].user.id, questionId: 'open-q1' },
    { userId: activeStudents[3].user.id, questionId: 'open-q1' },
    { userId: activeStudents[0].user.id, questionId: 'open-q2' },
    { userId: activeStudents[2].user.id, questionId: 'open-q2' },
    { userId: moderateStudents[0].user.id, questionId: 'open-q2' },
    { userId: activeStudents[0].user.id, questionId: 'open-q3' },
    { userId: activeStudents[1].user.id, questionId: 'open-q3' },
    { userId: activeStudents[4].user.id, questionId: 'open-q4' },
    { userId: teachers.teacher1.id, questionId: 'open-q1' },
    { userId: teachers.teacher1.id, questionId: 'open-q3' },
    // English Questions
    { userId: activeStudents[1].user.id, questionId: 'english-open-q1' },
    { userId: activeStudents[2].user.id, questionId: 'english-open-q1' },
    { userId: teachers.teacher2.id, questionId: 'english-open-q2' },
    { userId: activeStudents[0].user.id, questionId: 'english-open-q3' },
  ]

  for (const like of likePairs) {
    await prisma.like.upsert({
      where: { userId_questionId: { userId: like.userId, questionId: like.questionId } },
      update: {},
      create: { userId: like.userId, questionId: like.questionId },
    })
  }

  // Update like counts
  await prisma.question.update({ where: { id: 'open-q1' }, data: { numberOfRatings: 4 } })
  await prisma.question.update({ where: { id: 'open-q2' }, data: { numberOfRatings: 3 } })
  await prisma.question.update({ where: { id: 'open-q3' }, data: { numberOfRatings: 2 } })
  await prisma.question.update({ where: { id: 'open-q4' }, data: { numberOfRatings: 1 } })
  await prisma.question.update({ where: { id: 'english-open-q1' }, data: { numberOfRatings: 2 } })
  await prisma.question.update({ where: { id: 'english-open-q2' }, data: { numberOfRatings: 1 } })
  await prisma.question.update({ where: { id: 'english-open-q3' }, data: { numberOfRatings: 1 } })

  console.log('  ✓ Created 15 question likes')

  // === Comments ===
  const comments = [
    {
      id: 'comment-1',
      content: 'Great question! Compiled languages are generally faster but less portable.',
      creatorId: activeStudents[1].user.id,
      questionId: 'open-q1',
    },
    {
      id: 'comment-2',
      content: 'Python is interpreted but can be "compiled" to bytecode. The distinction is blurring!',
      creatorId: activeStudents[2].user.id,
      questionId: 'open-q1',
    },
    {
      id: 'comment-3',
      content: 'I typically use recursion when the problem has a natural recursive structure, like tree traversal.',
      creatorId: activeStudents[0].user.id,
      questionId: 'open-q2',
    },
    {
      id: 'comment-4',
      content: 'Watch out for stack overflow with deep recursion though!',
      creatorId: moderateStudents[0].user.id,
      questionId: 'open-q2',
    },
    {
      id: 'comment-5',
      content: 'The green light represents unattainable dreams - always visible but just out of reach.',
      creatorId: activeStudents[1].user.id,
      questionId: 'english-open-q1',
    },
    {
      id: 'comment-6',
      content: 'Excellent analysis! This connects well with the theme of illusion vs reality in the novel.',
      creatorId: teachers.teacher2.id,
      questionId: 'english-open-q1',
    },
  ]

  for (const comment of comments) {
    await prisma.comment.upsert({
      where: { id: comment.id },
      update: {},
      create: {
        id: comment.id,
        content: comment.content,
        creatorId: comment.creatorId,
        questionId: comment.questionId,
      },
    })
  }

  // Nested reply
  await prisma.comment.upsert({
    where: { id: 'comment-reply-1' },
    update: {},
    create: {
      id: 'comment-reply-1',
      content: 'Yes! Tail recursion optimization can help with that in some languages.',
      creatorId: activeStudents[2].user.id,
      questionId: 'open-q2',
      parentId: 'comment-4',
    },
  })

  console.log('  ✓ Created 7 comments')
}
