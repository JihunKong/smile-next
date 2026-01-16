import { prisma } from '@/lib/db/prisma'
import { sendEmail } from '@/lib/services/emailService'

// Helper to get user display name
function getUserDisplayName(user: { firstName?: string | null; lastName?: string | null; email?: string }): string {
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`
  if (user.firstName) return user.firstName
  if (user.lastName) return user.lastName
  return user.email?.split('@')[0] || 'Student'
}

// Types
export interface StudentWeeklyReport {
  user: {
    id: string
    name: string
    email: string
  }
  weekEnding: string
  analytics: {
    totalQuestions: number
    totalResponses: number
    averageQuality: number
    recentQuestions: number
    keywordsCount: number
  }
  qualityDistribution: { level: number; count: number }[]
  weeklyActivity: { date: string; questions: number }[]
  recentQuestions: {
    date: string
    question: string
    quality: number
    activityName: string
  }[]
  weekChange: number
  improvementSuggestions: string[]
}

export interface ActivityReport {
  activity: {
    id: string
    name: string
    subject: string | null
    ownerName: string
  }
  dateRange: { start: string; end: string }
  summary: {
    totalStudents: number
    totalQuestions: number
    avgQuality: number
    completionRate: number
  }
  studentBreakdown: {
    studentName: string
    questions: number
    avgQuality: number
    lastActive: string
  }[]
  qualityDistribution: { level: number; count: number }[]
  topKeywords: { keyword: string; count: number }[]
}

export interface GroupReport {
  group: {
    id: string
    name: string
    ownerName: string
  }
  dateRange: { start: string; end: string }
  summary: {
    totalActivities: number
    totalStudents: number
    totalQuestions: number
    avgQuality: number
  }
  activityBreakdown: {
    activityName: string
    students: number
    questions: number
    avgQuality: number
  }[]
  topPerformers: {
    studentName: string
    questions: number
    avgQuality: number
  }[]
}

// Helper: Get week date range
function getWeekDateRange(): { start: Date; end: Date } {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - 7)
  return { start, end }
}

// Generate Student Weekly Report
export async function generateStudentWeeklyReport(userId: string): Promise<StudentWeeklyReport | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, firstName: true, lastName: true, email: true },
  })

  if (!user || !user.email) return null

  const { start, end } = getWeekDateRange()

  // Get this week's questions
  const recentQuestions = await prisma.question.findMany({
    where: {
      creatorId: userId,
      isDeleted: false,
      createdAt: { gte: start, lte: end },
    },
    include: {
      activity: { select: { name: true } },
      evaluation: { select: { overallScore: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  // Get last week's questions for comparison
  const lastWeekStart = new Date(start)
  lastWeekStart.setDate(lastWeekStart.getDate() - 7)
  const lastWeekCount = await prisma.question.count({
    where: {
      creatorId: userId,
      isDeleted: false,
      createdAt: { gte: lastWeekStart, lt: start },
    },
  })

  // Get all-time stats
  const allQuestions = await prisma.question.findMany({
    where: { creatorId: userId, isDeleted: false },
    include: { evaluation: { select: { overallScore: true } } },
  })

  const qualityScores = allQuestions
    .filter((q) => q.evaluation?.overallScore)
    .map((q) => q.evaluation!.overallScore)

  const avgQuality =
    qualityScores.length > 0
      ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length
      : 0

  // Quality distribution
  const qualityDistribution = [1, 2, 3, 4, 5].map((level) => ({
    level,
    count: qualityScores.filter((q) => Math.round(q) === level).length,
  }))

  // Weekly activity (last 7 days)
  const weeklyActivity: { date: string; questions: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    const dayStart = new Date(dateStr)
    const dayEnd = new Date(dateStr)
    dayEnd.setDate(dayEnd.getDate() + 1)

    const count = await prisma.question.count({
      where: {
        creatorId: userId,
        isDeleted: false,
        createdAt: { gte: dayStart, lt: dayEnd },
      },
    })

    weeklyActivity.push({ date: dateStr, questions: count })
  }

  // Week change percentage
  const weekChange =
    lastWeekCount > 0
      ? Math.round(((recentQuestions.length - lastWeekCount) / lastWeekCount) * 100)
      : recentQuestions.length > 0
        ? 100
        : 0

  // Improvement suggestions based on data
  const improvementSuggestions: string[] = []
  if (avgQuality < 3) {
    improvementSuggestions.push('Try asking more specific questions to improve quality scores')
  }
  if (recentQuestions.length < 5) {
    improvementSuggestions.push('Aim to create at least 5 questions per week')
  }
  if (qualityDistribution[4].count < qualityDistribution[0].count) {
    improvementSuggestions.push('Focus on creating higher-level thinking questions')
  }

  return {
    user: {
      id: user.id,
      name: getUserDisplayName(user),
      email: user.email,
    },
    weekEnding: end.toISOString().split('T')[0],
    analytics: {
      totalQuestions: allQuestions.length,
      totalResponses: 0, // Would need Response model
      averageQuality: Math.round(avgQuality * 10) / 10,
      recentQuestions: recentQuestions.length,
      keywordsCount: 0, // Would need keyword extraction
    },
    qualityDistribution,
    weeklyActivity,
    recentQuestions: recentQuestions.map((q) => ({
      date: q.createdAt.toISOString().split('T')[0],
      question: q.content.substring(0, 100),
      quality: q.evaluation?.overallScore || 0,
      activityName: q.activity.name,
    })),
    weekChange,
    improvementSuggestions,
  }
}

// Generate Activity Report
export async function generateActivityReport(
  activityId: string,
  startDate?: string,
  endDate?: string
): Promise<ActivityReport | null> {
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    include: {
      creator: { select: { firstName: true, lastName: true, email: true } },
      owningGroup: { select: { name: true } },
    },
  })

  if (!activity) return null

  const dateFilter: { gte?: Date; lte?: Date } = {}
  if (startDate) dateFilter.gte = new Date(startDate)
  if (endDate) dateFilter.lte = new Date(endDate)

  // Get all questions for this activity
  const questions = await prisma.question.findMany({
    where: {
      activityId,
      isDeleted: false,
      ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
    },
    include: {
      creator: { select: { id: true, firstName: true, lastName: true, email: true } },
      evaluation: { select: { overallScore: true } },
    },
  })

  // Group by student
  const studentMap = new Map<
    string,
    {
      name: string
      questions: number
      totalQuality: number
      qualityCount: number
      lastActive: Date
    }
  >()

  questions.forEach((q) => {
    const existing = studentMap.get(q.creatorId) || {
      name: getUserDisplayName(q.creator),
      questions: 0,
      totalQuality: 0,
      qualityCount: 0,
      lastActive: new Date(0),
    }

    existing.questions++
    if (q.evaluation?.overallScore) {
      existing.totalQuality += q.evaluation.overallScore
      existing.qualityCount++
    }
    if (q.createdAt > existing.lastActive) {
      existing.lastActive = q.createdAt
    }

    studentMap.set(q.creatorId, existing)
  })

  const studentBreakdown = Array.from(studentMap.values())
    .map((s) => ({
      studentName: s.name,
      questions: s.questions,
      avgQuality: s.qualityCount > 0 ? Math.round((s.totalQuality / s.qualityCount) * 10) / 10 : 0,
      lastActive: s.lastActive.toISOString().split('T')[0],
    }))
    .sort((a, b) => b.questions - a.questions)

  // Quality distribution
  const qualityScores = questions
    .filter((q) => q.evaluation?.overallScore)
    .map((q) => q.evaluation!.overallScore)

  const qualityDistribution = [1, 2, 3, 4, 5].map((level) => ({
    level,
    count: qualityScores.filter((q) => Math.round(q) === level).length,
  }))

  const avgQuality =
    qualityScores.length > 0
      ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length
      : 0

  // Extract keywords (simple approach)
  const keywordCounts = new Map<string, number>()
  questions.forEach((q) => {
    const words = q.content.toLowerCase().split(/\s+/)
    words.forEach((word) => {
      if (word.length > 4) {
        keywordCounts.set(word, (keywordCounts.get(word) || 0) + 1)
      }
    })
  })

  const topKeywords = Array.from(keywordCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([keyword, count]) => ({ keyword, count }))

  return {
    activity: {
      id: activity.id,
      name: activity.name,
      subject: activity.schoolSubject,
      ownerName: getUserDisplayName(activity.creator),
    },
    dateRange: {
      start: startDate || 'All time',
      end: endDate || new Date().toISOString().split('T')[0],
    },
    summary: {
      totalStudents: studentMap.size,
      totalQuestions: questions.length,
      avgQuality: Math.round(avgQuality * 10) / 10,
      completionRate: 0, // Would need enrollment data
    },
    studentBreakdown,
    qualityDistribution,
    topKeywords,
  }
}

// Generate Group Report
export async function generateGroupReport(
  groupId: string,
  startDate?: string,
  endDate?: string
): Promise<GroupReport | null> {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      creator: { select: { firstName: true, lastName: true, email: true } },
      activities: { select: { id: true, name: true } },
    },
  })

  if (!group) return null

  const dateFilter: { gte?: Date; lte?: Date } = {}
  if (startDate) dateFilter.gte = new Date(startDate)
  if (endDate) dateFilter.lte = new Date(endDate)

  // Get all questions across all activities in the group
  const activityIds = group.activities.map((a) => a.id)

  const questions = await prisma.question.findMany({
    where: {
      activityId: { in: activityIds },
      isDeleted: false,
      ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
    },
    include: {
      creator: { select: { id: true, firstName: true, lastName: true, email: true } },
      activity: { select: { id: true, name: true } },
      evaluation: { select: { overallScore: true } },
    },
  })

  // Activity breakdown
  const activityMap = new Map<
    string,
    {
      name: string
      students: Set<string>
      questions: number
      totalQuality: number
      qualityCount: number
    }
  >()

  group.activities.forEach((a) => {
    activityMap.set(a.id, {
      name: a.name,
      students: new Set(),
      questions: 0,
      totalQuality: 0,
      qualityCount: 0,
    })
  })

  // Student performance
  const studentMap = new Map<
    string,
    { name: string; questions: number; totalQuality: number; qualityCount: number }
  >()

  questions.forEach((q) => {
    // Update activity stats
    const activity = activityMap.get(q.activityId)
    if (activity) {
      activity.students.add(q.creatorId)
      activity.questions++
      if (q.evaluation?.overallScore) {
        activity.totalQuality += q.evaluation.overallScore
        activity.qualityCount++
      }
    }

    // Update student stats
    const student = studentMap.get(q.creatorId) || {
      name: getUserDisplayName(q.creator),
      questions: 0,
      totalQuality: 0,
      qualityCount: 0,
    }
    student.questions++
    if (q.evaluation?.overallScore) {
      student.totalQuality += q.evaluation.overallScore
      student.qualityCount++
    }
    studentMap.set(q.creatorId, student)
  })

  const activityBreakdown = Array.from(activityMap.values())
    .map((a) => ({
      activityName: a.name,
      students: a.students.size,
      questions: a.questions,
      avgQuality: a.qualityCount > 0 ? Math.round((a.totalQuality / a.qualityCount) * 10) / 10 : 0,
    }))
    .sort((a, b) => b.questions - a.questions)

  const topPerformers = Array.from(studentMap.values())
    .map((s) => ({
      studentName: s.name,
      questions: s.questions,
      avgQuality: s.qualityCount > 0 ? Math.round((s.totalQuality / s.qualityCount) * 10) / 10 : 0,
    }))
    .sort((a, b) => b.avgQuality - a.avgQuality || b.questions - a.questions)
    .slice(0, 10)

  const qualityScores = questions
    .filter((q) => q.evaluation?.overallScore)
    .map((q) => q.evaluation!.overallScore)

  const avgQuality =
    qualityScores.length > 0
      ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length
      : 0

  return {
    group: {
      id: group.id,
      name: group.name,
      ownerName: getUserDisplayName(group.creator),
    },
    dateRange: {
      start: startDate || 'All time',
      end: endDate || new Date().toISOString().split('T')[0],
    },
    summary: {
      totalActivities: group.activities.length,
      totalStudents: studentMap.size,
      totalQuestions: questions.length,
      avgQuality: Math.round(avgQuality * 10) / 10,
    },
    activityBreakdown,
    topPerformers,
  }
}

// Send Student Weekly Report Email
export async function sendStudentWeeklyReportEmail(userId: string): Promise<boolean> {
  const report = await generateStudentWeeklyReport(userId)
  if (!report) return false

  const emailHtml = `
    <h2>Weekly Learning Report</h2>
    <p>Hi ${report.user.name},</p>
    <p>Here's your learning summary for the week ending ${report.weekEnding}:</p>

    <h3>📊 This Week's Activity</h3>
    <ul>
      <li>Questions created: ${report.analytics.recentQuestions}</li>
      <li>Week-over-week change: ${report.weekChange > 0 ? '+' : ''}${report.weekChange}%</li>
    </ul>

    <h3>📈 Overall Statistics</h3>
    <ul>
      <li>Total questions: ${report.analytics.totalQuestions}</li>
      <li>Average quality: ${report.analytics.averageQuality}/5</li>
    </ul>

    ${
      report.recentQuestions.length > 0
        ? `
    <h3>📝 Recent Questions</h3>
    <ul>
      ${report.recentQuestions.slice(0, 5).map((q) => `<li>"${q.question}..." - ${q.activityName}</li>`).join('')}
    </ul>
    `
        : ''
    }

    ${
      report.improvementSuggestions.length > 0
        ? `
    <h3>💡 Suggestions for Improvement</h3>
    <ul>
      ${report.improvementSuggestions.map((s) => `<li>${s}</li>`).join('')}
    </ul>
    `
        : ''
    }

    <p>Keep up the great work!</p>
    <p>- SMILE Team</p>
  `

  try {
    await sendEmail({
      to: report.user.email,
      subject: `Your SMILE Weekly Report - Week of ${report.weekEnding}`,
      html: emailHtml,
    })
    return true
  } catch (error) {
    console.error('Failed to send weekly report email:', error)
    return false
  }
}

// Send Activity Report Email
export async function sendActivityReportEmail(
  activityId: string,
  recipientEmail: string,
  startDate?: string,
  endDate?: string
): Promise<boolean> {
  const report = await generateActivityReport(activityId, startDate, endDate)
  if (!report) return false

  const emailHtml = `
    <h2>Activity Report: ${report.activity.name}</h2>
    <p>Report period: ${report.dateRange.start} to ${report.dateRange.end}</p>

    <h3>📊 Summary</h3>
    <ul>
      <li>Total Students: ${report.summary.totalStudents}</li>
      <li>Total Questions: ${report.summary.totalQuestions}</li>
      <li>Average Quality: ${report.summary.avgQuality}/5</li>
    </ul>

    <h3>👥 Student Activity</h3>
    <table border="1" cellpadding="5">
      <tr><th>Student</th><th>Questions</th><th>Avg Quality</th><th>Last Active</th></tr>
      ${report.studentBreakdown.slice(0, 10).map((s) => `<tr><td>${s.studentName}</td><td>${s.questions}</td><td>${s.avgQuality}</td><td>${s.lastActive}</td></tr>`).join('')}
    </table>

    <h3>🔑 Top Keywords</h3>
    <p>${report.topKeywords.map((k) => `${k.keyword} (${k.count})`).join(', ')}</p>

    <p>- SMILE Team</p>
  `

  try {
    await sendEmail({
      to: recipientEmail,
      subject: `SMILE Activity Report: ${report.activity.name}`,
      html: emailHtml,
    })
    return true
  } catch (error) {
    console.error('Failed to send activity report email:', error)
    return false
  }
}

// Send Group Report Email
export async function sendGroupReportEmail(
  groupId: string,
  recipientEmail: string,
  startDate?: string,
  endDate?: string
): Promise<boolean> {
  const report = await generateGroupReport(groupId, startDate, endDate)
  if (!report) return false

  const emailHtml = `
    <h2>Group Report: ${report.group.name}</h2>
    <p>Report period: ${report.dateRange.start} to ${report.dateRange.end}</p>

    <h3>📊 Summary</h3>
    <ul>
      <li>Total Activities: ${report.summary.totalActivities}</li>
      <li>Total Students: ${report.summary.totalStudents}</li>
      <li>Total Questions: ${report.summary.totalQuestions}</li>
      <li>Average Quality: ${report.summary.avgQuality}/5</li>
    </ul>

    <h3>📚 Activity Breakdown</h3>
    <table border="1" cellpadding="5">
      <tr><th>Activity</th><th>Students</th><th>Questions</th><th>Avg Quality</th></tr>
      ${report.activityBreakdown.map((a) => `<tr><td>${a.activityName}</td><td>${a.students}</td><td>${a.questions}</td><td>${a.avgQuality}</td></tr>`).join('')}
    </table>

    <h3>🏆 Top Performers</h3>
    <table border="1" cellpadding="5">
      <tr><th>Student</th><th>Questions</th><th>Avg Quality</th></tr>
      ${report.topPerformers.map((p) => `<tr><td>${p.studentName}</td><td>${p.questions}</td><td>${p.avgQuality}</td></tr>`).join('')}
    </table>

    <p>- SMILE Team</p>
  `

  try {
    await sendEmail({
      to: recipientEmail,
      subject: `SMILE Group Report: ${report.group.name}`,
      html: emailHtml,
    })
    return true
  } catch (error) {
    console.error('Failed to send group report email:', error)
    return false
  }
}
