import { auth } from '@/lib/auth/config'
import { NextResponse } from 'next/server'
import { getAllPermissions, initializePermissions } from '@/lib/services/permissionService'

/**
 * GET: Get all permissions
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

    const { permissions, grouped } = await getAllPermissions()

    return NextResponse.json({
      permissions,
      grouped,
      total: permissions.length,
    })
  } catch (error) {
    console.error('[GET /api/permissions] Error:', error)
    return NextResponse.json(
      { error: 'Failed to get permissions' },
      { status: 500 }
    )
  }
}

/**
 * POST: Initialize system permissions (admin only)
 */
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Super admin only (roleId === 0)
    if (session.user.roleId !== 0) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const { action } = body

    if (action === 'initialize') {
      const result = await initializePermissions()
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 500 })
      }
      return NextResponse.json({ success: true, message: 'Permissions initialized' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('[POST /api/permissions] Error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
