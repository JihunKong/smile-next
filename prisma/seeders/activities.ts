/**
 * Activities Seeder
 *
 * Creates activities across all groups with different modes:
 * - Open Mode (mode=0): Discussion-based
 * - Exam Mode (mode=1): MCQ tests
 * - Inquiry Mode (mode=2): Question generation
 * - Case Mode (mode=3): Scenario analysis
 */

import { PrismaClientType, SeededGroups, SeededActivities } from './types'
import { User } from '@prisma/client'

interface Teachers {
  teacher1: User
  teacher2: User
  teacher3: User
}

export async function seedActivities(
  prisma: PrismaClientType,
  groups: SeededGroups,
  teachers: Teachers
): Promise<SeededActivities> {
  console.log('\n📦 Seeding Activities...')

  const { csGroup, mathGroup, englishGroup, physicsGroup, researchGroup } = groups

  // === CS Group Activities ===
  const openActivity = await prisma.activity.upsert({
    where: { id: 'open-discussion-activity' },
    update: {},
    create: {
      id: 'open-discussion-activity',
      creatorId: teachers.teacher1.id,
      owningGroupId: csGroup.id,
      name: 'Open Discussion: Programming Basics',
      description: 'Share your questions and insights about programming fundamentals.',
      mode: 0,
      openModeSettings: { allowAnonymous: true, requireApproval: false },
      aiRatingEnabled: true,
    },
  })

  const examActivity = await prisma.activity.upsert({
    where: { id: 'exam-data-structures' },
    update: {},
    create: {
      id: 'exam-data-structures',
      creatorId: teachers.teacher1.id,
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

  const inquiryActivity = await prisma.activity.upsert({
    where: { id: 'inquiry-scientific-method' },
    update: {},
    create: {
      id: 'inquiry-scientific-method',
      creatorId: teachers.teacher1.id,
      owningGroupId: csGroup.id,
      name: 'Scientific Method Inquiry',
      description: 'Generate questions combining scientific concepts with research methodologies.',
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

  const caseActivity = await prisma.activity.upsert({
    where: { id: 'case-business-ethics' },
    update: {},
    create: {
      id: 'case-business-ethics',
      creatorId: teachers.teacher1.id,
      owningGroupId: csGroup.id,
      name: 'Business Ethics Case Study',
      description: 'Analyze real-world business ethics scenarios and propose solutions.',
      mode: 3,
      openModeSettings: {
        timePerCase: 10,
        totalTimeLimit: 45,
        passThreshold: 6.0,
        maxAttempts: 3,
        scenarios: [
          {
            id: 'scenario-1',
            title: 'Data Privacy Dilemma',
            content: 'A tech company discovers a vulnerability in their software that could expose user data. Fixing it would delay a major product launch by 3 months.',
          },
          {
            id: 'scenario-2',
            title: 'Environmental vs Profit',
            content: 'A manufacturing company can reduce costs by 30% by switching to a cheaper but more polluting production method.',
          },
        ],
      },
      aiRatingEnabled: true,
    },
  })

  console.log('  ✓ Created 4 CS activities')

  // === Math Group Activities ===
  const mathExamActivity = await prisma.activity.upsert({
    where: { id: 'exam-calculus-midterm' },
    update: {},
    create: {
      id: 'exam-calculus-midterm',
      creatorId: teachers.teacher3.id,
      owningGroupId: mathGroup.id,
      name: 'Calculus Midterm Exam',
      description: 'Test your understanding of derivatives, integrals, and limits.',
      mode: 1,
      examSettings: {
        timeLimit: 45,
        questionsToShow: 8,
        passThreshold: 70,
        maxAttempts: 2,
        shuffleQuestions: true,
        shuffleChoices: true,
      },
      aiRatingEnabled: false,
    },
  })

  const mathCaseActivity = await prisma.activity.upsert({
    where: { id: 'case-optimization-problems' },
    update: {},
    create: {
      id: 'case-optimization-problems',
      creatorId: teachers.teacher3.id,
      owningGroupId: mathGroup.id,
      name: 'Optimization Case Studies',
      description: 'Apply calculus to real-world optimization problems.',
      mode: 3,
      openModeSettings: {
        timePerCase: 15,
        totalTimeLimit: 60,
        passThreshold: 6.0,
        maxAttempts: 2,
        scenarios: [
          {
            id: 'math-scenario-1',
            title: 'Manufacturing Cost Optimization',
            content: 'A factory produces widgets with cost function C(x) = 0.01x² + 5x + 1000. Find the production level that maximizes profit.',
          },
          {
            id: 'math-scenario-2',
            title: 'Inventory Management',
            content: 'A retailer needs to determine optimal order quantity using the EOQ model.',
          },
        ],
      },
      aiRatingEnabled: true,
    },
  })

  console.log('  ✓ Created 2 Math activities')

  // === English Group Activities ===
  const englishOpenActivity = await prisma.activity.upsert({
    where: { id: 'open-literary-analysis' },
    update: {},
    create: {
      id: 'open-literary-analysis',
      creatorId: teachers.teacher2.id,
      owningGroupId: englishGroup.id,
      name: 'Literary Analysis Discussion',
      description: 'Share your interpretations about our current reading assignments.',
      mode: 0,
      openModeSettings: { allowAnonymous: false, requireApproval: false },
      aiRatingEnabled: true,
    },
  })

  const englishInquiryActivity = await prisma.activity.upsert({
    where: { id: 'inquiry-essay-writing' },
    update: {},
    create: {
      id: 'inquiry-essay-writing',
      creatorId: teachers.teacher2.id,
      owningGroupId: englishGroup.id,
      name: 'Essay Writing Inquiry',
      description: 'Generate thesis statements and critical questions about literary themes.',
      mode: 2,
      inquirySettings: {
        questionsRequired: 4,
        timePerQuestion: 300,
        keywordPool1: ['theme', 'symbolism', 'character', 'conflict', 'narrative'],
        keywordPool2: ['analyze', 'interpret', 'contrast', 'examine', 'critique'],
        passThreshold: 6.0,
      },
      aiRatingEnabled: true,
    },
  })

  console.log('  ✓ Created 2 English activities')

  // === Physics Group Activities ===
  const physicsInquiryActivity = await prisma.activity.upsert({
    where: { id: 'inquiry-physics-experiments' },
    update: {},
    create: {
      id: 'inquiry-physics-experiments',
      creatorId: teachers.teacher1.id,
      owningGroupId: physicsGroup.id,
      name: 'Physics Experiment Inquiry',
      description: 'Generate hypotheses and experimental questions for lab investigations.',
      mode: 2,
      inquirySettings: {
        questionsRequired: 5,
        timePerQuestion: 300,
        keywordPool1: ['force', 'energy', 'momentum', 'velocity', 'acceleration'],
        keywordPool2: ['measure', 'calculate', 'predict', 'test', 'verify'],
        passThreshold: 6.0,
      },
      aiRatingEnabled: true,
    },
  })

  console.log('  ✓ Created 1 Physics activity')

  // === Research Group Activities ===
  const researchCaseActivity = await prisma.activity.upsert({
    where: { id: 'case-research-ethics' },
    update: {},
    create: {
      id: 'case-research-ethics',
      creatorId: teachers.teacher2.id,
      owningGroupId: researchGroup.id,
      name: 'Research Ethics Case Studies',
      description: 'Analyze ethical dilemmas in academic research.',
      mode: 3,
      openModeSettings: {
        timePerCase: 20,
        totalTimeLimit: 90,
        passThreshold: 7.0,
        maxAttempts: 2,
        scenarios: [
          {
            id: 'ethics-scenario-1',
            title: 'Data Fabrication Discovery',
            content: 'You discover that a senior colleague may have fabricated data in a published paper. What ethical obligations do you have?',
          },
          {
            id: 'ethics-scenario-2',
            title: 'Informed Consent Challenge',
            content: 'Your research involves interviewing vulnerable populations who may not fully understand consent forms. How do you ensure ethical research practices?',
          },
        ],
      },
      aiRatingEnabled: true,
    },
  })

  console.log('  ✓ Created 1 Research activity')

  return {
    openActivity,
    examActivity,
    inquiryActivity,
    caseActivity,
    mathExamActivity,
    mathCaseActivity,
    englishOpenActivity,
    englishInquiryActivity,
    physicsInquiryActivity,
    researchCaseActivity,
  }
}
