import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/groups/[id]/qr
 * Generate QR code for joining a group
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get the group
    const group = await prisma.group.findUnique({
      where: { id, isDeleted: false },
      select: {
        id: true,
        name: true,
        inviteCode: true,
        creatorId: true,
        isPrivate: true,
        requirePasscode: true,
      },
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Only group admin/creator can generate QR for private groups
    if (group.isPrivate) {
      const membership = await prisma.groupUser.findUnique({
        where: {
          userId_groupId: {
            userId: session.user.id,
            groupId: id,
          },
        },
      })

      if (!membership && group.creatorId !== session.user.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      // For private groups, require admin role
      if (membership && membership.role < 1 && group.creatorId !== session.user.id) {
        return NextResponse.json(
          { error: 'Only group admins can generate QR codes for private groups' },
          { status: 403 }
        )
      }
    }

    // Get the format from query params
    const format = request.nextUrl.searchParams.get('format') || 'png'
    const size = parseInt(request.nextUrl.searchParams.get('size') || '300')
    const type = request.nextUrl.searchParams.get('type') || 'join' // join or view

    // Build the URL
    const baseUrl = process.env.NEXTAUTH_URL || 'https://smile.pknic.kr'
    let groupUrl: string

    if (type === 'join' && group.inviteCode) {
      // URL with invite code for joining
      groupUrl = `${baseUrl}/groups/join?code=${group.inviteCode}`
    } else {
      // Direct group view URL
      groupUrl = `${baseUrl}/groups/${id}`
    }

    if (format === 'svg') {
      const svg = await QRCode.toString(groupUrl, {
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
      const dataUrl = await QRCode.toDataURL(groupUrl, {
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
          url: groupUrl,
          group: {
            id: group.id,
            name: group.name,
            hasPasscode: group.requirePasscode,
          },
        },
      })
    } else {
      const buffer = await QRCode.toBuffer(groupUrl, {
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
          'Content-Disposition': `inline; filename="group-${id}-qr.png"`,
        },
      })
    }
  } catch (error) {
    console.error('[Group QR] Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    )
  }
}
