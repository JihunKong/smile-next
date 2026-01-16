import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/services/emailService'
import { createNotification } from '@/lib/services/notificationService'

interface SendNotificationRequest {
  type: 'email' | 'internal' | 'both'
  recipients: string[]  // User IDs or emails depending on type
  subject?: string
  title: string
  message: string
  template?: string
  data?: Record<string, unknown>
}

// Email templates
const emailTemplates: Record<string, (data: Record<string, unknown>) => { html: string; text: string }> = {
  general: (data) => ({
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${data.title || 'Notification'}</h1>
          </div>
          <div class="content">
            <p>${data.message || ''}</p>
          </div>
          <div class="footer">
            <p>SMILE - Seeds of Empowerment</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `${data.title || 'Notification'}\n\n${data.message || ''}\n\n- SMILE Team`,
  }),

  announcement: (data) => ({
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .highlight { background: #EFF6FF; border-left: 4px solid #3B82F6; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📢 ${data.title || 'Announcement'}</h1>
          </div>
          <div class="content">
            <div class="highlight">
              <p>${data.message || ''}</p>
            </div>
            ${data.details ? `<p>${data.details}</p>` : ''}
          </div>
          <div class="footer">
            <p>SMILE - Seeds of Empowerment</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `📢 ${data.title || 'Announcement'}\n\n${data.message || ''}\n\n${data.details || ''}\n\n- SMILE Team`,
  }),

  reminder: (data) => ({
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #F59E0B; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #FFFBEB; padding: 30px; border-radius: 0 0 8px 8px; }
          .urgent { background: #FEF3C7; border: 1px solid #FCD34D; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Reminder</h1>
          </div>
          <div class="content">
            <h2>${data.title || ''}</h2>
            <div class="urgent">
              <p>${data.message || ''}</p>
            </div>
            ${data.deadline ? `<p><strong>Deadline:</strong> ${data.deadline}</p>` : ''}
          </div>
          <div class="footer">
            <p>SMILE - Seeds of Empowerment</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `⏰ Reminder: ${data.title || ''}\n\n${data.message || ''}\n\n${data.deadline ? `Deadline: ${data.deadline}` : ''}\n\n- SMILE Team`,
  }),
}

/**
 * POST: Send notification to users
 */
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only teachers and admins can send notifications
    if (session.user.roleId === undefined || session.user.roleId > 2) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const body: SendNotificationRequest = await request.json()
    const { type, recipients, subject, title, message, template = 'general', data = {} } = body

    if (!recipients || recipients.length === 0) {
      return NextResponse.json({ error: 'Recipients are required' }, { status: 400 })
    }

    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message are required' }, { status: 400 })
    }

    const results = {
      emailsSent: 0,
      notificationsCreated: 0,
      errors: [] as string[],
    }

    // Get template generator
    const templateFn = emailTemplates[template] || emailTemplates.general

    // Process each recipient
    for (const recipient of recipients) {
      try {
        // Determine if recipient is email or user ID
        const isEmail = recipient.includes('@')

        if (type === 'email' || type === 'both') {
          let email = recipient

          if (!isEmail) {
            // Get user email
            const user = await prisma.user.findUnique({
              where: { id: recipient },
              select: { email: true },
            })
            if (user) email = user.email
          }

          if (email && email.includes('@')) {
            const { html, text } = templateFn({ title, message, ...data })
            const sent = await sendEmail({
              to: email,
              subject: subject || title,
              html,
              text,
            })
            if (sent) results.emailsSent++
          }
        }

        if ((type === 'internal' || type === 'both') && !isEmail) {
          // Create internal notification for user ID
          const notification = await createNotification({
            userId: recipient,
            type: 'evaluation_completed', // Using existing type
            title,
            message,
            data: { template, senderId: session.user.id, ...data },
          })
          if (notification) results.notificationsCreated++
        }
      } catch (err) {
        results.errors.push(`Failed to notify ${recipient}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
    })
  } catch (error) {
    console.error('[POST /api/notifications/send] Error:', error)
    return NextResponse.json(
      { error: 'Failed to send notifications' },
      { status: 500 }
    )
  }
}
