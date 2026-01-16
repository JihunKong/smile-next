import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { generateGroupReport } from '@/lib/services/emailReportsService'
import { generateGroupReportHtml, generateGroupCsv } from '@/lib/services/pdfService'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: groupId } = await params
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'
    const startDate = searchParams.get('start_date') || undefined
    const endDate = searchParams.get('end_date') || undefined

    // Verify ownership
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { creatorId: true, name: true },
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    if (group.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const report = await generateGroupReport(groupId, startDate, endDate)
    if (!report) {
      return NextResponse.json({ error: 'Failed to generate report' }, { status: 400 })
    }

    const sanitizedName = group.name.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 30)
    const dateStr = new Date().toISOString().split('T')[0]

    if (format === 'html' || format === 'pdf') {
      const html = generateGroupReportHtml(report)
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `attachment; filename="group-${sanitizedName}-${dateStr}.html"`,
        },
      })
    } else {
      const csv = generateGroupCsv(report)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="group-${sanitizedName}-${dateStr}.csv"`,
        },
      })
    }
  } catch (error) {
    console.error('Failed to export group report:', error)
    return NextResponse.json({ error: 'Failed to export report' }, { status: 500 })
  }
}
