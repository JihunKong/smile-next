import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/services/emailService'

// Rate limiting: track IP addresses
const rateLimitMap = new Map<string, { count: number; timestamp: number }>()
const RATE_LIMIT_WINDOW = 60 * 60 * 1000 // 1 hour
const MAX_REQUESTS = 5 // 5 requests per hour

function getRateLimitKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
  return ip
}

function checkRateLimit(key: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(key)

  if (!entry || now - entry.timestamp > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(key, { count: 1, timestamp: now })
    return true
  }

  if (entry.count >= MAX_REQUESTS) {
    return false
  }

  entry.count++
  return true
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitKey = getRateLimitKey(request)
    if (!checkRateLimit(rateLimitKey)) {
      return NextResponse.json(
        { success: false, message: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { name, email, subject, message } = body

    // Validation
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      )
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Length validation
    if (name.length > 100 || subject.length > 200 || message.length > 5000) {
      return NextResponse.json(
        { success: false, message: 'Input exceeds maximum length' },
        { status: 400 }
      )
    }

    // Honeypot check (if website field exists, it's a bot)
    if (body.website) {
      console.log('[Contact] Bot detected via honeypot')
      return NextResponse.json({ success: true, message: 'Message sent successfully' })
    }

    // Build email content
    const adminEmail = process.env.CONTACT_EMAIL || process.env.SMTP_USER || 'admin@seedsofempowerment.org'

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .field { margin-bottom: 15px; }
          .field-label { font-weight: bold; color: #374151; }
          .field-value { margin-top: 5px; padding: 10px; background: white; border-radius: 4px; }
          .message-box { white-space: pre-wrap; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Contact Form Submission</h1>
          </div>
          <div class="content">
            <div class="field">
              <div class="field-label">Name:</div>
              <div class="field-value">${escapeHtml(name)}</div>
            </div>
            <div class="field">
              <div class="field-label">Email:</div>
              <div class="field-value"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></div>
            </div>
            <div class="field">
              <div class="field-label">Subject:</div>
              <div class="field-value">${escapeHtml(subject)}</div>
            </div>
            <div class="field">
              <div class="field-label">Message:</div>
              <div class="field-value message-box">${escapeHtml(message)}</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `

    const textContent = `
New Contact Form Submission

Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}
    `

    // Send email to admin
    const sent = await sendEmail({
      to: adminEmail,
      subject: `[SMILE Contact] ${subject}`,
      text: textContent,
      html: htmlContent,
    })

    if (!sent) {
      console.error('[Contact] Failed to send email')
      // Log the message even if email fails
      console.log('[Contact] Message logged:', { name, email, subject, message: message.slice(0, 100) })
    }

    // Always return success to prevent information leakage
    return NextResponse.json({
      success: true,
      message: 'Message sent successfully! We\'ll get back to you soon.',
    })
  } catch (error) {
    console.error('[Contact] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to send message. Please try again.' },
      { status: 500 }
    )
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
