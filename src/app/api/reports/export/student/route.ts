import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { generateStudentWeeklyReport } from '@/lib/services/emailReportsService'
import { generateStudentReportHtml, generateStudentCsv } from '@/lib/services/pdfService'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'

    const report = await generateStudentWeeklyReport(session.user.id)
    if (!report) {
      return NextResponse.json({ error: 'Failed to generate report' }, { status: 400 })
    }

    if (format === 'html' || format === 'pdf') {
      const html = generateStudentReportHtml(report)
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `attachment; filename="student-report-${report.weekEnding}.html"`,
        },
      })
    } else {
      const csv = generateStudentCsv(report)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="student-report-${report.weekEnding}.csv"`,
        },
      })
    }
  } catch (error) {
    console.error('Failed to export student report:', error)
    return NextResponse.json({ error: 'Failed to export report' }, { status: 500 })
  }
}
