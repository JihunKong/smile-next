import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

/**
 * GET: Check if email is available for registration
 * Query params: email
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { available: false, error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Check if email exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, isDeleted: true },
    })

    // Email is available if no user exists or user is deleted
    const available = !existingUser || existingUser.isDeleted

    return NextResponse.json({
      available,
      email: email.toLowerCase(),
    })
  } catch (error) {
    console.error('[Check Email] Error:', error)
    return NextResponse.json(
      { error: 'Failed to check email availability' },
      { status: 500 }
    )
  }
}
