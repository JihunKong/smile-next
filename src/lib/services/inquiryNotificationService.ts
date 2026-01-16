import { prisma } from '@/lib/db/prisma'
import { sendEmail } from './emailService'
import { createNotification } from './notificationService'

interface InquiryResultNotificationData {
  attemptId: string
  recipientEmail?: string
  includeOwner?: boolean
}

interface InquiryAttemptWithDetails {
  id: string
  userId: string
  activityId: string
  questionsGenerated: number
  questionsRequired: number
  status: string
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
    inquirySettings: Record<string, unknown> | null
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

interface QuestionWithEvaluation {
  id: string
  content: string
  questionEvaluationScore: number | null
  evaluation?: {
    overallScore: number
    bloomsLevel: string | null
    evaluationText: string | null
  } | null
}

/**
 * Get inquiry attempt with all related data for notifications
 */
async function getInquiryAttemptDetails(attemptId: string): Promise<InquiryAttemptWithDetails | null> {
  const attempt = await prisma.inquiryAttempt.findUnique({
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
          inquirySettings: true,
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

  return attempt as InquiryAttemptWithDetails | null
}

/**
 * Get questions created during an inquiry attempt with their evaluations
 */
async function getInquiryQuestions(userId: string, activityId: string, startedAt: Date): Promise<QuestionWithEvaluation[]> {
  const questions = await prisma.question.findMany({
    where: {
      creatorId: userId,
      activityId,
      createdAt: { gte: startedAt },
      isDeleted: false,
    },
    select: {
      id: true,
      content: true,
      questionEvaluationScore: true,
      evaluation: {
        select: {
          overallScore: true,
          bloomsLevel: true,
          evaluationText: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  return questions
}

/**
 * Calculate average score and other metrics from questions
 */
function calculateInquiryMetrics(questions: QuestionWithEvaluation[]) {
  const scores = questions
    .filter(q => q.questionEvaluationScore !== null)
    .map(q => q.questionEvaluationScore as number)

  const averageScore = scores.length > 0
    ? scores.reduce((sum, s) => sum + s, 0) / scores.length
    : 0

  const bloomsDistribution = questions
    .filter(q => q.evaluation?.bloomsLevel)
    .reduce((acc, q) => {
      const level = q.evaluation?.bloomsLevel || 'unknown'
      acc[level] = (acc[level] || 0) + 1
      return acc
    }, {} as Record<string, number>)

  return {
    averageScore,
    totalQuestions: questions.length,
    evaluatedQuestions: scores.length,
    bloomsDistribution,
    highestScore: scores.length > 0 ? Math.max(...scores) : 0,
    lowestScore: scores.length > 0 ? Math.min(...scores) : 0,
  }
}

/**
 * Generate HTML email content for inquiry results
 */
function generateInquiryResultEmailHtml(
  attempt: InquiryAttemptWithDetails,
  questions: QuestionWithEvaluation[],
  feedback?: string
): string {
  const { user, activity, questionsGenerated, questionsRequired } = attempt
  const studentName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
  const metrics = calculateInquiryMetrics(questions)
  const completed = questionsGenerated >= questionsRequired
  const statusColor = completed ? '#10B981' : '#F59E0B'
  const statusText = completed ? 'COMPLETED' : 'IN PROGRESS'

  const bloomsColors: Record<string, string> = {
    'Remember': '#6B7280',
    'Understand': '#3B82F6',
    'Apply': '#10B981',
    'Analyze': '#8B5CF6',
    'Evaluate': '#EC4899',
    'Create': '#F59E0B',
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #8B5CF6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; color: white; background: ${statusColor}; }
        .score-box { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .score-value { font-size: 48px; font-weight: bold; color: #8B5CF6; }
        .score-label { color: #666; font-size: 14px; }
        .progress-bar { background: #E5E7EB; border-radius: 10px; height: 20px; margin: 15px 0; overflow: hidden; }
        .progress-fill { background: linear-gradient(90deg, #8B5CF6, #EC4899); height: 100%; border-radius: 10px; transition: width 0.5s; }
        .blooms-chart { margin: 20px 0; }
        .blooms-item { display: flex; align-items: center; margin: 8px 0; }
        .blooms-label { width: 100px; font-size: 12px; }
        .blooms-bar { flex: 1; height: 20px; background: #E5E7EB; border-radius: 4px; overflow: hidden; }
        .blooms-fill { height: 100%; border-radius: 4px; }
        .blooms-count { width: 30px; text-align: right; font-size: 12px; margin-left: 8px; }
        .question-list { margin: 20px 0; }
        .question-item { background: white; border-radius: 8px; padding: 15px; margin: 10px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .question-content { font-weight: 500; margin-bottom: 8px; }
        .question-meta { display: flex; justify-content: space-between; font-size: 12px; color: #666; }
        .feedback { background: #F3E8FF; border-left: 4px solid #8B5CF6; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Inquiry Results</h1>
          <p>${activity.name}</p>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p><strong>${studentName}</strong> has ${completed ? 'completed' : 'made progress on'} the inquiry activity.</p>

          <div style="text-align: center; margin: 20px 0;">
            <span class="status-badge">${statusText}</span>
          </div>

          <div class="score-box">
            <div class="score-value">${metrics.averageScore.toFixed(1)}</div>
            <div class="score-label">Average Score (out of 10)</div>
          </div>

          <div>
            <strong>Progress: ${questionsGenerated} / ${questionsRequired} questions</strong>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${Math.min(100, (questionsGenerated / questionsRequired) * 100)}%"></div>
            </div>
          </div>

          ${Object.keys(metrics.bloomsDistribution).length > 0 ? `
          <div class="blooms-chart">
            <strong>Bloom's Taxonomy Distribution</strong>
            ${Object.entries(metrics.bloomsDistribution).map(([level, count]) => `
              <div class="blooms-item">
                <span class="blooms-label">${level}</span>
                <div class="blooms-bar">
                  <div class="blooms-fill" style="width: ${(count / questions.length) * 100}%; background: ${bloomsColors[level] || '#6B7280'}"></div>
                </div>
                <span class="blooms-count">${count}</span>
              </div>
            `).join('')}
          </div>
          ` : ''}

          ${questions.length > 0 ? `
          <div class="question-list">
            <strong>Questions Created</strong>
            ${questions.slice(0, 5).map(q => `
              <div class="question-item">
                <div class="question-content">${q.content.slice(0, 100)}${q.content.length > 100 ? '...' : ''}</div>
                <div class="question-meta">
                  <span>${q.evaluation?.bloomsLevel || 'Evaluating...'}</span>
                  <span>Score: ${q.questionEvaluationScore?.toFixed(1) || '-'}/10</span>
                </div>
              </div>
            `).join('')}
            ${questions.length > 5 ? `<p style="text-align: center; color: #666;">...and ${questions.length - 5} more questions</p>` : ''}
          </div>
          ` : ''}

          ${feedback ? `
          <div class="feedback">
            <strong>AI Coaching Feedback:</strong>
            <p>${feedback}</p>
          </div>
          ` : ''}

          <p>View detailed results in SMILE to see complete analysis.</p>
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
 * Generate plain text email content for inquiry results
 */
function generateInquiryResultEmailText(
  attempt: InquiryAttemptWithDetails,
  questions: QuestionWithEvaluation[],
  feedback?: string
): string {
  const { user, activity, questionsGenerated, questionsRequired } = attempt
  const studentName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
  const metrics = calculateInquiryMetrics(questions)
  const completed = questionsGenerated >= questionsRequired

  return `
Inquiry Results - ${activity.name}

Student: ${studentName}
Status: ${completed ? 'COMPLETED' : 'IN PROGRESS'}

Average Score: ${metrics.averageScore.toFixed(1)}/10
Progress: ${questionsGenerated} / ${questionsRequired} questions

${Object.keys(metrics.bloomsDistribution).length > 0 ? `
Bloom's Taxonomy Distribution:
${Object.entries(metrics.bloomsDistribution).map(([level, count]) => `  ${level}: ${count}`).join('\n')}
` : ''}

Questions Created:
${questions.slice(0, 5).map((q, i) => `${i + 1}. ${q.content.slice(0, 80)}... (Score: ${q.questionEvaluationScore?.toFixed(1) || '-'}/10)`).join('\n')}
${questions.length > 5 ? `...and ${questions.length - 5} more questions` : ''}

${feedback ? `AI Coaching Feedback:\n${feedback}\n` : ''}

View detailed results in SMILE to see complete analysis.

- SMILE Team
  `
}

/**
 * Send inquiry result notification
 */
export async function sendInquiryResultNotification(data: InquiryResultNotificationData) {
  const { attemptId, recipientEmail, includeOwner = true } = data

  try {
    const attempt = await getInquiryAttemptDetails(attemptId)
    if (!attempt) {
      return { success: false, error: 'Inquiry attempt not found' }
    }

    // Get questions created during this inquiry
    const questions = await getInquiryQuestions(
      attempt.userId,
      attempt.activityId,
      attempt.completedAt || new Date()
    )

    const metrics = calculateInquiryMetrics(questions)
    const completed = attempt.questionsGenerated >= attempt.questionsRequired

    // Get AI coaching feedback if available
    let feedback: string | undefined
    try {
      // Generate summary feedback based on Bloom's distribution
      const highestLevel = Object.entries(metrics.bloomsDistribution)
        .sort((a, b) => b[1] - a[1])[0]

      if (highestLevel) {
        feedback = `Your questions mostly focused on the "${highestLevel[0]}" level of Bloom's Taxonomy. ` +
          (completed
            ? `Great job completing the inquiry! Consider exploring higher-order thinking questions to challenge yourself.`
            : `Keep going to reach your goal of ${attempt.questionsRequired} questions.`)
      }
    } catch {
      // Feedback generation may fail
    }

    const html = generateInquiryResultEmailHtml(attempt, questions, feedback)
    const text = generateInquiryResultEmailText(attempt, questions, feedback)
    const subject = `Inquiry Results: ${attempt.activity.name} - ${completed ? 'Completed' : 'Progress Update'}`

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
      title: completed ? 'Inquiry Completed!' : 'Inquiry Progress',
      message: `${completed ? 'Completed' : 'Progress on'} "${attempt.activity.name}" - Avg Score: ${metrics.averageScore.toFixed(1)}/10`,
      entityType: 'inquiry_attempt',
      entityId: attemptId,
      data: {
        activityId: attempt.activityId,
        averageScore: metrics.averageScore,
        questionsGenerated: attempt.questionsGenerated,
        completed,
      },
    })
    if (studentNotification) notificationsCreated.push(studentNotification.id)

    // Create internal notification for group owner
    if (includeOwner && attempt.activity.owningGroup.creatorId !== attempt.userId) {
      const ownerNotification = await createNotification({
        userId: attempt.activity.owningGroup.creatorId,
        type: 'evaluation_completed',
        title: completed ? 'Student Inquiry Completed' : 'Student Inquiry Progress',
        message: `${attempt.user.firstName || 'A student'} ${completed ? 'completed' : 'made progress on'} "${attempt.activity.name}"`,
        entityType: 'inquiry_attempt',
        entityId: attemptId,
        data: {
          studentId: attempt.userId,
          studentName: `${attempt.user.firstName || ''} ${attempt.user.lastName || ''}`.trim(),
          activityId: attempt.activityId,
          averageScore: metrics.averageScore,
          questionsGenerated: attempt.questionsGenerated,
          completed,
        },
      })
      if (ownerNotification) notificationsCreated.push(ownerNotification.id)
    }

    return {
      success: true,
      emailsSent,
      notificationsCreated,
      attemptId,
      averageScore: metrics.averageScore,
      questionsGenerated: attempt.questionsGenerated,
      completed,
    }
  } catch (error) {
    console.error('[InquiryNotificationService] Failed to send notification:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send bulk inquiry notifications for all attempts in an activity
 */
export async function sendBulkInquiryNotifications(activityId: string) {
  try {
    const attempts = await prisma.inquiryAttempt.findMany({
      where: { activityId },
      select: { id: true },
    })

    const results = await Promise.all(
      attempts.map(attempt => sendInquiryResultNotification({ attemptId: attempt.id }))
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
    console.error('[InquiryNotificationService] Failed to send bulk notifications:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
