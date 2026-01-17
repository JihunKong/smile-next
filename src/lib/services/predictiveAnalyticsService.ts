import { prisma } from '@/lib/db/prisma'
import OpenAI from 'openai'

// Lazy initialization to avoid build-time errors
let openaiClient: OpenAI | null = null

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    })
  }
  return openaiClient
}

// Types
export interface PerformancePrediction {
  studentId: string
  currentTrend: 'improving' | 'stable' | 'declining'
  predictedQuality: number
  confidence: number
  historicalData: { date: string; quality: number }[]
  recommendation: string
}

export interface EngagementPrediction {
  activityId: string
  predictedEngagement: 'high' | 'medium' | 'low'
  optimalPostingTimes: string[]
  factorsAffecting: string[]
  weeklyProjection: { week: string; expectedQuestions: number }[]
}

export interface AtRiskStudent {
  studentId: string
  studentName: string
  riskScore: number
  riskLevel: 'high' | 'medium' | 'low'
  riskFactors: string[]
  lastActivity: string | null
  questionCount: number
  avgQuality: number
  suggestedIntervention: string
}

export interface OptimalTiming {
  dayOfWeek: string
  hour: number
  engagementScore: number
  questionCount: number
}

export interface InsightsSummary {
  overallHealth: 'excellent' | 'good' | 'needs_attention' | 'critical'
  keyInsights: string[]
  recommendations: string[]
  metrics: {
    activeStudentRate: number
    avgQualityTrend: number
    engagementTrend: number
  }
}

// Helper: Calculate linear regression for trend
function linearRegression(data: number[]): { slope: number; intercept: number } {
  const n = data.length
  if (n < 2) return { slope: 0, intercept: data[0] || 0 }

  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumX2 = 0

  data.forEach((y, x) => {
    sumX += x
    sumY += y
    sumXY += x * y
    sumX2 += x * x
  })

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  return { slope: isNaN(slope) ? 0 : slope, intercept: isNaN(intercept) ? 0 : intercept }
}

