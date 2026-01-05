import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Test password for all accounts
const TEST_PASSWORD = 'Test1234!'

async function main() {
  console.log('Seeding database...')

  // Hash password
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 12)

  // ============================================================================
  // Create Test Users
  // ============================================================================

  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@smile.test' },
    update: {},
    create: {
      email: 'superadmin@smile.test',
      username: 'superadmin',
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      roleId: 0,
      emailVerified: true,
    },
  })
  console.log('Created superadmin:', superAdmin.email)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@smile.test' },
    update: {},
    create: {
      email: 'admin@smile.test',
      username: 'admin',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      roleId: 1,
      emailVerified: true,
    },
  })
  console.log('Created admin:', admin.email)

  const teacher1 = await prisma.user.upsert({
    where: { email: 'teacher1@smile.test' },
    update: {},
    create: {
      email: 'teacher1@smile.test',
      username: 'teacher1',
      passwordHash,
      firstName: 'John',
      lastName: 'Teacher',
      roleId: 2,
      emailVerified: true,
    },
  })
  console.log('Created teacher1:', teacher1.email)

  const teacher2 = await prisma.user.upsert({
    where: { email: 'teacher2@smile.test' },
    update: {},
    create: {
      email: 'teacher2@smile.test',
      username: 'teacher2',
      passwordHash,
      firstName: 'Jane',
      lastName: 'Instructor',
      roleId: 2,
      emailVerified: true,
    },
  })
  console.log('Created teacher2:', teacher2.email)

  const students: Array<{ email: string; user: typeof superAdmin }> = []
  for (let i = 1; i <= 4; i++) {
    const student = await prisma.user.upsert({
      where: { email: `student${i}@smile.test` },
      update: {},
      create: {
        email: `student${i}@smile.test`,
        username: `student${i}`,
        passwordHash,
        firstName: `Student`,
        lastName: `${i}`,
        roleId: 3,
        emailVerified: true,
      },
    })
    students.push({ email: student.email, user: student })
    console.log(`Created student${i}:`, student.email)
  }

  // ============================================================================
  // Create Groups
  // ============================================================================

  const csGroup = await prisma.group.upsert({
    where: { id: 'cs-intro-group' },
    update: {},
    create: {
      id: 'cs-intro-group',
      creatorId: teacher1.id,
      name: 'Introduction to Computer Science',
      description: 'A beginner-friendly course covering programming fundamentals, algorithms, and data structures.',
      groupType: 'StudentPaced',
      isPrivate: false,
      requirePasscode: false,
    },
  })
  console.log('Created group:', csGroup.name)

  const mathGroup = await prisma.group.upsert({
    where: { id: 'advanced-math-group' },
    update: {},
    create: {
      id: 'advanced-math-group',
      creatorId: teacher1.id,
      name: 'Advanced Mathematics',
      description: 'Advanced topics including calculus, linear algebra, and differential equations.',
      groupType: 'StudentPaced',
      isPrivate: true,
      requirePasscode: true,
      passcode: '1234',
    },
  })
  console.log('Created group:', mathGroup.name)

  const englishGroup = await prisma.group.upsert({
    where: { id: 'english-lit-group' },
    update: {},
    create: {
      id: 'english-lit-group',
      creatorId: teacher2.id,
      name: 'English Literature',
      description: 'Explore classic and contemporary literature through critical analysis and discussion.',
      groupType: 'StudentPaced',
      isPrivate: false,
      requirePasscode: false,
    },
  })
  console.log('Created group:', englishGroup.name)

  // ============================================================================
  // Add Members to Groups
  // ============================================================================

  // Add teacher1 as admin to their groups
  await prisma.groupUser.upsert({
    where: { userId_groupId: { userId: teacher1.id, groupId: csGroup.id } },
    update: {},
    create: { userId: teacher1.id, groupId: csGroup.id, role: 2 }, // 2 = Co-Owner
  })

  await prisma.groupUser.upsert({
    where: { userId_groupId: { userId: teacher1.id, groupId: mathGroup.id } },
    update: {},
    create: { userId: teacher1.id, groupId: mathGroup.id, role: 2 },
  })

  // Add teacher2 as admin to their group
  await prisma.groupUser.upsert({
    where: { userId_groupId: { userId: teacher2.id, groupId: englishGroup.id } },
    update: {},
    create: { userId: teacher2.id, groupId: englishGroup.id, role: 2 },
  })

  // Add all students to CS group
  for (const { user: student } of students) {
    await prisma.groupUser.upsert({
      where: { userId_groupId: { userId: student.id, groupId: csGroup.id } },
      update: {},
      create: { userId: student.id, groupId: csGroup.id, role: 0 }, // 0 = Member
    })
  }

  // Add student1, student2 to math group
  await prisma.groupUser.upsert({
    where: { userId_groupId: { userId: students[0].user.id, groupId: mathGroup.id } },
    update: {},
    create: { userId: students[0].user.id, groupId: mathGroup.id, role: 0 },
  })
  await prisma.groupUser.upsert({
    where: { userId_groupId: { userId: students[1].user.id, groupId: mathGroup.id } },
    update: {},
    create: { userId: students[1].user.id, groupId: mathGroup.id, role: 0 },
  })

  console.log('Added members to groups')

  // ============================================================================
  // Create Activities (One per mode)
  // ============================================================================

  // Open Mode Activity (mode = 0)
  const openActivity = await prisma.activity.upsert({
    where: { id: 'open-discussion-activity' },
    update: {},
    create: {
      id: 'open-discussion-activity',
      creatorId: teacher1.id,
      owningGroupId: csGroup.id,
      name: 'Open Discussion: Programming Basics',
      description: 'Share your questions and insights about programming fundamentals. Any topic is welcome!',
      mode: 0,
      openModeSettings: {
        allowAnonymous: true,
        requireApproval: false,
      },
      aiRatingEnabled: true,
    },
  })
  console.log('Created Open Mode activity:', openActivity.name)

  // Exam Mode Activity (mode = 1)
  const examActivity = await prisma.activity.upsert({
    where: { id: 'exam-data-structures' },
    update: {},
    create: {
      id: 'exam-data-structures',
      creatorId: teacher1.id,
      owningGroupId: csGroup.id,
      name: 'Midterm Exam: Data Structures',
      description: 'Test your knowledge of arrays, linked lists, stacks, queues, and trees.',
      mode: 1,
      examSettings: {
        timeLimit: 30,
        questionsToShow: 5,
        passThreshold: 60,
        maxAttempts: 3,
        shuffleQuestions: true,
        shuffleChoices: true,
      },
      aiRatingEnabled: false,
    },
  })
  console.log('Created Exam Mode activity:', examActivity.name)

  // Inquiry Mode Activity (mode = 2)
  const inquiryActivity = await prisma.activity.upsert({
    where: { id: 'inquiry-scientific-method' },
    update: {},
    create: {
      id: 'inquiry-scientific-method',
      creatorId: teacher1.id,
      owningGroupId: csGroup.id,
      name: 'Scientific Method Inquiry',
      description: 'Generate questions that combine scientific concepts with research methodologies.',
      mode: 2,
      inquirySettings: {
        questionsRequired: 5,
        timePerQuestion: 240,
        keywordPool1: ['hypothesis', 'variable', 'control', 'experiment', 'observation'],
        keywordPool2: ['analyze', 'compare', 'predict', 'evaluate', 'synthesize'],
        passThreshold: 6.0,
      },
      aiRatingEnabled: true,
    },
  })
  console.log('Created Inquiry Mode activity:', inquiryActivity.name)

  // Case Mode Activity (mode = 3)
  const caseActivity = await prisma.activity.upsert({
    where: { id: 'case-business-ethics' },
    update: {},
    create: {
      id: 'case-business-ethics',
      creatorId: teacher1.id,
      owningGroupId: csGroup.id,
      name: 'Business Ethics Case Study',
      description: 'Analyze real-world business ethics scenarios and propose solutions.',
      mode: 3,
      examSettings: {
        timeLimit: 45,
        passThreshold: 6.0,
        scenarios: [
          {
            id: 'scenario-1',
            title: 'Data Privacy Dilemma',
            description: 'A tech company discovers a vulnerability in their software that could expose user data. Fixing it would delay a major product launch by 3 months.',
            context: 'The company has 10 million users. The vulnerability has not been exploited yet, but security researchers have privately disclosed it.',
          },
          {
            id: 'scenario-2',
            title: 'Environmental vs Profit',
            description: 'A manufacturing company can reduce costs by 30% by switching to a cheaper but more polluting production method.',
            context: 'The pollution levels would still be within legal limits, but environmental groups are already monitoring the company closely.',
          },
        ],
      },
      aiRatingEnabled: true,
    },
  })
  console.log('Created Case Mode activity:', caseActivity.name)

  // ============================================================================
  // Create Exam Questions (MCQ)
  // ============================================================================

  const examQuestions = [
    {
      id: 'exam-q1',
      content: 'What is the time complexity of accessing an element in an array by index?',
      choices: ['O(1)', 'O(n)', 'O(log n)', 'O(n^2)'],
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
      choices: ['O(1)', 'O(n)', 'O(log n)', 'O(2^n)'],
      correctAnswers: ['1'],
    },
  ]

  for (const q of examQuestions) {
    await prisma.question.upsert({
      where: { id: q.id },
      update: {},
      create: {
        id: q.id,
        creatorId: teacher1.id,
        activityId: examActivity.id,
        content: q.content,
        choices: q.choices,
        correctAnswers: q.correctAnswers,
        questionType: 'multiple_choice',
      },
    })
  }
  console.log('Created 5 exam questions')

  // Update activity question count
  await prisma.activity.update({
    where: { id: examActivity.id },
    data: { numberOfQuestions: 5 },
  })

  // ============================================================================
  // Create Sample Open Mode Questions
  // ============================================================================

  const openQuestion1 = await prisma.question.upsert({
    where: { id: 'open-q1' },
    update: {},
    create: {
      id: 'open-q1',
      creatorId: students[0].user.id,
      activityId: openActivity.id,
      content: 'What is the difference between compiled and interpreted programming languages?',
      questionType: 'open',
    },
  })

  const openQuestion2 = await prisma.question.upsert({
    where: { id: 'open-q2' },
    update: {},
    create: {
      id: 'open-q2',
      creatorId: students[1].user.id,
      activityId: openActivity.id,
      content: 'How do you decide between using recursion vs iteration for solving a problem?',
      questionType: 'open',
    },
  })

  await prisma.activity.update({
    where: { id: openActivity.id },
    data: { numberOfQuestions: 2 },
  })
  console.log('Created 2 open mode questions')

  // ============================================================================
  // Create Attempt Records
  // ============================================================================

  // Student 1: Passed exam (80%), Completed inquiry, Passed case (7.5)
  const student1ExamAttempt = await prisma.examAttempt.upsert({
    where: { id: 'student1-exam-attempt-1' },
    update: {},
    create: {
      id: 'student1-exam-attempt-1',
      userId: students[0].user.id,
      activityId: examActivity.id,
      startedAt: new Date(Date.now() - 3600000), // 1 hour ago
      completedAt: new Date(Date.now() - 3000000), // 50 min ago
      timeSpentSeconds: 600,
      totalQuestions: 5,
      correctAnswers: 4,
      score: 80,
      passed: true,
      status: 'completed',
      questionOrder: examQuestions.map((q) => q.id),
    },
  })
  console.log('Created exam attempt for student1 (passed)')

  const student1InquiryAttempt = await prisma.inquiryAttempt.upsert({
    where: { id: 'student1-inquiry-attempt-1' },
    update: {},
    create: {
      id: 'student1-inquiry-attempt-1',
      userId: students[0].user.id,
      activityId: inquiryActivity.id,
      startedAt: new Date(Date.now() - 7200000),
      completedAt: new Date(Date.now() - 5400000),
      questionsGenerated: 5,
      questionsRequired: 5,
      status: 'completed',
    },
  })
  console.log('Created inquiry attempt for student1 (completed)')

  const student1CaseAttempt = await prisma.caseAttempt.upsert({
    where: { id: 'student1-case-attempt-1' },
    update: {},
    create: {
      id: 'student1-case-attempt-1',
      userId: students[0].user.id,
      activityId: caseActivity.id,
      startedAt: new Date(Date.now() - 10800000),
      completedAt: new Date(Date.now() - 9000000),
      timeSpentSeconds: 1800,
      responses: {
        'scenario-1': {
          issues: 'The main issues are user trust, legal liability, and potential data breach consequences.',
          solution: 'Immediately disclose the vulnerability, delay the launch, and prioritize security patches.',
        },
        'scenario-2': {
          issues: 'Short-term profits vs long-term reputation and environmental responsibility.',
          solution: 'Invest in cleaner technology that balances cost reduction with environmental standards.',
        },
      },
      totalScore: 7.5,
      scenarioScores: {
        'scenario-1': { issuesScore: 8, solutionScore: 7.5, feedback: 'Good analysis of stakeholder impacts.' },
        'scenario-2': { issuesScore: 7, solutionScore: 7.5, feedback: 'Balanced approach with room for more detail.' },
      },
      passed: true,
      status: 'completed',
    },
  })
  console.log('Created case attempt for student1 (passed)')

  // Student 2: Failed exam (40%), Failed case (4.5)
  const student2ExamAttempt = await prisma.examAttempt.upsert({
    where: { id: 'student2-exam-attempt-1' },
    update: {},
    create: {
      id: 'student2-exam-attempt-1',
      userId: students[1].user.id,
      activityId: examActivity.id,
      startedAt: new Date(Date.now() - 86400000), // 1 day ago
      completedAt: new Date(Date.now() - 85000000),
      timeSpentSeconds: 1200,
      totalQuestions: 5,
      correctAnswers: 2,
      score: 40,
      passed: false,
      status: 'completed',
      questionOrder: examQuestions.map((q) => q.id),
    },
  })
  console.log('Created exam attempt for student2 (failed)')

  const student2CaseAttempt = await prisma.caseAttempt.upsert({
    where: { id: 'student2-case-attempt-1' },
    update: {},
    create: {
      id: 'student2-case-attempt-1',
      userId: students[1].user.id,
      activityId: caseActivity.id,
      startedAt: new Date(Date.now() - 172800000), // 2 days ago
      completedAt: new Date(Date.now() - 171000000),
      timeSpentSeconds: 900,
      responses: {
        'scenario-1': {
          issues: 'Security issue needs to be fixed.',
          solution: 'Fix the bug before launch.',
        },
        'scenario-2': {
          issues: 'Pollution is bad.',
          solution: 'Use cleaner methods.',
        },
      },
      totalScore: 4.5,
      scenarioScores: {
        'scenario-1': { issuesScore: 5, solutionScore: 4, feedback: 'Analysis lacks depth and stakeholder consideration.' },
        'scenario-2': { issuesScore: 4, solutionScore: 5, feedback: 'Needs more specific recommendations.' },
      },
      passed: false,
      status: 'completed',
    },
  })
  console.log('Created case attempt for student2 (failed)')

  // Student 3: In-progress exam attempt
  const student3ExamAttempt = await prisma.examAttempt.upsert({
    where: { id: 'student3-exam-attempt-1' },
    update: {},
    create: {
      id: 'student3-exam-attempt-1',
      userId: students[2].user.id,
      activityId: examActivity.id,
      startedAt: new Date(Date.now() - 600000), // 10 min ago
      totalQuestions: 5,
      correctAnswers: 0,
      status: 'in_progress',
      questionOrder: examQuestions.map((q) => q.id),
    },
  })
  console.log('Created in-progress exam attempt for student3')

  // Create some responses for student3's in-progress attempt
  await prisma.response.upsert({
    where: { id: 'student3-response-1' },
    update: {},
    create: {
      id: 'student3-response-1',
      creatorId: students[2].user.id,
      questionId: 'exam-q1',
      content: '',
      choice: '0',
      examAttemptId: student3ExamAttempt.id,
    },
  })

  // ============================================================================
  // Create Leaderboard Entries
  // ============================================================================

  await prisma.leaderboard.upsert({
    where: { activityId_userId: { activityId: examActivity.id, userId: students[0].user.id } },
    update: {},
    create: {
      activityId: examActivity.id,
      userId: students[0].user.id,
      totalScore: 80,
      totalQuestions: 5,
      totalResponses: 5,
      averageScore: 80,
      rank: 1,
    },
  })

  await prisma.leaderboard.upsert({
    where: { activityId_userId: { activityId: examActivity.id, userId: students[1].user.id } },
    update: {},
    create: {
      activityId: examActivity.id,
      userId: students[1].user.id,
      totalScore: 40,
      totalQuestions: 5,
      totalResponses: 5,
      averageScore: 40,
      rank: 2,
    },
  })

  console.log('Created leaderboard entries')

  console.log('\n=== Seeding Complete ===')
  console.log('\nTest Accounts (Password for all: Test1234!):')
  console.log('- superadmin@smile.test (Super Admin)')
  console.log('- admin@smile.test (Admin)')
  console.log('- teacher1@smile.test (Teacher)')
  console.log('- teacher2@smile.test (Teacher)')
  console.log('- student1@smile.test (Student) - has completed attempts')
  console.log('- student2@smile.test (Student) - has failed attempts')
  console.log('- student3@smile.test (Student) - has in-progress attempt')
  console.log('- student4@smile.test (Student) - no attempts yet')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
