import { prisma } from '@/lib/db/prisma'
import { sendEmail } from './emailService'
import { createNotification } from './notificationService'

interface ExamResultNotificationData {
  attemptId: string
  recipientEmail?: string
  includeOwner?: boolean
}

interface ExamAttemptWithDetails {
  id: string
  userId: string
  activityId: string
  score: number | null
  passed: boolean | null
  totalQuestions: number
  correctAnswers: number
  completedAt: Date | null
  user: {
    id: string
    email: string
    firstName: string | null
    lastName: string | null
  }
  activity: {
    id: string
    name: string
    examSettings: Record<string, unknown> | null
    owningGroup: {
      id: string
      name: string
      creatorId: string
      creator: {
        id: string
        email: string
        firstName: string | null
        lastName: string | null
      }
    }
  }
}

/**
 * Get exam attempt with all related data for notifications
 */
async function getExamAttemptDetails(attemptId: string): Promise<ExamAttemptWithDetails | null> {
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      activity: {
        select: {
          id: true,
          name: true,
          examSettings: true,
          owningGroup: {
            select: {
              id: true,
              name: true,
              creatorId: true,
              creator: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      },
    },
  })

  return attempt as ExamAttemptWithDetails | null
}

/**
 * Generate HTML email content for exam results
 */