// Get Performance Prediction for a Student
export async function getStudentPerformancePrediction(
  studentId: string
): Promise<PerformancePrediction | null> {
  // Get last 30 days of questions with quality scores
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const questions = await prisma.question.findMany({
    where: {
      creatorId: studentId,
      isDeleted: false,
      createdAt: { gte: thirtyDaysAgo },
    },
    include: {
      evaluation: { select: { overallScore: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  if (questions.length < 3) {
    return null // Not enough data
  }

  // Calculate daily averages
  const dailyData = new Map<string, { total: number; count: number }>()
  questions.forEach((q) => {
    if (q.evaluation?.overallScore) {
      const date = q.createdAt.toISOString().split('T')[0]
      const existing = dailyData.get(date) || { total: 0, count: 0 }
      existing.total += q.evaluation.overallScore
      existing.count++
      dailyData.set(date, existing)
    }
  })

  const historicalData = Array.from(dailyData.entries())
    .map(([date, data]) => ({
      date,
      quality: Math.round((data.total / data.count) * 10) / 10,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))

  const qualityValues = historicalData.map((d) => d.quality)
  const { slope, intercept } = linearRegression(qualityValues)

  // Predict next value
  const predictedQuality = Math.min(5, Math.max(1, slope * qualityValues.length + intercept))

  // Determine trend
  let currentTrend: 'improving' | 'stable' | 'declining'
  if (slope > 0.1) currentTrend = 'improving'
  else if (slope < -0.1) currentTrend = 'declining'
  else currentTrend = 'stable'

  // Calculate confidence based on data consistency
  const variance =
    qualityValues.reduce((sum, v) => sum + Math.pow(v - predictedQuality, 2), 0) /
    qualityValues.length
  const confidence = Math.max(0.3, Math.min(0.95, 1 - variance / 5))

  // Generate recommendation
  let recommendation: string
  if (currentTrend === 'improving') {
    recommendation = 'Great progress! Continue with current study habits.'
  } else if (currentTrend === 'declining') {
    recommendation =
      'Consider reviewing question formulation strategies and focusing on higher-order thinking.'
  } else {
    recommendation = 'Consistent performance. Try challenging yourself with more complex questions.'
  }

  return {
    studentId,
    currentTrend,
    predictedQuality: Math.round(predictedQuality * 10) / 10,
    confidence: Math.round(confidence * 100) / 100,
    historicalData,
    recommendation,
  }
}

// Get Engagement Prediction for an Activity
export async function getActivityEngagementPrediction(
  activityId: string
): Promise<EngagementPrediction | null> {
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
  })

  if (!activity) return null

  // Get last 4 weeks of questions
  const fourWeeksAgo = new Date()
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)

  const questions = await prisma.question.findMany({
    where: {
      activityId,
      isDeleted: false,
      createdAt: { gte: fourWeeksAgo },
    },
    orderBy: { createdAt: 'asc' },
  })

  // Calculate hourly distribution
  const hourlyCount = new Map<number, number>()
  const dayCount = new Map<string, number>()

  questions.forEach((q) => {
    const hour = q.createdAt.getHours()
    hourlyCount.set(hour, (hourlyCount.get(hour) || 0) + 1)

    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][q.createdAt.getDay()]
    dayCount.set(day, (dayCount.get(day) || 0) + 1)
  })

  // Find optimal posting times (top 3 hours)
  const sortedHours = Array.from(hourlyCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  const optimalPostingTimes = sortedHours.map(([hour]) => {
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    return `${displayHour}:00 ${period}`
  })

  // Calculate weekly projection
  const weeklyData = new Map<string, number>()
  questions.forEach((q) => {
    const weekStart = new Date(q.createdAt)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const weekKey = weekStart.toISOString().split('T')[0]
    weeklyData.set(weekKey, (weeklyData.get(weekKey) || 0) + 1)
  })

  const weeklyValues = Array.from(weeklyData.values())
  const { slope, intercept } = linearRegression(weeklyValues)

  // Project next 4 weeks
  const weeklyProjection: { week: string; expectedQuestions: number }[] = []
  for (let i = 0; i < 4; i++) {
    const weekDate = new Date()
    weekDate.setDate(weekDate.getDate() + i * 7)
    const predicted = Math.max(0, Math.round(slope * (weeklyValues.length + i) + intercept))
    weeklyProjection.push({
      week: weekDate.toISOString().split('T')[0],
      expectedQuestions: predicted,
    })
  }

  // Determine engagement level
  const avgWeekly = weeklyValues.length > 0
    ? weeklyValues.reduce((a, b) => a + b, 0) / weeklyValues.length
    : 0
  let predictedEngagement: 'high' | 'medium' | 'low'
  if (avgWeekly > 20) predictedEngagement = 'high'
  else if (avgWeekly > 5) predictedEngagement = 'medium'
  else predictedEngagement = 'low'

  // Factors affecting engagement
  const factorsAffecting: string[] = []
  if (slope > 0) factorsAffecting.push('Upward engagement trend')
  if (slope < 0) factorsAffecting.push('Declining engagement - may need refresh')
  if (sortedHours.length > 0) {
    factorsAffecting.push(`Peak activity at ${optimalPostingTimes[0]}`)
  }

  return {
    activityId,
    predictedEngagement,
    optimalPostingTimes,
    factorsAffecting,
    weeklyProjection,
  }
}

// Helper: Get display name from user
function getUserDisplayName(user: { firstName?: string | null; lastName?: string | null; email?: string }): string {
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`
  if (user.firstName) return user.firstName
  if (user.lastName) return user.lastName
  return user.email?.split('@')[0] || 'Student'
}

// Get At-Risk Students
export async function getAtRiskStudents(groupId?: string): Promise<AtRiskStudent[]> {
  // Get all students with their question data
  const whereClause: Record<string, unknown> = {
    createdQuestions: { some: { isDeleted: false } },
  }

  if (groupId) {
    whereClause.createdQuestions = {
      some: {
        isDeleted: false,
        activity: { owningGroupId: groupId },
      },
    }
  }

  const students = await prisma.user.findMany({
    where: whereClause,
    include: {
      createdQuestions: {
        where: { isDeleted: false },
        include: { evaluation: { select: { overallScore: true } } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
    },
    take: 100,
  })

  const atRiskStudents: AtRiskStudent[] = []

  for (const student of students) {
    let riskScore = 0
    const riskFactors: string[] = []

    // Factor 1: Low question count (<3 questions = +30 points)
    if (student.createdQuestions.length < 3) {
      riskScore += 30
      riskFactors.push('Very few questions created')
    } else if (student.createdQuestions.length < 10) {
      riskScore += 15
      riskFactors.push('Limited question activity')
    }

    // Factor 2: Low average quality (<3.0 = +25 points)
    const qualityScores = student.createdQuestions
      .filter((q: { evaluation?: { overallScore: number } | null }) => q.evaluation?.overallScore)
      .map((q: { evaluation?: { overallScore: number } | null }) => q.evaluation!.overallScore)

    const avgQuality =
      qualityScores.length > 0
        ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length
        : 0

    if (avgQuality < 2.5) {
      riskScore += 25
      riskFactors.push('Low question quality average')
    } else if (avgQuality < 3.0) {
      riskScore += 15
      riskFactors.push('Below average question quality')
    }

    // Factor 3: Inactivity (7+ days = +20, 14+ days = +45)
    const lastQuestion = student.createdQuestions[0]
    const lastActivity = lastQuestion?.createdAt || null
    const daysSinceActivity = lastActivity
      ? Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
      : 999

    if (daysSinceActivity >= 14) {
      riskScore += 45
      riskFactors.push(`Inactive for ${daysSinceActivity} days`)
    } else if (daysSinceActivity >= 7) {
      riskScore += 20
      riskFactors.push(`No activity in ${daysSinceActivity} days`)
    }

    // Only include if risk score >= 40
    if (riskScore >= 40) {
      let riskLevel: 'high' | 'medium' | 'low'
      if (riskScore >= 70) riskLevel = 'high'
      else if (riskScore >= 50) riskLevel = 'medium'
      else riskLevel = 'low'

      // Generate intervention suggestion
      let suggestedIntervention: string
      if (riskLevel === 'high') {
        suggestedIntervention = 'Immediate outreach recommended. Consider one-on-one check-in.'
      } else if (riskLevel === 'medium') {
        suggestedIntervention = 'Send encouragement message. Provide guided activity prompts.'
      } else {
        suggestedIntervention = 'Monitor progress. Consider peer collaboration opportunities.'
      }

      atRiskStudents.push({
        studentId: student.id,
        studentName: getUserDisplayName(student),
        riskScore,
        riskLevel,
        riskFactors,
        lastActivity: lastActivity?.toISOString().split('T')[0] || null,
        questionCount: student.createdQuestions.length,
        avgQuality: Math.round(avgQuality * 10) / 10,
        suggestedIntervention,
      })
    }
  }

  return atRiskStudents.sort((a, b) => b.riskScore - a.riskScore)
}

// Get Optimal Timing Analysis
export async function getOptimalTiming(userId: string): Promise<OptimalTiming[]> {
  // Get user's activities through group memberships
  const userGroups = await prisma.groupUser.findMany({
    where: { userId },
    include: { group: { include: { activities: { select: { id: true } } } } },
  })

  const activityIds = userGroups.flatMap((m: { group: { activities: { id: string }[] } }) =>
    m.group.activities.map((a: { id: string }) => a.id)
  )

  if (activityIds.length === 0) return []

  // Get all questions for these activities
  const questions = await prisma.question.findMany({
    where: {
      activityId: { in: activityIds },
      isDeleted: false,
    },
    orderBy: { createdAt: 'desc' },
    take: 1000,
  })

  // Analyze by day and hour
  const timingData = new Map<string, { count: number; engagement: number }>()

  questions.forEach((q) => {
    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][q.createdAt.getDay()]
    const hour = q.createdAt.getHours()
    const key = `${day}-${hour}`

    const existing = timingData.get(key) || { count: 0, engagement: 0 }
    existing.count++
    existing.engagement += 1 // Could be weighted by quality
    timingData.set(key, existing)
  })

  const results: OptimalTiming[] = []
  timingData.forEach((data, key) => {
    const [dayOfWeek, hourStr] = key.split('-')
    results.push({
      dayOfWeek,
      hour: parseInt(hourStr),
      engagementScore: Math.round((data.engagement / data.count) * 100) / 100,
      questionCount: data.count,
    })
  })

  return results.sort((a, b) => b.questionCount - a.questionCount).slice(0, 20)
}

// Get AI-Generated Insights Summary
export async function getInsightsSummary(userId: string): Promise<InsightsSummary | null> {
  // Get user's owned groups and activities
  const ownedGroups = await prisma.group.findMany({
    where: { creatorId: userId },
    include: {
      activities: {
        include: {
          questions: {
            where: { isDeleted: false },
            include: { evaluation: { select: { overallScore: true } } },
            orderBy: { createdAt: 'desc' },
            take: 100,
          },
        },
      },
      members: true,
    },
  })

  if (ownedGroups.length === 0) return null

  // Calculate metrics
  type QuestionWithEval = { createdAt: Date; creatorId: string; evaluation?: { overallScore: number } | null }
  type ActivityWithQuestions = { questions: QuestionWithEval[] }
  type GroupWithActivities = { activities: ActivityWithQuestions[]; members: { userId: string }[] }

  const allQuestions = ownedGroups.flatMap((g: GroupWithActivities) =>
    g.activities.flatMap((a: ActivityWithQuestions) => a.questions)
  )
  const totalMembers = new Set(
    ownedGroups.flatMap((g: GroupWithActivities) => g.members.map((m: { userId: string }) => m.userId))
  ).size

  // Active in last 7 days
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const recentQuestions = allQuestions.filter((q) => q.createdAt >= sevenDaysAgo)
  const activeStudents = new Set(recentQuestions.map((q) => q.creatorId)).size

  const activeStudentRate = totalMembers > 0 ? (activeStudents / totalMembers) * 100 : 0

  // Quality trend
  const qualityScores = allQuestions
    .filter((q) => q.evaluation?.overallScore)
    .map((q) => q.evaluation!.overallScore)

  const avgQuality =
    qualityScores.length > 0
      ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length
      : 0

  // Weekly engagement trend
  const thisWeek = recentQuestions.length
  const prevWeekStart = new Date(sevenDaysAgo)
  prevWeekStart.setDate(prevWeekStart.getDate() - 7)
  const lastWeek = allQuestions.filter(
    (q) => q.createdAt >= prevWeekStart && q.createdAt < sevenDaysAgo
  ).length

  const engagementTrend = lastWeek > 0 ? ((thisWeek - lastWeek) / lastWeek) * 100 : 0

  // Determine overall health
  let overallHealth: 'excellent' | 'good' | 'needs_attention' | 'critical'
  if (activeStudentRate >= 70 && avgQuality >= 3.5) overallHealth = 'excellent'
  else if (activeStudentRate >= 50 && avgQuality >= 3.0) overallHealth = 'good'
  else if (activeStudentRate >= 30 || avgQuality >= 2.5) overallHealth = 'needs_attention'
  else overallHealth = 'critical'

  // Generate AI insights
  const prompt = `Based on these learning analytics, provide 3-4 concise insights and 2-3 recommendations:

Statistics:
- Total students: ${totalMembers}
- Active this week: ${activeStudents} (${Math.round(activeStudentRate)}%)
- Questions this week: ${thisWeek}
- Week-over-week change: ${engagementTrend > 0 ? '+' : ''}${Math.round(engagementTrend)}%
- Average quality: ${avgQuality.toFixed(1)}/5
- Overall health: ${overallHealth}

Provide response as JSON:
{
  "insights": ["insight1", "insight2", ...],
  "recommendations": ["rec1", "rec2", ...]
}`

  try {
    const completion = await getOpenAI().chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    })

    const aiResponse = JSON.parse(completion.choices[0]?.message?.content || '{}')

    return {
      overallHealth,
      keyInsights: aiResponse.insights || [],
      recommendations: aiResponse.recommendations || [],
      metrics: {
        activeStudentRate: Math.round(activeStudentRate * 10) / 10,
        avgQualityTrend: Math.round(avgQuality * 10) / 10,
        engagementTrend: Math.round(engagementTrend * 10) / 10,
      },
    }
  } catch {
    // Fallback without AI
    return {
      overallHealth,
      keyInsights: [
        `${Math.round(activeStudentRate)}% of students active this week`,
        `Average question quality: ${avgQuality.toFixed(1)}/5`,
        `${engagementTrend >= 0 ? 'Positive' : 'Negative'} engagement trend`,
      ],
      recommendations: [
        overallHealth === 'critical' ? 'Consider reaching out to inactive students' : '',
        avgQuality < 3 ? 'Provide question formulation guidance' : '',
      ].filter(Boolean),
      metrics: {
        activeStudentRate: Math.round(activeStudentRate * 10) / 10,
        avgQualityTrend: Math.round(avgQuality * 10) / 10,
        engagementTrend: Math.round(engagementTrend * 10) / 10,
      },
    }
  }
}
