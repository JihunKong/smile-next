import { prisma } from '@/lib/db/prisma'

export type NotificationType =
  | 'question_liked'
  | 'question_responded'
  | 'response_liked'
  | 'comment_added'
  | 'badge_earned'
  | 'evaluation_completed'

interface CreateNotificationParams {
  userId: string
  type: NotificationType
  title: string
  message: string
  entityType?: string
  entityId?: string
  data?: Record<string, unknown>
}

/**
 * Create a notification for a user
 */
export async function createNotification(params: CreateNotificationParams) {
  const { userId, type, title, message, entityType, entityId, data } = params

  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        entityType: entityType || null,
        entityId: entityId || null,
        data: (data || {}) as import('@prisma/client').Prisma.InputJsonValue,
      },
    })

    return notification
  } catch (error) {
    console.error('[NotificationService] Failed to create notification:', error)
    return null
  }
}

/**
 * Notify when a question receives a like
 */
export async function notifyQuestionLiked(
  questionCreatorId: string,
  likerName: string,
  questionId: string,
  questionContent: string
) {
  return createNotification({
    userId: questionCreatorId,
    type: 'question_liked',
    title: 'Your question was liked',
    message: `${likerName} liked your question: "${questionContent.slice(0, 50)}${questionContent.length > 50 ? '...' : ''}"`,
    entityType: 'question',
    entityId: questionId,
    data: { likerName },
  })
}

/**
 * Notify when a question receives a response
 */
export async function notifyQuestionResponded(
  questionCreatorId: string,
  responderName: string,
  questionId: string,
  questionContent: string
) {
  return createNotification({
    userId: questionCreatorId,
    type: 'question_responded',
    title: 'New response to your question',
    message: `${responderName} responded to your question: "${questionContent.slice(0, 50)}${questionContent.length > 50 ? '...' : ''}"`,
    entityType: 'question',
    entityId: questionId,
    data: { responderName },
  })
}

/**
 * Notify when a response receives a like
 */
export async function notifyResponseLiked(
  responseCreatorId: string,
  likerName: string,
  responseId: string,
  responseContent: string
) {
  return createNotification({
    userId: responseCreatorId,
    type: 'response_liked',
    title: 'Your response was liked',
    message: `${likerName} liked your response: "${responseContent.slice(0, 50)}${responseContent.length > 50 ? '...' : ''}"`,
    entityType: 'response',
    entityId: responseId,
    data: { likerName },
  })
}

/**
 * Notify when a comment is added to a question
 */
export async function notifyCommentAdded(
  questionCreatorId: string,
  commenterName: string,
  questionId: string,
  questionContent: string
) {
  return createNotification({
    userId: questionCreatorId,
    type: 'comment_added',
    title: 'New comment on your question',
    message: `${commenterName} commented on your question: "${questionContent.slice(0, 50)}${questionContent.length > 50 ? '...' : ''}"`,
    entityType: 'question',
    entityId: questionId,
    data: { commenterName },
  })
}

/**
 * Notify when a badge is earned
 */
export async function notifyBadgeEarned(
  userId: string,
  badgeName: string,
  badgeId: string
) {
  return createNotification({
    userId,
    type: 'badge_earned',
    title: 'Badge Earned!',
    message: `Congratulations! You've earned the "${badgeName}" badge.`,
    entityType: 'badge',
    entityId: badgeId,
    data: { badgeName },
  })
}

/**
 * Notify when AI evaluation is completed
 */
export async function notifyEvaluationCompleted(
  userId: string,
  entityType: 'question' | 'response',
  entityId: string,
  score: number
) {
  const type = entityType === 'question' ? 'question' : 'response'
  return createNotification({
    userId,
    type: 'evaluation_completed',
    title: 'AI Evaluation Complete',
    message: `Your ${type} has been evaluated. Score: ${score.toFixed(1)}/10`,
    entityType,
    entityId,
    data: { score },
  })
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    return await prisma.notification.count({
      where: { userId, isRead: false },
    })
  } catch (error) {
    console.error('[NotificationService] Failed to get unread count:', error)
    return 0
  }
}

/**
 * Get notifications for a user with pagination
 */
export async function getNotifications(
  userId: string,
  page: number = 1,
  limit: number = 20
) {
  try {
    const skip = (page - 1) * limit

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: { userId } }),
    ])

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  } catch (error) {
    console.error('[NotificationService] Failed to get notifications:', error)
    return {
      notifications: [],
      pagination: { page, limit, total: 0, totalPages: 0 },
    }
  }
}

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: string, userId: string) {
  try {
    await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    })
    return true
  } catch (error) {
    console.error('[NotificationService] Failed to mark as read:', error)
    return false
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string) {
  try {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    })
    return true
  } catch (error) {
    console.error('[NotificationService] Failed to mark all as read:', error)
    return false
  }
}
