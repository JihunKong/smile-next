import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { NextResponse } from 'next/server'
import { updatePermission, deletePermission } from '@/lib/services/permissionService'

/**
 * GET: Get a specific permission
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Admin only
    if (session.user.roleId === undefined || session.user.roleId > 1) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const { id } = await params
    const permission = await prisma.permission.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: {
              select: { id: true, name: true },
            },
          },
        },
      },
    })

    if (!permission) {
      return NextResponse.json({ error: 'Permission not found' }, { status: 404 })
    }

    return NextResponse.json({
      permission: {
        ...permission,
        roles: permission.roles.map(rp => rp.role),
      },
    })
  } catch (error) {
    console.error('[GET /api/permissions/[id]] Error:', error)
    return NextResponse.json(
      { error: 'Failed to get permission' },
      { status: 500 }
    )
  }
}

/**
 * PUT: Update a permission
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Super admin only
    if (session.user.roleId !== 0) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, description, resource, action } = body

    const result = await updatePermission(id, { name, description, resource, action })

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      permission: result.permission,
    })
  } catch (error) {
    console.error('[PUT /api/permissions/[id]] Error:', error)
    return NextResponse.json(
      { error: 'Failed to update permission' },
      { status: 500 }
    )
  }
}

/**
 * DELETE: Delete a permission
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Super admin only
    if (session.user.roleId !== 0) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const { id } = await params
    const result = await deletePermission(id)

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: 'Permission deleted' })
  } catch (error) {
    console.error('[DELETE /api/permissions/[id]] Error:', error)
    return NextResponse.json(
      { error: 'Failed to delete permission' },
      { status: 500 }
    )
  }
}
