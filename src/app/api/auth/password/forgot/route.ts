import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { randomBytes } from 'crypto'

// Token expiry time: 10 minutes
const TOKEN_EXPIRY_MINUTES = 10

export async function POST(request: NextRequest) {
  try {
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

    // Generate reset URL
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const resetUrl = `${baseUrl}/auth/reset-password/${resetToken}`

    // In production, send email here
    // For now, log the reset URL (in development)
    console.log('=== Password Reset Request ===')
    console.log(`User: ${user.email}`)
    console.log(`Reset URL: ${resetUrl}`)
    console.log(`Token expires: ${resetExpire.toISOString()}`)
    console.log('==============================')

    // TODO: Implement actual email sending
    // await sendPasswordResetEmail(user.email, resetUrl)

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
