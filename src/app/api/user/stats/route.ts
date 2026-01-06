import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'

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

    // Get total questions created by user
    const totalQuestions = await prisma.question.count({
      where: {
        creatorId: userId,
        isDeleted: false,
      },
    })

    // Get total activities the user participated in (via attempts)
    const [examAttempts, inquiryAttempts, caseAttempts] = await Promise.all([
      prisma.examAttempt.count({
        where: { userId },
      }),
      prisma.inquiryAttempt.count({
        where: { userId },
      }),
      prisma.caseAttempt.count({
        where: { userId },
      }),
    ])
    const totalActivities = examAttempts + inquiryAttempts + caseAttempts

    // Get total groups
    const totalGroups = await prisma.groupUser.count({
      where: {
        userId,
        group: {
          isDeleted: false,
        },
      },
    })

    // Calculate average score from exam attempts
    const examScores = await prisma.examAttempt.aggregate({
      where: {
        userId,
        status: 'completed',
        score: { not: null },
      },
      _avg: {
        score: true,
      },
    })

    const averageScore = examScores._avg.score || 0

    return NextResponse.json({
      totalQuestions,
      totalActivities,
      totalGroups,
      averageScore,
    })
  } catch (error) {
    console.error('Failed to fetch user stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
