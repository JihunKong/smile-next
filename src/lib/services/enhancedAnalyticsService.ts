import { prisma } from '@/lib/db/prisma'

export interface AnalyticsFilters {
  startDate?: string
  endDate?: string
  activityIds?: string[]
  studentIds?: string[]
  minQuality?: number
  maxQuality?: number
  keywords?: string[]
}

interface TimeDistribution {
  peakHours: { hour: number; count: number }[]
  activeDays: { day: string; count: number }[]
  hourDistribution: Record<number, number>
  dayDistribution: Record<string, number>
}

interface ActivityBreakdown {
  [activityName: string]: {
    questionCount: number
    averageQuality: number
  }
}

interface StudentPerformance {
  studentName: string
  studentEmail: string
  questionCount: number
  avgQuality: number
  totalResponses: number
}

interface TimeTrend {
  week: string
  questionCount: number
  averageQuality: number
}

interface KeywordAnalysis {
  list1: Record<string, number>
  list2: Record<string, number>
  totalUsage: number
}

// Helper function to parse date strings
function parseDate(dateStr: string | undefined): Date | null {
  if (!dateStr) return null
  try {
    return new Date(dateStr)
  } catch {
    return null
  }
}

// Get filtered student analytics
export async function getFilteredStudentAnalytics(userId: string, filters: AnalyticsFilters = {}) {
  const startDate = parseDate(filters.startDate)
  const endDate = parseDate(filters.endDate)

  const whereClause: Record<string, unknown> = {
    creatorId: userId,
    isDeleted: false,
  }

  if (startDate) {
    whereClause.createdAt = { ...(whereClause.createdAt as object || {}), gte: startDate }
  }
  if (endDate) {
    whereClause.createdAt = { ...(whereClause.createdAt as object || {}), lte: endDate }
  }
  if (filters.activityIds?.length) {
    whereClause.activityId = { in: filters.activityIds }
  }
  if (filters.minQuality !== undefined || filters.maxQuality !== undefined) {
    whereClause.evaluation = {
      ...(whereClause.evaluation as object || {}),
      path: ['overall_score'],
      ...(filters.minQuality !== undefined && { gte: filters.minQuality }),
      ...(filters.maxQuality !== undefined && { lte: filters.maxQuality }),
    }
  }

  const questions = await prisma.question.findMany({
    where: whereClause,
    include: {
      activity: { select: { name: true } },
      responses: { where: { isDeleted: false } },
      evaluation: { select: { overallScore: true } },
    },
  })

  // Calculate metrics
  const totalQuestions = questions.length
  const totalResponses = questions.reduce((sum, q) => sum + q.responses.length, 0)

  // Calculate average quality
  let totalQuality = 0
  let qualityCount = 0
  for (const q of questions) {
    if (q.evaluation?.overallScore) {
      totalQuality += q.evaluation.overallScore
      qualityCount++
    }
  }
  const averageQuality = qualityCount > 0 ? totalQuality / qualityCount : 0

  // Analyze time distribution
  const timeDistribution = analyzeTimeDistribution(questions)

  // Analyze activity breakdown
  const activityBreakdown = analyzeActivityBreakdown(questions.map(q => ({
    activity: q.activity,
    overallScore: q.evaluation?.overallScore || 0,
  })))

  // Analyze keyword usage - simplified since we don't have keyword data in the relation
  const keywordsAnalysis = { list1: {}, list2: {}, totalUsage: 0 }

  return {
    totalQuestions,
    averageQuality: Math.round(averageQuality * 100) / 100,
    totalResponses,
    keywordsAnalysis,
    timeDistribution,
    activityBreakdown,
    filtersApplied: filters,
  }
}

