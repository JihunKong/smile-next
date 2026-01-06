import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'
import { prisma } from '@/lib/db/prisma'

// Token expiry time: 24 hours
const TOKEN_EXPIRY_HOURS = 24

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { firstName, lastName, username, email, password } = body

    // Validation
    if (!firstName || !lastName || !username || !email || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Password validation
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    if (!/[A-Z]/.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain an uppercase letter' },
        { status: 400 }
      )
    }

    if (!/[a-z]/.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain a lowercase letter' },
        { status: 400 }
      )
    }

    if (!/[0-9]/.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain a number' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUserByEmail) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    // Check if username already exists
    const existingUserByUsername = await prisma.user.findUnique({
      where: { username },
    })

    if (existingUserByUsername) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Generate email verification token
    const verificationToken = randomBytes(32).toString('hex')
    const verificationExpire = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000)

    // Create user with email verification token
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        username,
        email: email.toLowerCase(),
        passwordHash,
        roleId: 3, // Default role: Student (3)
        emailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationExpire: verificationExpire,
      },
    })

    // Create default group for user
    const defaultGroup = await prisma.group.create({
      data: {
        name: `${firstName}'s Group`,
        creatorId: user.id,
        isDefault: true,
      },
    })

    // Add user as group member
    await prisma.groupUser.create({
      data: {
        userId: user.id,
        groupId: defaultGroup.id,
        role: 2, // Owner
      },
    })

    // Generate verification URL
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const verifyUrl = `${baseUrl}/auth/verify-email?token=${verificationToken}`

    // In production, send email here
    // For now, log the verification URL (in development)
    console.log('=== Email Verification ===')
    console.log(`User: ${user.email}`)
    console.log(`Verification URL: ${verifyUrl}`)
    console.log(`Token expires: ${verificationExpire.toISOString()}`)
    console.log('==========================')

    // TODO: Implement actual email sending
    // await sendEmailVerification(user.email, verifyUrl)

    return NextResponse.json(
      {
        success: true,
        message: 'Registration successful. Please check your email to verify your account.',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    )
  }
}