function generateExamResultEmailHtml(attempt: ExamAttemptWithDetails, feedback?: string): string {
  const { user, activity, score, passed, totalQuestions, correctAnswers } = attempt
  const studentName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
  const passingScore = ((activity.examSettings as Record<string, unknown>)?.passing_score as number) || 70
  const statusColor = passed ? '#10B981' : '#EF4444'
  const statusText = passed ? 'PASSED' : 'NEEDS IMPROVEMENT'

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; color: white; background: ${statusColor}; }
        .score-box { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .score-value { font-size: 48px; font-weight: bold; color: ${statusColor}; }
        .score-label { color: #666; font-size: 14px; }
        .stats { display: flex; justify-content: space-around; margin: 20px 0; }
        .stat { text-align: center; }
        .stat-value { font-size: 24px; font-weight: bold; color: #4F46E5; }
        .stat-label { color: #666; font-size: 12px; }
        .feedback { background: #EFF6FF; border-left: 4px solid #3B82F6; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Exam Results</h1>
          <p>${activity.name}</p>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p><strong>${studentName}</strong> has completed the exam.</p>

          <div style="text-align: center; margin: 20px 0;">
            <span class="status-badge">${statusText}</span>
          </div>

          <div class="score-box">
            <div class="score-value">${score?.toFixed(1) || 0}%</div>
            <div class="score-label">Score (Passing: ${passingScore}%)</div>
          </div>

          <div class="stats">
            <div class="stat">
              <div class="stat-value">${correctAnswers}</div>
              <div class="stat-label">Correct</div>
            </div>
            <div class="stat">
              <div class="stat-value">${totalQuestions - correctAnswers}</div>
              <div class="stat-label">Incorrect</div>
            </div>
            <div class="stat">
              <div class="stat-value">${totalQuestions}</div>
              <div class="stat-label">Total</div>
            </div>
          </div>

          ${feedback ? `
          <div class="feedback">
            <strong>AI Coaching Feedback:</strong>
            <p>${feedback}</p>
          </div>
          ` : ''}

          <p>View detailed results in SMILE to see question-by-question breakdown.</p>
        </div>
        <div class="footer">
          <p>SMILE - Seeds of Empowerment</p>
        </div>
      </div>
    </body>
    </html>
  `
}

/**
 * Generate plain text email content for exam results
 */
function generateExamResultEmailText(attempt: ExamAttemptWithDetails, feedback?: string): string {
  const { user, activity, score, passed, totalQuestions, correctAnswers } = attempt
  const studentName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
  const passingScore = ((activity.examSettings as Record<string, unknown>)?.passing_score as number) || 70
  const statusText = passed ? 'PASSED' : 'NEEDS IMPROVEMENT'

  return `
Exam Results - ${activity.name}

Student: ${studentName}
Status: ${statusText}

Score: ${score?.toFixed(1) || 0}% (Passing: ${passingScore}%)
Correct: ${correctAnswers} / ${totalQuestions}

${feedback ? `AI Coaching Feedback:\n${feedback}\n` : ''}

View detailed results in SMILE to see question-by-question breakdown.

- SMILE Team
  `
}

/**
 * Send exam result notification
 */
export async function sendExamResultNotification(data: ExamResultNotificationData) {
  const { attemptId, recipientEmail, includeOwner = true } = data

  try {
    const attempt = await getExamAttemptDetails(attemptId)
    if (!attempt) {
      return { success: false, error: 'Exam attempt not found' }
    }

    // Get AI coaching feedback if available
    let feedback: string | undefined
    try {
      const { generateExamCoachingFeedback } = await import('./examCoachingService')
      const coachingResult = await generateExamCoachingFeedback(attemptId, attempt.userId)
      if (coachingResult?.sections) {
        feedback = coachingResult.sections.map(s => s.content).join('\n\n')
      }
    } catch {
      // Coaching service may not be available
    }

    const html = generateExamResultEmailHtml(attempt, feedback)
    const text = generateExamResultEmailText(attempt, feedback)
    const subject = `Exam Results: ${attempt.activity.name} - ${attempt.passed ? 'Passed' : 'Needs Improvement'}`

    const emailsSent: string[] = []
    const notificationsCreated: string[] = []

    // Send to specified recipient
    if (recipientEmail) {
      const sent = await sendEmail({ to: recipientEmail, subject, text, html })
      if (sent) emailsSent.push(recipientEmail)
    }

    // Send to group owner if requested
    if (includeOwner && attempt.activity.owningGroup.creator.email !== recipientEmail) {
      const ownerEmail = attempt.activity.owningGroup.creator.email
      const sent = await sendEmail({ to: ownerEmail, subject, text, html })
      if (sent) emailsSent.push(ownerEmail)
    }

    // Create internal notification for student
    const studentNotification = await createNotification({
      userId: attempt.userId,
      type: 'evaluation_completed',
      title: `Exam Results: ${attempt.passed ? 'Passed!' : 'Keep Trying!'}`,
      message: `Your score on "${attempt.activity.name}": ${attempt.score?.toFixed(1)}%`,
      entityType: 'exam_attempt',
      entityId: attemptId,
      data: {
        activityId: attempt.activityId,
        score: attempt.score,
        passed: attempt.passed,
      },
    })
    if (studentNotification) notificationsCreated.push(studentNotification.id)

    // Create internal notification for group owner
    if (includeOwner && attempt.activity.owningGroup.creatorId !== attempt.userId) {
      const ownerNotification = await createNotification({
        userId: attempt.activity.owningGroup.creatorId,
        type: 'evaluation_completed',
        title: 'Student Exam Completed',
        message: `${attempt.user.firstName || 'A student'} completed "${attempt.activity.name}" with ${attempt.score?.toFixed(1)}%`,
        entityType: 'exam_attempt',
        entityId: attemptId,
        data: {
          studentId: attempt.userId,
          studentName: `${attempt.user.firstName || ''} ${attempt.user.lastName || ''}`.trim(),
          activityId: attempt.activityId,
          score: attempt.score,
          passed: attempt.passed,
        },
      })
      if (ownerNotification) notificationsCreated.push(ownerNotification.id)
    }

    return {
      success: true,
      emailsSent,
      notificationsCreated,
      attemptId,
      score: attempt.score,
      passed: attempt.passed,
    }
  } catch (error) {
    console.error('[ExamNotificationService] Failed to send notification:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send bulk exam notifications for all completed attempts in an activity
 */
export async function sendBulkExamNotifications(activityId: string) {
  try {
    const attempts = await prisma.examAttempt.findMany({
      where: {
        activityId,
        status: 'completed',
      },
      select: { id: true },
    })

    const results = await Promise.all(
      attempts.map(attempt => sendExamResultNotification({ attemptId: attempt.id }))
    )

    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    return {
      success: true,
      total: attempts.length,
      successful,
      failed,
    }
  } catch (error) {
    console.error('[ExamNotificationService] Failed to send bulk notifications:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
