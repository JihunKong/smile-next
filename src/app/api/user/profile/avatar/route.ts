import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { uploadAvatarImage, deleteAvatarImage, validateImageFile } from '@/lib/file-upload'
import { NextResponse } from 'next/server'

/**
 * POST /api/user/profile/avatar
 * Upload a user avatar image (local storage)
 */
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the current user to check for existing avatar
    const user = await prisma.user.findUnique({
      where: { id: session.user.id, isDeleted: false },
      select: { avatarUrl: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Parse the form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file (5MB max for avatars)
    const validationError = validateImageFile({ type: file.type, size: file.size }, 5)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Delete old avatar if exists (local file)
    if (user.avatarUrl && user.avatarUrl.startsWith('/uploads/avatars/')) {
      try {
        await deleteAvatarImage(user.avatarUrl)
      } catch (error) {
        console.error('Failed to delete old avatar:', error)
        // Continue with upload even if delete fails
      }
    }

    // Upload new avatar to local storage
    const avatarUrl = await uploadAvatarImage(buffer, file.name, file.type)

    // Update the user with new avatar URL
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        avatarUrl: avatarUrl,
        // Clear publicId since we're using local storage
        avatarPublicId: null,
      },
      select: {
        id: true,
        avatarUrl: true,
      },
    })

    return NextResponse.json({
      success: true,
      avatarUrl: updatedUser.avatarUrl,
    })
  } catch (error) {
    console.error('Failed to upload avatar:', error)
    return NextResponse.json(
      { error: 'Failed to upload avatar' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/user/profile/avatar
 * Delete the user's avatar image
 */
export async function DELETE() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id, isDeleted: false },
      select: { avatarUrl: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.avatarUrl) {
      return NextResponse.json({ error: 'No avatar to delete' }, { status: 400 })
    }

    // Delete from local storage if it's a local file
    if (user.avatarUrl.startsWith('/uploads/avatars/')) {
      try {
        await deleteAvatarImage(user.avatarUrl)
      } catch (error) {
        console.error('Failed to delete avatar file:', error)
        // Continue to update DB even if file delete fails
      }
    }

    // Update the user
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        avatarUrl: null,
        avatarPublicId: null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete avatar:', error)
    return NextResponse.json(
      { error: 'Failed to delete avatar' },
      { status: 500 }
    )
  }
}