// Get filtered activity analytics
export async function getFilteredActivityAnalytics(activityId: string, filters: AnalyticsFilters = {}) {
  const startDate = parseDate(filters.startDate)
  const endDate = parseDate(filters.endDate)

  const whereClause: Record<string, unknown> = {
    activityId,
    isDeleted: false,
  }

  if (startDate) {
    whereClause.createdAt = { ...(whereClause.createdAt as object || {}), gte: startDate }
  }
  if (endDate) {
    whereClause.createdAt = { ...(whereClause.createdAt as object || {}), lte: endDate }
  }
  if (filters.studentIds?.length) {
    whereClause.creatorId = { in: filters.studentIds }
  }

  const questions = await prisma.question.findMany({
    where: whereClause,
    include: {
      creator: { select: { id: true, username: true, email: true, firstName: true, lastName: true } },
      responses: { where: { isDeleted: false } },
      evaluation: { select: { overallScore: true } },
    },
  })

  // Get unique students
  const studentMap = new Map<string, StudentPerformance>()

  for (const q of questions) {
    const studentId = q.creatorId
    const studentName = q.creator?.username || `${q.creator?.firstName || ''} ${q.creator?.lastName || ''}`.trim() || 'Unknown'
    const studentEmail = q.creator?.email || ''
    const quality = q.evaluation?.overallScore || 0

    if (!studentMap.has(studentId)) {
      studentMap.set(studentId, {
        studentName,
        studentEmail,
        questionCount: 0,
        avgQuality: 0,
        totalResponses: 0,
      })
    }

    const student = studentMap.get(studentId)!
    student.questionCount++
    student.avgQuality = (student.avgQuality * (student.questionCount - 1) + quality) / student.questionCount
    student.totalResponses += q.responses.length
  }

  const studentPerformance = Array.from(studentMap.values())
    .sort((a, b) => b.avgQuality - a.avgQuality)

  // Analyze time trends (weekly)
  const timeTrends = analyzeTimeTrends(questions.map(q => ({
    createdAt: q.createdAt,
    overallScore: q.evaluation?.overallScore || 0,
  })))

  // Analyze keyword usage - simplified
  const keywordUsage = { list1: {}, list2: {}, totalUsage: 0 }

  return {
    totalQuestions: questions.length,
    activeStudents: studentMap.size,
    averageQuality: Math.round(
      studentPerformance.reduce((sum, s) => sum + s.avgQuality, 0) / (studentPerformance.length || 1) * 100
    ) / 100,
    totalResponses: questions.reduce((sum, q) => sum + q.responses.length, 0),
    studentPerformance,
    keywordUsage,
    timeTrends,
    filtersApplied: filters,
  }
}

// Get comparative analytics
export async function getComparativeAnalytics(
  comparisonType: 'activities' | 'groups' | 'time_periods',
  ids: string[],
  filters: AnalyticsFilters = {}
) {
  const results: Array<{
    id: string
    name: string
    totalQuestions: number
    averageQuality: number
    totalStudents: number
  }> = []

  if (comparisonType === 'activities') {
    for (const activityId of ids) {
      const activity = await prisma.activity.findUnique({
        where: { id: activityId },
        select: { name: true },
      })

      if (!activity) continue

      const questions = await prisma.question.findMany({
        where: { activityId, isDeleted: false },
        include: { responses: true, evaluation: { select: { overallScore: true } } },
      })

      const uniqueStudents = new Set(questions.map((q) => q.creatorId))
      let totalQuality = 0
      let qualityCount = 0

      for (const q of questions) {
        if (q.evaluation?.overallScore) {
          totalQuality += q.evaluation.overallScore
          qualityCount++
        }
      }

      results.push({
        id: activityId,
        name: activity.name,
        totalQuestions: questions.length,
        averageQuality: qualityCount > 0 ? Math.round((totalQuality / qualityCount) * 100) / 100 : 0,
        totalStudents: uniqueStudents.size,
      })
    }
  } else if (comparisonType === 'groups') {
    for (const groupId of ids) {
      const group = await prisma.group.findUnique({
        where: { id: groupId },
        select: { name: true },
      })

      if (!group) continue

      const questions = await prisma.question.findMany({
        where: {
          activity: { owningGroupId: groupId },
          isDeleted: false,
        },
        include: { evaluation: { select: { overallScore: true } } },
      })

      const uniqueStudents = new Set(questions.map((q) => q.creatorId))
      let totalQuality = 0
      let qualityCount = 0

      for (const q of questions) {
        if (q.evaluation?.overallScore) {
          totalQuality += q.evaluation.overallScore
          qualityCount++
        }
      }

      results.push({
        id: groupId,
        name: group.name,
        totalQuestions: questions.length,
        averageQuality: qualityCount > 0 ? Math.round((totalQuality / qualityCount) * 100) / 100 : 0,
        totalStudents: uniqueStudents.size,
      })
    }
  }

  // Generate summary
  const summary = generateComparisonSummary(results)

  return {
    comparisonType,
    results,
    summary,
  }
}

