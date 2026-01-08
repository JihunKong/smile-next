import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export const runtime = 'nodejs'

/**
 * Get AI evaluation status for a specific response
 * Used for polling to detect when evaluation completes
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'Response ID is required' }, { status: 400 })
    }

    const response = await prisma.response.findUnique({
      where: { id },
      select: {
        id: true,
        aiEvaluationStatus: true,
        aiEvaluationRating: true,
        aiEvaluationScore: true,
        aiEvaluationFeedback: true,
        aiEvaluationTimestamp: true,
      },
    })

    if (!response) {
      return NextResponse.json({ error: 'Response not found' }, { status: 404 })
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[Response Status API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to get response status' },
      { status: 500 }
    )
  }
}
