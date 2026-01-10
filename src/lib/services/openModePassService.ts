import { prisma } from '@/lib/db/prisma'

// Bloom's level string to number mapping
const BLOOM_LEVEL_MAP: Record<string, number> = {
  'remember': 1,
  'understand': 2,
  'apply': 3,
  'analyze': 4,
  'evaluate': 5,
  'create': 6,
}

function bloomLevelToNumber(level: string | null | undefined): number {
  if (!level) return 0

  const normalizedLevel = level.toLowerCase()

  // Direct match
  if (BLOOM_LEVEL_MAP[normalizedLevel]) {
    return BLOOM_LEVEL_MAP[normalizedLevel]
  }

  // Substring match (e.g., "Level 4 (Analyze)" contains "analyze")
  for (const [key, value] of Object.entries(BLOOM_LEVEL_MAP)) {
    if (normalizedLevel.includes(key)) {
      return value
    }
  }

  return 0
}

function average(numbers: number[]): number {
  if (numbers.length === 0) return 0
  const validNumbers = numbers.filter(n => n > 0)
  if (validNumbers.length === 0) return 0
  return validNumbers.reduce((a, b) => a + b, 0) / validNumbers.length
}

export interface OpenModeSettings {
  is_pass_fail_enabled?: boolean
  required_question_count?: number
  required_avg_level?: number
  required_avg_score?: number
  peer_ratings_required?: number
  peer_responses_required?: number
  instructions?: string
}

export interface StudentProgress {
  status: 'passed' | 'in_progress' | 'not_started'
  hasPassed: boolean
  current: {
    questionCount: number
    avgLevel: number
    avgScore: number
    peerRatingsGiven: number
    peerResponsesGiven: number
  }
  required: {
    questionCount: number
    avgLevel: number
    avgScore: number
    peerRatingsRequired: number
    peerResponsesRequired: number
  }
  progress: {
    questionsMet: boolean
    levelMet: boolean
    scoreMet: boolean
    peerRatingsMet: boolean
    peerResponsesMet: boolean
    noPeersAvailable: boolean
  }
}

export async function calculateStudentProgress(
  activityId: string,
  studentId: string
): Promise<StudentProgress | null> {
  // 1. Get activity and check settings
  const activity = await prisma.activity.findUnique({
    where: { id: activityId, isDeleted: false },
    select: {
      mode: true,
      openModeSettings: true,
    },
  })

  if (!activity || activity.mode !== 0) {
    return null
  }

  const settings = activity.openModeSettings as OpenModeSettings | null
  if (!settings?.is_pass_fail_enabled) {
    return null
  }

  // 2. Get student's questions with evaluations
  const questions = await prisma.question.findMany({
    where: {
      activityId,
      creatorId: studentId,
      isDeleted: false,
    },
    include: {
      evaluation: {
        select: {
          bloomsLevel: true,
          overallScore: true,
        },
      },
    },
  })

  // 3. Calculate current stats
  const questionCount = questions.length

  const levels = questions
    .map(q => bloomLevelToNumber(q.evaluation?.bloomsLevel))
    .filter(l => l > 0)
  const avgLevel = average(levels)

  const scores = questions
    .map(q => q.evaluation?.overallScore || 0)
    .filter(s => s > 0)
  const avgScore = average(scores)

  // 4. Get peer questions (questions not created by this student)
  const peerQuestions = await prisma.question.findMany({
    where: {
      activityId,
      creatorId: { not: studentId },
      isDeleted: false,
    },
    select: {
      id: true,
      reviews: true, // JSONB array of reviews
    },
  })

  const peerQuestionIds = peerQuestions.map(q => q.id)
  const noPeersAvailable = peerQuestionIds.length === 0

  // 5. Count peer ratings given
  let peerRatingsGiven = 0
  for (const question of peerQuestions) {
    const reviews = question.reviews as Array<{ user?: string; rating?: number }> | null
    if (reviews && Array.isArray(reviews)) {
      const hasRated = reviews.some(r => r.user === studentId && r.rating)
      if (hasRated) peerRatingsGiven++
    }
  }

  // 6. Count peer responses given
  const peerResponsesGiven = await prisma.response.count({
    where: {
      creatorId: studentId,
      questionId: { in: peerQuestionIds },
      isDeleted: false,
    },
  })

  // 7. Get required values
  const required = {
    questionCount: settings.required_question_count || 1,
    avgLevel: settings.required_avg_level || 2.0,
    avgScore: settings.required_avg_score || 5.0,
    peerRatingsRequired: settings.peer_ratings_required || 0,
    peerResponsesRequired: settings.peer_responses_required || 0,
  }

  // 8. Calculate progress
  const progress = {
    questionsMet: questionCount >= required.questionCount,
    levelMet: avgLevel >= required.avgLevel,
    scoreMet: avgScore >= required.avgScore,
    peerRatingsMet: required.peerRatingsRequired === 0 ||
      (noPeersAvailable ? true : peerRatingsGiven >= required.peerRatingsRequired),
    peerResponsesMet: required.peerResponsesRequired === 0 ||
      (noPeersAvailable ? true : peerResponsesGiven >= required.peerResponsesRequired),
    noPeersAvailable,
  }

  // 9. Determine pass status
  const hasPassed = progress.questionsMet &&
    progress.levelMet &&
    progress.scoreMet &&
    progress.peerRatingsMet &&
    progress.peerResponsesMet

  const status: 'passed' | 'in_progress' | 'not_started' =
    hasPassed ? 'passed' :
    questionCount > 0 ? 'in_progress' :
    'not_started'

  return {
    status,
    hasPassed,
    current: {
      questionCount,
      avgLevel: Math.round(avgLevel * 10) / 10,
      avgScore: Math.round(avgScore * 10) / 10,
      peerRatingsGiven,
      peerResponsesGiven,
    },
    required,
    progress,
  }
}

export async function getAllStudentsProgress(activityId: string): Promise<Array<{
  studentId: string
  studentName: string
  status: StudentProgress['status']
  hasPassed: boolean
  current: StudentProgress['current']
}>> {
  // Get all students who posted questions in this activity
  const questions = await prisma.question.findMany({
    where: {
      activityId,
      isDeleted: false,
    },
    select: {
      creatorId: true,
      creator: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    distinct: ['creatorId'],
  })

  const results = []

  for (const q of questions) {
    const progress = await calculateStudentProgress(activityId, q.creatorId)
    if (progress) {
      results.push({
        studentId: q.creatorId,
        studentName: `${q.creator.firstName || ''} ${q.creator.lastName || ''}`.trim() || 'Unknown',
        status: progress.status,
        hasPassed: progress.hasPassed,
        current: progress.current,
      })
    }
  }

  return results
}
