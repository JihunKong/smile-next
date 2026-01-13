import nodemailer from 'nodemailer'

// SMTP Configuration from environment variables
const smtpConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
}

const emailFrom = process.env.EMAIL_FROM || 'SMILE <noreply@seedsofempowerment.org>'

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    if (!smtpConfig.auth.user || !smtpConfig.auth.pass) {
      console.warn('[Email] SMTP credentials not configured, emails will be logged only')
      // Return a mock transporter that just logs
      return {
        sendMail: async (options: nodemailer.SendMailOptions) => {
          console.log('[Email Mock] Would send email:', {
            to: options.to,
            subject: options.subject,
            text: typeof options.text === 'string' ? options.text.slice(0, 200) : '[non-string text]',
          })
          return { messageId: 'mock-' + Date.now() }
        },
      } as nodemailer.Transporter
    }
    transporter = nodemailer.createTransport(smtpConfig)
  }
  return transporter
}

interface SendEmailOptions {
  to: string
  subject: string
  text?: string
  html?: string
}

export async function sendEmail({ to, subject, text, html }: SendEmailOptions): Promise<boolean> {
  try {
    const transport = getTransporter()
    const result = await transport.sendMail({
      from: emailFrom,
      to,
      subject,
      text,
      html,
    })
    console.log('[Email] Sent successfully:', result.messageId)
    return true
  } catch (error) {
    console.error('[Email] Failed to send:', error)
    return false
  }
}

// Email Templates

export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  baseUrl: string
): Promise<boolean> {
  const resetUrl = `${baseUrl}/auth/reset-password/${resetToken}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>We received a request to reset your password for your SMILE account.</p>
          <p>Click the button below to reset your password:</p>
          <p style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </p>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; color: #4F46E5;">${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>SMILE - Seeds of Empowerment</p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
Password Reset Request

Hello,

We received a request to reset your password for your SMILE account.

Click this link to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request this, please ignore this email.

- SMILE Team
  `

  return sendEmail({
    to: email,
    subject: 'Password Reset - SMILE',
    text,
    html,
  })
}

export async function sendEmailVerificationEmail(
  email: string,
  verificationToken: string,
  baseUrl: string
): Promise<boolean> {
  const verifyUrl = `${baseUrl}/auth/verify-email?token=${verificationToken}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Verify Your Email</h1>
        </div>
        <div class="content">
          <p>Welcome to SMILE!</p>
          <p>Please verify your email address to activate your account.</p>
          <p style="text-align: center;">
            <a href="${verifyUrl}" class="button">Verify Email</a>
          </p>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; color: #10B981;">${verifyUrl}</p>
          <p>This link will expire in 24 hours.</p>
        </div>
        <div class="footer">
          <p>SMILE - Seeds of Empowerment</p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
Welcome to SMILE!

Please verify your email address to activate your account.

Click this link to verify:
${verifyUrl}

This link will expire in 24 hours.

- SMILE Team
  `

  return sendEmail({
    to: email,
    subject: 'Verify Your Email - SMILE',
    text,
    html,
  })
}

export async function sendWelcomeEmail(email: string, firstName: string): Promise<boolean> {
  const html = `
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
          <h1>Welcome to SMILE!</h1>
        </div>
        <div class="content">
          <p>Hello ${firstName || 'there'}!</p>
          <p>Thank you for joining SMILE - Student Made Interactive Learning Environment.</p>
          <p>You can now:</p>
          <ul>
            <li>Join learning groups</li>
            <li>Create and answer questions</li>
            <li>Get AI-powered feedback on your learning</li>
            <li>Track your progress with badges and achievements</li>
          </ul>
          <p>Start exploring and have fun learning!</p>
        </div>
        <div class="footer">
          <p>SMILE - Seeds of Empowerment</p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
Hello ${firstName || 'there'}!

Thank you for joining SMILE - Student Made Interactive Learning Environment.

You can now:
- Join learning groups
- Create and answer questions
- Get AI-powered feedback on your learning
- Track your progress with badges and achievements

Start exploring and have fun learning!

- SMILE Team
  `

  return sendEmail({
    to: email,
    subject: 'Welcome to SMILE!',
    text,
    html,
  })
}

export async function sendUsernameRecoveryEmail(
  email: string,
  username: string
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .username { background: #e5e7eb; padding: 15px; border-radius: 6px; text-align: center; font-size: 18px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Username Recovery</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>You requested to recover your SMILE username.</p>
          <p>Your username is:</p>
          <div class="username">${username}</div>
          <p>You can now use this username to log in to your account.</p>
        </div>
        <div class="footer">
          <p>SMILE - Seeds of Empowerment</p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
Username Recovery

Hello,

You requested to recover your SMILE username.

Your username is: ${username}

You can now use this username to log in to your account.

- SMILE Team
  `

  return sendEmail({
    to: email,
    subject: 'Username Recovery - SMILE',
    text,
    html,
  })
}
