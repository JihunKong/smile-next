import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

export async function DELETE() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Soft delete user (mark as deleted)
    await prisma.user.update({
      where: { id: userId },
      data: {
        isDeleted: true,
        // Anonymize sensitive data
        email: `deleted_${userId}@deleted.local`,
        username: `deleted_user_${userId.substring(0, 8)}`,
        firstName: 'Deleted',
        lastName: 'User',
        passwordHash: null,
        avatarUrl: null,
        avatarPublicId: null,
        resetPasswordToken: null,
        resetPasswordExpire: null,
        emailVerificationToken: null,
        emailVerificationExpire: null,
      },
    })

    console.log(`Account deleted for user: ${userId}`)

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully',
    })
  } catch (error) {
    console.error('Failed to delete account:', error)
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    )
  }
}
