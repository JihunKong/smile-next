import { auth } from '@/lib/auth/config'
import { NextResponse } from 'next/server'
import { revokePermissionFromRole } from '@/lib/services/permissionService'

/**
 * POST: Revoke permission from role
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
    const { roleId, permissionId } = body

    if (!roleId || !permissionId) {
      return NextResponse.json(
        { error: 'Role ID and Permission ID are required' },
        { status: 400 }
      )
    }

    const result = await revokePermissionFromRole(roleId, permissionId)
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: 'Permission revoked from role' })
  } catch (error) {
    console.error('[POST /api/permissions/revoke] Error:', error)
    return NextResponse.json(
      { error: 'Failed to revoke permission' },
      { status: 500 }
    )
  }
}
