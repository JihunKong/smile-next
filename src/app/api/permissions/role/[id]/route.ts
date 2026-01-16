import { auth } from '@/lib/auth/config'
import { NextResponse } from 'next/server'
import { getRolePermissions } from '@/lib/services/permissionService'

/**
 * GET: Get permissions for a specific role
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
    const permissions = await getRolePermissions(id)

    return NextResponse.json({
      roleId: id,
      permissions,
      count: permissions.length,
    })
  } catch (error) {
    console.error('[GET /api/permissions/role/[id]] Error:', error)
    return NextResponse.json(
      { error: 'Failed to get role permissions' },
      { status: 500 }
    )
  }
}
