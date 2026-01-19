/**
 * Questions Seeder
 *
 * Creates questions for activities:
 * - MCQ questions for exams
 * - Open questions for discussions
 */

import { PrismaClientType, SeededUsers, SeededActivities, SeededQuestions } from './types'

// CS Exam Questions
const CS_EXAM_QUESTIONS = [
  {
    id: 'exam-q1',
    content: 'What is the time complexity of accessing an element in an array by index?',
    choices: ['O(1)', 'O(n)', 'O(log n)', 'O(n²)'],
    correctAnswers: ['0'],
  },
  {
    id: 'exam-q2',
    content: 'Which data structure uses LIFO (Last In, First Out) principle?',
    choices: ['Queue', 'Stack', 'Linked List', 'Tree'],
    correctAnswers: ['1'],
  },
  {
    id: 'exam-q3',
    content: 'What is the worst-case time complexity of binary search?',
    choices: ['O(1)', 'O(n)', 'O(log n)', 'O(n log n)'],
    correctAnswers: ['2'],
  },
  {
    id: 'exam-q4',
    content: 'Which traversal visits the root node first in a binary tree?',
    choices: ['Inorder', 'Preorder', 'Postorder', 'Level order'],
    correctAnswers: ['1'],
  },
  {
    id: 'exam-q5',
    content: 'What is the space complexity of a recursive Fibonacci implementation without memoization?',
    choices: ['O(1)', 'O(n)', 'O(log n)', 'O(2ⁿ)'],
    correctAnswers: ['1'],
  },
]

// Math Exam Questions
const MATH_EXAM_QUESTIONS = [
  {
    id: 'math-exam-q1',
    content: 'What is the derivative of f(x) = x³ + 2x² - 5x + 3?',
    choices: ['3x² + 4x - 5', '3x² + 2x - 5', 'x² + 4x - 5', '3x² + 4x + 3'],
    correctAnswers: ['0'],
  },
  {
    id: 'math-exam-q2',
    content: 'Evaluate the limit: lim(x→0) sin(x)/x',
    choices: ['0', '1', '∞', 'Does not exist'],
    correctAnswers: ['1'],
  },
  {
    id: 'math-exam-q3',
    content: 'What is ∫ 2x dx?',
    choices: ['x²', 'x² + C', '2x² + C', 'x + C'],
    correctAnswers: ['1'],
  },
  {
    id: 'math-exam-q4',
    content: 'The second derivative test: if f\'\'(c) > 0, then f(c) is a:',
    choices: ['Local maximum', 'Local minimum', 'Inflection point', 'Saddle point'],
    correctAnswers: ['1'],
  },
  {
    id: 'math-exam-q5',
    content: 'What is the integral of e^x?',
    choices: ['e^x', 'e^x + C', 'xe^x + C', 'e^(x+1) + C'],
    correctAnswers: ['1'],
  },
  {
    id: 'math-exam-q6',
    content: 'The chain rule states that d/dx[f(g(x))] = ',
    choices: ['f\'(x) · g\'(x)', 'f\'(g(x)) · g\'(x)', 'f(g\'(x))', 'f\'(g\'(x))'],
    correctAnswers: ['1'],
  },
  {
    id: 'math-exam-q7',
    content: 'What is the derivative of ln(x)?',
    choices: ['1/x', 'x', 'e^x', '1/ln(x)'],
    correctAnswers: ['0'],
  },
  {
    id: 'math-exam-q8',
    content: 'L\'Hôpital\'s rule applies when a limit has the form:',
    choices: ['0/0 or ∞/∞', '0/∞', '∞/0', '0·∞'],
    correctAnswers: ['0'],
  },
]

