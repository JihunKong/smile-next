import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

/**
 * GET: Check if username is available for registration
 * Query params: username
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      )
    }

    // Username validation: 3-30 chars, alphanumeric and underscores only
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        {
          available: false,
          error: 'Username must be 3-30 characters and contain only letters, numbers, and underscores'
        },
        { status: 400 }
      )
    }

    // Check if username exists (case-insensitive)
    const existingUser = await prisma.user.findFirst({
      where: {
        username: { equals: username, mode: 'insensitive' },
        isDeleted: false,
      },
      select: { id: true },
    })

    const available = !existingUser

    return NextResponse.json({
      available,
      username,
    })
  } catch (error) {
    console.error('[Check Username] Error:', error)
    return NextResponse.json(
      { error: 'Failed to check username availability' },
      { status: 500 }
    )
  }
}
