import { auth } from '@/lib/auth/config'
import { NextResponse } from 'next/server'
import { assignPermissionToRole, assignRoleToUser } from '@/lib/services/permissionService'

/**
 * POST: Assign permission to role or role to user
 */
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Admin only
    if (session.user.roleId === undefined || session.user.roleId > 1) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const body = await request.json()
    const { type, roleId, permissionId, userId } = body

    if (type === 'permission_to_role') {
      if (!roleId || !permissionId) {
        return NextResponse.json(
          { error: 'Role ID and Permission ID are required' },
          { status: 400 }
        )
      }

      const result = await assignPermissionToRole(roleId, permissionId)
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }

      return NextResponse.json({ success: true, message: 'Permission assigned to role' })
    }

    if (type === 'role_to_user') {
      if (!userId || !roleId) {
        return NextResponse.json(
          { error: 'User ID and Role ID are required' },
          { status: 400 }
        )
      }

      const result = await assignRoleToUser(userId, roleId)
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }

      return NextResponse.json({ success: true, message: 'Role assigned to user' })
    }

    return NextResponse.json(
      { error: 'Invalid type. Use "permission_to_role" or "role_to_user"' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[POST /api/permissions/assign] Error:', error)
    return NextResponse.json(
      { error: 'Failed to assign permission/role' },
      { status: 500 }
    )
  }
}
