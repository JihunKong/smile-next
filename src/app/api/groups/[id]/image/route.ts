import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { uploadGroupImage, deleteGroupImage, validateImageFile } from '@/lib/file-upload'
import { canManageGroup } from '@/lib/groups/utils'
import { NextResponse } from 'next/server'
import type { GroupRole } from '@/types/groups'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/groups/[id]/image
 * Upload a group image (local storage)
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: groupId } = await params

    // Check membership and permissions
    const membership = await prisma.groupUser.findUnique({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId,
        },
      },
    })

    if (!membership || !canManageGroup(membership.role as GroupRole, 'edit')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Get the current group to check for existing image
    const group = await prisma.group.findUnique({
      where: { id: groupId, isDeleted: false },
      select: { groupImageUrl: true },
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Parse the form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file
    const validationError = validateImageFile({ type: file.type, size: file.size })
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Delete old image if exists (local file)
    if (group.groupImageUrl) {
      try {
        await deleteGroupImage(group.groupImageUrl)
      } catch (error) {
        console.error('Failed to delete old image:', error)
        // Continue with upload even if delete fails
      }
    }

    // Upload new image to local storage
    const imageUrl = await uploadGroupImage(buffer, file.name, file.type)

    // Update the group with new image URL
    const updatedGroup = await prisma.group.update({
      where: { id: groupId },
      data: {
        groupImageUrl: imageUrl,
        // Clear publicId since we're using local storage
        groupImagePublicId: null,
      },
      select: {
        id: true,
        groupImageUrl: true,
      },
    })

    return NextResponse.json({
      success: true,
      imageUrl: updatedGroup.groupImageUrl,
    })
  } catch (error) {
    console.error('Failed to upload group image:', error)
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/groups/[id]/image
 * Delete a group image
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: groupId } = await params

    // Check membership and permissions
    const membership = await prisma.groupUser.findUnique({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId,
        },
      },
    })

    if (!membership || !canManageGroup(membership.role as GroupRole, 'edit')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Get the group
    const group = await prisma.group.findUnique({
      where: { id: groupId, isDeleted: false },
      select: { groupImageUrl: true },
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    if (!group.groupImageUrl) {
      return NextResponse.json({ error: 'No image to delete' }, { status: 400 })
    }

    // Delete from local storage
    try {
      await deleteGroupImage(group.groupImageUrl)
    } catch (error) {
      console.error('Failed to delete image file:', error)
      // Continue to update DB even if file delete fails
    }

    // Update the group
    await prisma.group.update({
      where: { id: groupId },
      data: {
        groupImageUrl: null,
        groupImagePublicId: null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete group image:', error)
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    )
  }
}