// Get keyword analytics
export async function getKeywordAnalytics(
  scopeType: 'student' | 'activity' | 'group',
  scopeId: string,
  filters: AnalyticsFilters = {}
) {
  const startDate = parseDate(filters.startDate)
  const endDate = parseDate(filters.endDate)

  let whereClause: Record<string, unknown> = { isDeleted: false }

  if (scopeType === 'student') {
    whereClause.creatorId = scopeId
  } else if (scopeType === 'activity') {
    whereClause.activityId = scopeId
  } else if (scopeType === 'group') {
    whereClause.activity = { owningGroupId: scopeId }
  }

  if (startDate) {
    whereClause.createdAt = { ...(whereClause.createdAt as object || {}), gte: startDate }
  }
  if (endDate) {
    whereClause.createdAt = { ...(whereClause.createdAt as object || {}), lte: endDate }
  }

  const questions = await prisma.question.findMany({
    where: whereClause,
    select: {
      content: true,
      createdAt: true,
      prompterKeywordsUsed: true,
      evaluation: { select: { overallScore: true } },
    },
  })

  // Analyze keywords from content
  const keywordFrequency: Record<string, number> = {}
  const keywordEffectiveness: Record<string, { total: number; count: number }> = {}
  const list1Usage: Record<string, number> = {}
  const list2Usage: Record<string, number> = {}

  let totalKeywordsUsed = 0
  let questionsWithKeywords = 0

  for (const q of questions) {
    // Use prompterKeywordsUsed if available
    const keywords = q.prompterKeywordsUsed || []

    if (keywords.length > 0) {
      questionsWithKeywords++
      for (const keyword of keywords) {
        keywordFrequency[keyword] = (keywordFrequency[keyword] || 0) + 1
        totalKeywordsUsed++

        if (q.evaluation?.overallScore) {
          if (!keywordEffectiveness[keyword]) {
            keywordEffectiveness[keyword] = { total: 0, count: 0 }
          }
          keywordEffectiveness[keyword].total += q.evaluation.overallScore
          keywordEffectiveness[keyword].count++
        }
      }
    }
  }

  // Sort by frequency (top 15)
  const sortedFrequency = Object.entries(keywordFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {} as Record<string, number>)

  // Calculate effectiveness (top 10)
  const sortedEffectiveness = Object.entries(keywordEffectiveness)
    .map(([k, v]) => ({ keyword: k, avgQuality: v.total / v.count }))
    .sort((a, b) => b.avgQuality - a.avgQuality)
    .slice(0, 10)
    .reduce((acc, item) => ({ ...acc, [item.keyword]: Math.round(item.avgQuality * 100) / 100 }), {} as Record<string, number>)

  // Generate recommendations
  const recommendations = generateKeywordRecommendations(sortedFrequency, sortedEffectiveness)

  return {
    totalKeywordsUsed,
    totalQuestionsWithKeywords: questionsWithKeywords,
    keywordFrequency: sortedFrequency,
    keywordEffectiveness: sortedEffectiveness,
    list1Usage,
    list2Usage,
    recommendations,
  }
}

