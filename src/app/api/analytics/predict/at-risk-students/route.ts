import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { getAtRiskStudents } from '@/lib/services/predictiveAnalyticsService'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('group_id') || undefined

    // If groupId provided, verify ownership
    if (groupId) {
      const group = await prisma.group.findUnique({
        where: { id: groupId },
        select: { creatorId: true },
      })

      if (!group) {
        return NextResponse.json({ error: 'Group not found' }, { status: 404 })
      }

      if (group.creatorId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const atRiskStudents = await getAtRiskStudents(groupId)

    return NextResponse.json({
      students: atRiskStudents,
      totalAtRisk: atRiskStudents.length,
      highRiskCount: atRiskStudents.filter((s) => s.riskLevel === 'high').length,
      mediumRiskCount: atRiskStudents.filter((s) => s.riskLevel === 'medium').length,
      lowRiskCount: atRiskStudents.filter((s) => s.riskLevel === 'low').length,
    })
  } catch (error) {
    console.error('Failed to get at-risk students:', error)
    return NextResponse.json({ error: 'Failed to get at-risk students' }, { status: 500 })
  }
}