export async function seedQuestions(
  prisma: PrismaClientType,
  users: SeededUsers,
  activities: SeededActivities
): Promise<SeededQuestions> {
  console.log('\n📦 Seeding Questions...')

  const { teachers, activeStudents, moderateStudents } = users

  // === CS Exam Questions ===
  for (const q of CS_EXAM_QUESTIONS) {
    await prisma.question.upsert({
      where: { id: q.id },
      update: {},
      create: {
        id: q.id,
        creatorId: teachers.teacher1.id,
        activityId: activities.examActivity.id,
        content: q.content,
        choices: q.choices,
        correctAnswers: q.correctAnswers,
        questionType: 'multiple_choice',
      },
    })
  }
  await prisma.activity.update({
    where: { id: activities.examActivity.id },
    data: { numberOfQuestions: CS_EXAM_QUESTIONS.length },
  })
  console.log('  ✓ Created 5 CS exam questions')

  // === Math Exam Questions ===
  for (const q of MATH_EXAM_QUESTIONS) {
    await prisma.question.upsert({
      where: { id: q.id },
      update: {},
      create: {
        id: q.id,
        creatorId: teachers.teacher3.id,
        activityId: activities.mathExamActivity.id,
        content: q.content,
        choices: q.choices,
        correctAnswers: q.correctAnswers,
        questionType: 'multiple_choice',
      },
    })
  }
  await prisma.activity.update({
    where: { id: activities.mathExamActivity.id },
    data: { numberOfQuestions: MATH_EXAM_QUESTIONS.length },
  })
  console.log('  ✓ Created 8 Math exam questions')

  // === CS Open Questions ===
  const csOpenQuestions = [
    { id: 'open-q1', creatorId: activeStudents[0].user.id, content: 'What is the difference between compiled and interpreted programming languages?' },
    { id: 'open-q2', creatorId: activeStudents[1].user.id, content: 'How do you decide between using recursion vs iteration for solving a problem?' },
    { id: 'open-q3', creatorId: activeStudents[2].user.id, content: 'What are the trade-offs between using ArrayList vs LinkedList in Java?' },
    { id: 'open-q4', creatorId: moderateStudents[0].user.id, content: 'Can someone explain Big O notation with a simple example?' },
  ]

  for (const q of csOpenQuestions) {
    await prisma.question.upsert({
      where: { id: q.id },
      update: {},
      create: {
        id: q.id,
        creatorId: q.creatorId,
        activityId: activities.openActivity.id,
        content: q.content,
        questionType: 'open',
      },
    })
  }
  await prisma.activity.update({
    where: { id: activities.openActivity.id },
    data: { numberOfQuestions: csOpenQuestions.length },
  })
  console.log('  ✓ Created 4 CS open questions')

  // === English Open Questions ===
  const englishOpenQuestions = [
    { id: 'english-open-q1', creatorId: activeStudents[0].user.id, content: 'How does the green light in The Great Gatsby symbolize the American Dream?' },
    { id: 'english-open-q2', creatorId: activeStudents[1].user.id, content: 'What makes an unreliable narrator effective in storytelling?' },
    { id: 'english-open-q3', creatorId: activeStudents[3].user.id, content: 'Compare the use of stream of consciousness in Woolf and Joyce.' },
  ]

  for (const q of englishOpenQuestions) {
    await prisma.question.upsert({
      where: { id: q.id },
      update: {},
      create: {
        id: q.id,
        creatorId: q.creatorId,
        activityId: activities.englishOpenActivity.id,
        content: q.content,
        questionType: 'open',
      },
    })
  }
  await prisma.activity.update({
    where: { id: activities.englishOpenActivity.id },
    data: { numberOfQuestions: englishOpenQuestions.length },
  })
  console.log('  ✓ Created 3 English open questions')

  return {
    csExamQuestionIds: CS_EXAM_QUESTIONS.map((q) => q.id),
    mathExamQuestionIds: MATH_EXAM_QUESTIONS.map((q) => q.id),
    csOpenQuestionIds: csOpenQuestions.map((q) => q.id),
    englishOpenQuestionIds: englishOpenQuestions.map((q) => q.id),
  }
}
