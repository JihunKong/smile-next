import { auth } from '@/lib/auth/config'
import { NextResponse } from 'next/server'

// Notification template definitions
const templates = [
  {
    id: 'general',
    name: 'General Notification',
    description: 'Basic notification for general announcements',
    type: 'both',
    category: 'general',
    fields: ['title', 'message'],
    preview: {
      title: 'General Update',
      message: 'This is a general notification message.',
    },
  },
  {
    id: 'announcement',
    name: 'Announcement',
    description: 'Important announcement with highlighted content',
    type: 'both',
    category: 'general',
    fields: ['title', 'message', 'details'],
    preview: {
      title: 'Important Announcement',
      message: 'We have exciting news to share!',
      details: 'Additional details about the announcement.',
    },
  },
  {
    id: 'reminder',
    name: 'Reminder',
    description: 'Reminder notification with deadline support',
    type: 'both',
    category: 'general',
    fields: ['title', 'message', 'deadline'],
    preview: {
      title: 'Upcoming Deadline',
      message: "Don't forget to complete your assignment!",
      deadline: '2025-01-20',
    },
  },
  {
    id: 'exam_result',
    name: 'Exam Result',
    description: 'Automated notification for exam completion',
    type: 'system',
    category: 'exam',
    fields: [],
    systemOnly: true,
  },
  {
    id: 'inquiry_result',
    name: 'Inquiry Result',
    description: 'Automated notification for inquiry completion',
    type: 'system',
    category: 'inquiry',
    fields: [],
    systemOnly: true,
  },
  {
    id: 'badge_earned',
    name: 'Badge Earned',
    description: 'Notification when user earns a badge',
    type: 'system',
    category: 'achievement',
    fields: [],
    systemOnly: true,
  },
  {
    id: 'level_up',
    name: 'Level Up',
    description: 'Notification when user levels up',
    type: 'system',
    category: 'achievement',
    fields: [],
    systemOnly: true,
  },
  {
    id: 'welcome',
    name: 'Welcome Email',
    description: 'Welcome email for new users',
    type: 'email',
    category: 'onboarding',
    fields: ['firstName'],
    systemOnly: true,
  },
  {
    id: 'password_reset',
    name: 'Password Reset',
    description: 'Password reset email',
    type: 'email',
    category: 'auth',
    fields: [],
    systemOnly: true,
  },
  {
    id: 'email_verification',
    name: 'Email Verification',
    description: 'Email verification for new accounts',
    type: 'email',
    category: 'auth',
    fields: [],
    systemOnly: true,
  },
  {
    id: 'group_invitation',
    name: 'Group Invitation',
    description: 'Invitation to join a group',
    type: 'both',
    category: 'group',
    fields: ['groupName', 'inviterName', 'inviteLink'],
    systemOnly: false,
  },
  {
    id: 'activity_available',
    name: 'Activity Available',
    description: 'New activity available notification',
    type: 'both',
    category: 'activity',
    fields: ['activityName', 'groupName', 'dueDate'],
    systemOnly: false,
  },
  {
    id: 'evaluation_complete',
    name: 'Evaluation Complete',
    description: 'AI evaluation completed notification',
    type: 'internal',
    category: 'evaluation',
    fields: [],
    systemOnly: true,
  },
]

// Template categories
const categories = [
  { id: 'general', name: 'General', description: 'General purpose notifications' },
  { id: 'exam', name: 'Exam', description: 'Exam-related notifications' },
  { id: 'inquiry', name: 'Inquiry', description: 'Inquiry-related notifications' },
  { id: 'achievement', name: 'Achievement', description: 'Achievement and badge notifications' },
  { id: 'onboarding', name: 'Onboarding', description: 'User onboarding notifications' },
  { id: 'auth', name: 'Authentication', description: 'Authentication-related emails' },
  { id: 'group', name: 'Group', description: 'Group-related notifications' },
  { id: 'activity', name: 'Activity', description: 'Activity-related notifications' },
  { id: 'evaluation', name: 'Evaluation', description: 'AI evaluation notifications' },
]

/**
 * GET: Get available notification templates
 */
export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const includeSystem = searchParams.get('includeSystem') === 'true'

    // Filter templates based on query params
    let filteredTemplates = templates

    if (category) {
      filteredTemplates = filteredTemplates.filter(t => t.category === category)
    }

    // Only show system templates to admins
    const isAdmin = session.user.roleId !== undefined && session.user.roleId <= 1
    if (!includeSystem || !isAdmin) {
      filteredTemplates = filteredTemplates.filter(t => !t.systemOnly)
    }

    return NextResponse.json({
      templates: filteredTemplates,
      categories,
    })
  } catch (error) {
    console.error('[GET /api/notifications/templates] Error:', error)
    return NextResponse.json(
      { error: 'Failed to get notification templates' },
      { status: 500 }
    )
  }
}
