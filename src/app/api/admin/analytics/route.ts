import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin permission
    if (session.user.roleId === undefined || session.user.roleId > 1) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || 'month'

    // Calculate date range
    const now = new Date()
    let startDate: Date
    switch (range) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      case 'month':
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    // Get user stats
    const totalUsers = await prisma.user.count()

    // Active users = users who have created responses within the date range
    const activeUserIds = await prisma.response.findMany({
      where: {
        createdAt: { gte: startDate },
      },
      select: { creatorId: true },
      distinct: ['creatorId'],
    })
    const activeUsers = activeUserIds.length
    const newThisWeek = await prisma.user.count({
      where: {
        createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
      },
    })
    const newThisMonth = await prisma.user.count({
      where: {
        createdAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
      },
    })

    // Users by role
    const usersByRole = await prisma.user.groupBy({
      by: ['roleId'],
      _count: { id: true },
    })

    // Get activity stats
    const totalActivities = await prisma.activity.count({ where: { isDeleted: false } })
    const publishedCount = await prisma.activity.count({
      where: { isDeleted: false, visible: true },
    })
    const draftCount = await prisma.activity.count({
      where: { isDeleted: false, visible: false },
    })

    // Activities by mode
    const activitiesByMode = await prisma.activity.groupBy({
      by: ['mode'],
      where: { isDeleted: false },
      _count: { id: true },
    })

    // Engagement stats
    const totalQuestions = await prisma.question.count()
    const totalResponses = await prisma.response.count()
    const totalExamAttempts = await prisma.examAttempt.count()
    const totalCaseAttempts = await prisma.caseAttempt.count()
    const totalInquiryAttempts = await prisma.inquiryAttempt.count()

    // Certificate stats
    const totalCertificates = await prisma.certificate.count()
    const activeCertificates = await prisma.certificate.count({
      where: { status: 'active' },
    })
    const pendingCertificates = await prisma.certificate.count({
      where: { status: 'pending_approval' },
    })
    const totalEnrollments = await prisma.studentCertificate.count()
    const completedEnrollments = await prisma.studentCertificate.count({
      where: { status: 'completed' },
    })

    // Weekly activity trends (last 8 weeks)
    const weeklyActivity = []
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000)
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000)

      const [users, activities, responses] = await Promise.all([
        prisma.user.count({
          where: {
            createdAt: { gte: weekStart, lt: weekEnd },
          },
        }),
        prisma.activity.count({
          where: {
            isDeleted: false,
            createdAt: { gte: weekStart, lt: weekEnd },
          },
        }),
        prisma.response.count({
          where: {
            createdAt: { gte: weekStart, lt: weekEnd },
          },
        }),
      ])

      weeklyActivity.push({
        week: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        users,
        activities,
        responses,
      })
    }

    return NextResponse.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        newThisWeek,
        newThisMonth,
        byRole: usersByRole.map((r) => ({
          role: String(r.roleId),
          count: r._count.id,
        })),
      },
      activities: {
        total: totalActivities,
        publishedCount,
        draftCount,
        byMode: activitiesByMode.map((a) => ({
          mode: String(a.mode),
          count: a._count.id,
        })),
      },
      engagement: {
        totalQuestions,
        totalResponses,
        totalExamAttempts,
        totalCaseAttempts,
        totalInquiryAttempts,
        avgQuestionsPerActivity:
          totalActivities > 0 ? Math.round(totalQuestions / totalActivities) : 0,
      },
      certificates: {
        total: totalCertificates,
        active: activeCertificates,
        pending: pendingCertificates,
        enrollments: totalEnrollments,
        completions: completedEnrollments,
      },
      weeklyActivity,
    })
  } catch (error) {
    console.error('Failed to fetch analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
