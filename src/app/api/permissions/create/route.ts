import { auth } from '@/lib/auth/config'
import { NextResponse } from 'next/server'
import { createPermission } from '@/lib/services/permissionService'

/**
 * POST: Create a new permission
 */
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Super admin only
    if (session.user.roleId !== 0) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, resource, action } = body

    if (!name) {
      return NextResponse.json({ error: 'Permission name is required' }, { status: 400 })
    }

    const result = await createPermission({ name, description, resource, action })

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      permission: result.permission,
    })
  } catch (error) {
    console.error('[POST /api/permissions/create] Error:', error)
    return NextResponse.json(
      { error: 'Failed to create permission' },
      { status: 500 }
    )
  }
}
