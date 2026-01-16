import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { NextResponse } from 'next/server'
import { updateRole, deleteRole, getRolePermissions } from '@/lib/services/permissionService'

/**
 * GET: Get a specific role with its permissions
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
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true },
        },
      },
    })

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    const permissions = await getRolePermissions(id)

    return NextResponse.json({
      role: {
        id: role.id,
        name: role.name,
        description: role.description,
        priority: role.priority,
        isSystem: role.isSystem,
        userCount: role._count.users,
        permissions,
      },
    })
  } catch (error) {
    console.error('[GET /api/permissions/roles/[id]] Error:', error)
    return NextResponse.json(
      { error: 'Failed to get role' },
      { status: 500 }
    )
  }
}

/**
 * PUT: Update a role
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
    const { name, description, priority } = body

    const result = await updateRole(id, { name, description, priority })

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      role: result.role,
    })
  } catch (error) {
    console.error('[PUT /api/permissions/roles/[id]] Error:', error)
    return NextResponse.json(
      { error: 'Failed to update role' },
      { status: 500 }
    )
  }
}

/**
 * DELETE: Delete a role
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
    const result = await deleteRole(id)

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: 'Role deleted' })
  } catch (error) {
    console.error('[DELETE /api/permissions/roles/[id]] Error:', error)
    return NextResponse.json(
      { error: 'Failed to delete role' },
      { status: 500 }
    )
  }
}
