import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/activities/[id]/qr
 * Generate QR code for an activity
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get the activity
    const activity = await prisma.activity.findUnique({
      where: { id, isDeleted: false },
      include: {
        owningGroup: {
          select: { id: true, name: true },
        },
      },
    })

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    // Check if user has access to this activity (member of the group)
    const membership = await prisma.groupUser.findUnique({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId: activity.owningGroupId,
        },
      },
    })

    // Allow access if user is member or creator
    if (!membership && activity.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get the format from query params (default: png)
    const format = request.nextUrl.searchParams.get('format') || 'png'
    const size = parseInt(request.nextUrl.searchParams.get('size') || '300')

    // Build the activity URL
    const baseUrl = process.env.NEXTAUTH_URL || 'https://smile.pknic.kr'
    const activityUrl = `${baseUrl}/groups/${activity.owningGroupId}/activities/${id}`

    if (format === 'svg') {
      // Generate SVG QR code
      const svg = await QRCode.toString(activityUrl, {
        type: 'svg',
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      })

      return new NextResponse(svg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=3600',
        },
      })
    } else if (format === 'dataurl') {
      // Generate data URL (for embedding in HTML)
      const dataUrl = await QRCode.toDataURL(activityUrl, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      })

      return NextResponse.json({
        success: true,
        data: {
          dataUrl,
          url: activityUrl,
          activity: {
            id: activity.id,
            name: activity.name,
            type: activity.activityType,
          },
        },
      })
    } else {
      // Generate PNG QR code
      const buffer = await QRCode.toBuffer(activityUrl, {
        type: 'png',
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      })

      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=3600',
          'Content-Disposition': `inline; filename="activity-${id}-qr.png"`,
        },
      })
    }
  } catch (error) {
    console.error('[Activity QR] Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    )
  }
}
