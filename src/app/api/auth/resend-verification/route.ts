import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { randomBytes } from 'crypto'
import { sendEmailVerificationEmail } from '@/lib/services/emailService'

// Token expiry time: 24 hours
const TOKEN_EXPIRY_HOURS = 24

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, token } = body

    let user = null

    // Find user by email or by existing token
    if (email) {
      user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      })
    } else if (token) {
      // Try to find user by old token (even if expired)
      user = await prisma.user.findFirst({
        where: { emailVerificationToken: token },
      })
    }

    // Always return success to prevent enumeration
    if (!user || user.isDeleted || user.isBlocked) {
      return NextResponse.json({
        message: 'If an account exists with this email, you will receive a verification link.',
      })
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json({
        message: 'Email is already verified. You can proceed to login.',
      })
    }

    // Generate new verification token
    const verificationToken = randomBytes(32).toString('hex')
    const verificationExpire = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000)

    // Save token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationExpire: verificationExpire,
      },
    })

    // Send verification email
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const emailSent = await sendEmailVerificationEmail(user.email, verificationToken, baseUrl)

    if (!emailSent) {
      console.error('[Resend Verification] Failed to send email to:', user.email)
    }

    return NextResponse.json({
      message: 'If an account exists with this email, you will receive a verification link.',
    })
  } catch (error) {
    console.error('Resend verification error:', error)
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    )
  }
}
