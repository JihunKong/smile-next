import { auth } from '@/lib/auth/config'
import { NextResponse } from 'next/server'
import { getUserPermissions } from '@/lib/services/permissionService'

/**
 * GET: Get permissions for a specific user
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

    const { id } = await params

    // Users can view their own permissions, admins can view anyone's
    const isAdmin = session.user.roleId !== undefined && session.user.roleId <= 1
    if (id !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const result = await getUserPermissions(id)

    return NextResponse.json({
      userId: id,
      ...result,
    })
  } catch (error) {
    console.error('[GET /api/permissions/user/[id]] Error:', error)
    return NextResponse.json(
      { error: 'Failed to get user permissions' },
      { status: 500 }
    )
  }
}
