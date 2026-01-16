import { auth } from '@/lib/auth/config'
import { NextResponse } from 'next/server'
import { getAllRoles } from '@/lib/services/permissionService'

/**
 * GET: Get all roles
 */
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Admin only
    if (session.user.roleId === undefined || session.user.roleId > 1) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const roles = await getAllRoles()

    return NextResponse.json({
      roles,
      total: roles.length,
    })
  } catch (error) {
    console.error('[GET /api/permissions/roles] Error:', error)
    return NextResponse.json(
      { error: 'Failed to get roles' },
      { status: 500 }
    )
  }
}
