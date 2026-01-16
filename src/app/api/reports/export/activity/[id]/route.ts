import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { generateActivityReport } from '@/lib/services/emailReportsService'
import { generateActivityReportHtml, generateActivityCsv } from '@/lib/services/pdfService'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: activityId } = await params
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'
    const startDate = searchParams.get('start_date') || undefined
    const endDate = searchParams.get('end_date') || undefined

    // Verify access
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      select: { creatorId: true, owningGroupId: true, name: true },
    })

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    const isOwner = activity.creatorId === session.user.id
    const isGroupOwner = activity.owningGroupId
      ? await prisma.group.findFirst({
          where: { id: activity.owningGroupId, creatorId: session.user.id },
        })
      : null

    if (!isOwner && !isGroupOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const report = await generateActivityReport(activityId, startDate, endDate)
    if (!report) {
      return NextResponse.json({ error: 'Failed to generate report' }, { status: 400 })
    }

    const sanitizedName = activity.name.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 30)
    const dateStr = new Date().toISOString().split('T')[0]

    if (format === 'html' || format === 'pdf') {
      const html = generateActivityReportHtml(report)
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `attachment; filename="activity-${sanitizedName}-${dateStr}.html"`,
        },
      })
    } else {
      const csv = generateActivityCsv(report)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="activity-${sanitizedName}-${dateStr}.csv"`,
        },
      })
    }
  } catch (error) {
    console.error('Failed to export activity report:', error)
    return NextResponse.json({ error: 'Failed to export report' }, { status: 500 })
  }
}
