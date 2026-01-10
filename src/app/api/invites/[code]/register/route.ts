import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'
import { prisma } from '@/lib/db/prisma'

// POST: Register new user and join group via invite
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const body = await request.json()
    const { firstName, lastName, email, password } = body

    // Validation
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    if (!code) {
      return NextResponse.json(
        { error: 'Invite code is required' },
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

    // Find group by invite code
    const group = await prisma.group.findUnique({
      where: {
        inviteCode: code,
        isDeleted: false,
      },
    })

    if (!group) {
      return NextResponse.json(
        { error: 'Invalid or expired invite code' },
        { status: 404 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered. Please sign in instead.' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Generate email verification token
    const verificationToken = randomBytes(32).toString('hex')
    const verificationExpire = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Create user with invitation tracking
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email: email.toLowerCase(),
        passwordHash,
        roleId: 3, // Student
        emailVerified: true, // Auto-verify for invite registrations
        emailVerificationToken: verificationToken,
        emailVerificationExpire: verificationExpire,
        invitedById: group.creatorId,
        registrationMethod: 'invite',
        invitationCode: code,
      },
    })

    // Add user to the invited group
    await prisma.groupUser.create({
      data: {
        userId: user.id,
        groupId: group.id,
        role: 0, // Member
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

    // Add user as owner of their default group
    await prisma.groupUser.create({
      data: {
        userId: user.id,
        groupId: defaultGroup.id,
        role: 2, // Owner
      },
    })

    console.log('=== Invite Registration ===')
    console.log(`User: ${user.email}`)
    console.log(`Invited to group: ${group.name} (${group.id})`)
    console.log(`Invited by: ${group.creatorId}`)
    console.log('============================')

    return NextResponse.json(
      {
        success: true,
        message: 'Registration successful. You have been added to the group.',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        groupId: group.id,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration via invite error:', error)
    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    )
  }
}