// Get user questions journey
export async function getUserQuestionsJourney(userId: string, limit: number = 50) {
  const questions = await prisma.question.findMany({
    where: {
      creatorId: userId,
      isDeleted: false,
      // Filter out AI-generated questions (content <= 200 chars, not starting with typical AI patterns)
      content: { not: { startsWith: 'AI:' } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      activity: { select: { name: true, owningGroup: { select: { name: true } } } },
      responses: { where: { isDeleted: false }, select: { id: true } },
      evaluation: { select: { overallScore: true, bloomsLevel: true } },
    },
  })

  // Filter to get one best question per group-activity combination
  const bestQuestions = new Map<string, typeof questions[0]>()

  for (const q of questions) {
    const key = `${q.activity.owningGroup?.name || 'unknown'}-${q.activity.name}`
    const existing = bestQuestions.get(key)

    if (!existing || (q.evaluation?.overallScore || 0) > (existing.evaluation?.overallScore || 0)) {
      bestQuestions.set(key, q)
    }
  }

  const journey = Array.from(bestQuestions.values()).map((q) => {
    return {
      id: q.id,
      content: q.content.slice(0, 200),
      quality: q.evaluation?.overallScore || 0,
      bloomLevel: q.evaluation?.bloomsLevel || 'Unknown',
      activityName: q.activity.name,
      groupName: q.activity.owningGroup?.name || 'Unknown',
      responseCount: q.responses.length,
      createdAt: q.createdAt.toISOString(),
    }
  })

  // Calculate timeline stats
  const avgQuality = journey.length > 0
    ? journey.reduce((sum, q) => sum + q.quality, 0) / journey.length
    : 0

  return {
    questions: journey,
    stats: {
      totalQuestions: journey.length,
      averageQuality: Math.round(avgQuality * 100) / 100,
      totalResponses: journey.reduce((sum, q) => sum + q.responseCount, 0),
    },
  }
}

// Get filter options for UI
export async function getFilterOptions(userId: string) {
  // Get user's activities
  const activities = await prisma.activity.findMany({
    where: {
      OR: [
        { creatorId: userId },
        { owningGroup: { members: { some: { userId } } } },
      ],
      isDeleted: false,
    },
    select: {
      id: true,
      name: true,
      owningGroup: { select: { name: true } },
    },
    take: 100,
  })

  // Get user's groups
  const groups = await prisma.group.findMany({
    where: {
      members: { some: { userId } },
      isDeleted: false,
    },
    select: {
      id: true,
      name: true,
      description: true,
    },
    take: 50,
  })

  return {
    activities: activities.map((a) => ({
      id: a.id,
      name: a.name,
      groupName: a.owningGroup?.name || 'Unknown',
    })),
    groups: groups.map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description || '',
    })),
    qualityLevels: [
      { value: 1, label: '1 Star - Needs Improvement' },
      { value: 2, label: '2 Stars - Below Average' },
      { value: 3, label: '3 Stars - Average' },
      { value: 4, label: '4 Stars - Good' },
      { value: 5, label: '5 Stars - Excellent' },
    ],
    timeRanges: [
      { value: '7', label: 'Last 7 days' },
      { value: '30', label: 'Last 30 days' },
      { value: '90', label: 'Last 90 days' },
      { value: '365', label: 'Last year' },
      { value: 'custom', label: 'Custom range' },
    ],
  }
}

