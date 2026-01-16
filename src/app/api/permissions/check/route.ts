import { auth } from '@/lib/auth/config'
import { NextResponse } from 'next/server'
import { checkPermission, checkPermissions } from '@/lib/services/permissionService'

/**
 * POST: Check if user has permission(s)
 */
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, permission, permissions } = body

    // Users can check their own permissions, admins can check anyone's
    const targetUserId = userId || session.user.id
    const isAdmin = session.user.roleId !== undefined && session.user.roleId <= 1

    if (targetUserId !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Check single permission
    if (permission) {
      const hasPermission = await checkPermission(targetUserId, permission)
      return NextResponse.json({
        userId: targetUserId,
        permission,
        allowed: hasPermission,
      })
    }

    // Check multiple permissions
    if (permissions && Array.isArray(permissions)) {
      const results = await checkPermissions(targetUserId, permissions)
      return NextResponse.json({
        userId: targetUserId,
        permissions: results,
        allAllowed: Object.values(results).every(v => v),
        anyAllowed: Object.values(results).some(v => v),
      })
    }

    return NextResponse.json(
      { error: 'Provide "permission" or "permissions" array' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[POST /api/permissions/check] Error:', error)
    return NextResponse.json(
      { error: 'Failed to check permissions' },
      { status: 500 }
    )
  }
}
