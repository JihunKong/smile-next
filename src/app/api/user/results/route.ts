import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Get all user stats
    const [
      totalQuestions,
      totalResponses,
      examAttempts,
      inquiryAttempts,
      caseAttempts,
      questionEvaluations,
    ] = await Promise.all([
      prisma.question.count({
        where: { creatorId: userId, isDeleted: false },
      }),
      prisma.response.count({
        where: { creatorId: userId, isDeleted: false },
      }),
      prisma.examAttempt.findMany({
        where: { userId },
        include: {
          activity: {
            select: {
              id: true,
              name: true,
              mode: true,
              owningGroup: {
                select: { name: true },
              },
            },
          },
        },
        orderBy: { startedAt: 'desc' },
      }),
      prisma.inquiryAttempt.findMany({
        where: { userId },
        include: {
          activity: {
            select: {
              id: true,
              name: true,
              mode: true,
              owningGroup: {
                select: { name: true },
              },
            },
          },
        },
        orderBy: { startedAt: 'desc' },
      }),
      prisma.caseAttempt.findMany({
        where: { userId },
        include: {
          activity: {
            select: {
              id: true,
              name: true,
              mode: true,
              owningGroup: {
                select: { name: true },
              },
            },
          },
        },
        orderBy: { startedAt: 'desc' },
      }),
      prisma.questionEvaluation.findMany({
        where: {
          questions: {
            some: {
              creatorId: userId,
            },
          },
        },
        select: { bloomsLevel: true },
      }),
    ])

    // Calculate stats
    const completedExams = examAttempts.filter(e => e.status === 'completed')
    const examScores = completedExams.filter(e => e.score !== null).map(e => e.score!)

    const completedCases = caseAttempts.filter(c => c.status === 'completed')
    const caseScores = completedCases.filter(c => c.totalScore !== null).map(c => c.totalScore!)

    const allScores = [...examScores, ...caseScores]
    const averageScore = allScores.length > 0
      ? allScores.reduce((sum, s) => sum + s, 0) / allScores.length
      : null

    const passedExams = completedExams.filter(e => e.passed === true).length
    const passedCases = completedCases.filter(c => c.passed === true).length
    const totalPassed = passedExams + passedCases
    const totalCompleted = completedExams.length + completedCases.length
    const passRate = totalCompleted > 0 ? (totalPassed / totalCompleted) * 100 : null

    const totalTimeSpent =
      examAttempts.reduce((sum, e) => sum + (e.timeSpentSeconds || 0), 0) +
      caseAttempts.reduce((sum, c) => sum + (c.timeSpentSeconds || 0), 0)

    // Bloom's breakdown
    const bloomsBreakdown: Record<string, number> = {
      Remember: 0,
      Understand: 0,
      Apply: 0,
      Analyze: 0,
      Evaluate: 0,
      Create: 0,
    }
    questionEvaluations.forEach(qe => {
      if (qe.bloomsLevel && qe.bloomsLevel in bloomsBreakdown) {
        bloomsBreakdown[qe.bloomsLevel]++
      }
    })

    // Format attempts
    const attempts = [
      ...examAttempts.map(e => ({
        id: e.id,
        activityId: e.activity.id,
        activityName: e.activity.name,
        groupName: e.activity.owningGroup.name,
        mode: e.activity.mode,
        score: e.score,
        status: e.status,
        startedAt: e.startedAt.toISOString(),
        completedAt: e.completedAt?.toISOString() || null,
        timeSpent: e.timeSpentSeconds,
        passed: e.passed,
      })),
      ...inquiryAttempts.map(i => ({
        id: i.id,
        activityId: i.activity.id,
        activityName: i.activity.name,
        groupName: i.activity.owningGroup.name,
        mode: i.activity.mode,
        score: null,
        status: i.status,
        startedAt: i.startedAt.toISOString(),
        completedAt: i.completedAt?.toISOString() || null,
        timeSpent: null,
        passed: i.status === 'completed',
      })),
      ...caseAttempts.map(c => ({
        id: c.id,
        activityId: c.activity.id,
        activityName: c.activity.name,
        groupName: c.activity.owningGroup.name,
        mode: c.activity.mode,
        score: c.totalScore,
        status: c.status,
        startedAt: c.startedAt.toISOString(),
        completedAt: c.completedAt?.toISOString() || null,
        timeSpent: c.timeSpentSeconds,
        passed: c.passed,
      })),
    ].sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())

    return NextResponse.json({
      stats: {
        totalQuestions,
        totalResponses,
        totalExamAttempts: examAttempts.length,
        totalInquiryAttempts: inquiryAttempts.length,
        totalCaseAttempts: caseAttempts.length,
        averageScore,
        passRate,
        totalTimeSpent,
        bloomsBreakdown,
      },
      attempts,
    })
  } catch (error) {
    console.error('Failed to fetch user results:', error)
    return NextResponse.json(
      { error: 'Failed to fetch results' },
      { status: 500 }
    )
  }
}
