import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { randomBytes } from 'crypto'
import { sendPasswordResetEmail } from '@/lib/services/emailService'
import { rateLimit, RATE_LIMIT_CONFIGS, getRateLimitHeaders } from '@/lib/rateLimit'

// Token expiry time: 1 hour (increased from 10 minutes for better UX)
const TOKEN_EXPIRY_MINUTES = 60

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting (10 attempts per 15 minutes)
    const rateLimitResult = await rateLimit(request, RATE_LIMIT_CONFIGS.auth)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many password reset attempts. Please try again later.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      )
    }

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    // Always return success to prevent email enumeration
    if (!user || user.isDeleted || user.isBlocked) {
      return NextResponse.json({
        message: 'If an account exists with this email, you will receive a password reset link.',
      })
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString('hex')
    const resetExpire = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000)

    // Save token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpire: resetExpire,
      },
    })

    // Get base URL for reset link
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Send password reset email
    const emailSent = await sendPasswordResetEmail(user.email, resetToken, baseUrl)

    if (!emailSent) {
      console.error('[Password Reset] Failed to send email to:', user.email)
      // Still return success to prevent enumeration
    }

    return NextResponse.json({
      message: 'If an account exists with this email, you will receive a password reset link.',
    })
  } catch (error) {
    console.error('Password forgot error:', error)
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    )
  }
}