// Helper: Analyze time distribution
function analyzeTimeDistribution(questions: Array<{ createdAt: Date }>): TimeDistribution {
  const hourDistribution: Record<number, number> = {}
  const dayDistribution: Record<string, number> = {}
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  for (const q of questions) {
    const hour = q.createdAt.getHours()
    const day = days[q.createdAt.getDay()]

    hourDistribution[hour] = (hourDistribution[hour] || 0) + 1
    dayDistribution[day] = (dayDistribution[day] || 0) + 1
  }

  const peakHours = Object.entries(hourDistribution)
    .map(([hour, count]) => ({ hour: parseInt(hour), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)

  const activeDays = Object.entries(dayDistribution)
    .map(([day, count]) => ({ day, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)

  return { peakHours, activeDays, hourDistribution, dayDistribution }
}

// Helper: Analyze activity breakdown
function analyzeActivityBreakdown(
  questions: Array<{ activity: { name: string }; overallScore: number }>
): ActivityBreakdown {
  const breakdown: ActivityBreakdown = {}

  for (const q of questions) {
    const activityName = q.activity.name
    const quality = q.overallScore

    if (!breakdown[activityName]) {
      breakdown[activityName] = { questionCount: 0, averageQuality: 0 }
    }

    const count = breakdown[activityName].questionCount + 1
    breakdown[activityName].averageQuality =
      (breakdown[activityName].averageQuality * breakdown[activityName].questionCount + quality) / count
    breakdown[activityName].questionCount = count
  }

  return breakdown
}

// Helper: Analyze keyword usage
function analyzeKeywordUsage(questions: Array<{ evaluation: unknown }>): KeywordAnalysis {
  const list1: Record<string, number> = {}
  const list2: Record<string, number> = {}
  let totalUsage = 0

  for (const q of questions) {
    const evaluation = q.evaluation as {
      keyword_list1?: string[]
      keyword_list2?: string[]
    } | null

    if (evaluation?.keyword_list1) {
      for (const kw of evaluation.keyword_list1) {
        list1[kw] = (list1[kw] || 0) + 1
        totalUsage++
      }
    }
    if (evaluation?.keyword_list2) {
      for (const kw of evaluation.keyword_list2) {
        list2[kw] = (list2[kw] || 0) + 1
        totalUsage++
      }
    }
  }

  return { list1, list2, totalUsage }
}

// Helper: Analyze time trends (weekly)
function analyzeTimeTrends(questions: Array<{ createdAt: Date; overallScore: number }>): TimeTrend[] {
  const weeklyData = new Map<string, { questions: number; totalQuality: number; qualityCount: number }>()

  for (const q of questions) {
    const weekStart = getWeekStart(q.createdAt)
    const weekKey = weekStart.toISOString().split('T')[0]

    if (!weeklyData.has(weekKey)) {
      weeklyData.set(weekKey, { questions: 0, totalQuality: 0, qualityCount: 0 })
    }

    const week = weeklyData.get(weekKey)!
    week.questions++
    if (q.overallScore > 0) {
      week.totalQuality += q.overallScore
      week.qualityCount++
    }
  }

  return Array.from(weeklyData.entries())
    .map(([week, data]) => ({
      week,
      questionCount: data.questions,
      averageQuality: data.qualityCount > 0 ? Math.round((data.totalQuality / data.qualityCount) * 100) / 100 : 0,
    }))
    .sort((a, b) => a.week.localeCompare(b.week))
}

// Helper: Get week start date
function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day
  return new Date(d.setDate(diff))
}

// Helper: Generate comparison summary
function generateComparisonSummary(
  results: Array<{ name: string; averageQuality: number; totalQuestions: number }>
) {
  if (results.length === 0) {
    return { bestPerformer: null, worstPerformer: null, totalQuestionsCompared: 0, overallAvgQuality: 0 }
  }

  const sorted = [...results].sort((a, b) => b.averageQuality - a.averageQuality)
  const totalQuestions = results.reduce((sum, r) => sum + r.totalQuestions, 0)
  const overallAvgQuality = totalQuestions > 0
    ? results.reduce((sum, r) => sum + r.averageQuality * r.totalQuestions, 0) / totalQuestions
    : 0

  return {
    bestPerformer: sorted[0]?.name || null,
    worstPerformer: sorted[sorted.length - 1]?.name || null,
    totalQuestionsCompared: totalQuestions,
    overallAvgQuality: Math.round(overallAvgQuality * 100) / 100,
    qualityRange: {
      min: sorted[sorted.length - 1]?.averageQuality || 0,
      max: sorted[0]?.averageQuality || 0,
    },
  }
}

// Helper: Generate keyword recommendations
function generateKeywordRecommendations(
  frequency: Record<string, number>,
  effectiveness: Record<string, number>
) {
  const recommendations: Array<{ type: string; keyword: string; message: string }> = []

  // Find underused but effective keywords
  for (const [keyword, avgQuality] of Object.entries(effectiveness)) {
    if (avgQuality >= 4.0 && (frequency[keyword] || 0) < 5) {
      recommendations.push({
        type: 'underused_effective',
        keyword,
        message: `"${keyword}" produces high-quality questions (avg ${avgQuality}) but is rarely used. Consider using it more often.`,
      })
    }
  }

  // Find overused but ineffective keywords
  for (const [keyword, count] of Object.entries(frequency)) {
    const quality = effectiveness[keyword] || 0
    if (count > 10 && quality < 2.5) {
      recommendations.push({
        type: 'overused_ineffective',
        keyword,
        message: `"${keyword}" is frequently used but produces lower quality questions. Try combining with other keywords.`,
      })
    }
  }

  return recommendations.slice(0, 5)
}
