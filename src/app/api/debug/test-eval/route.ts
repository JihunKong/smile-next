import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { queueResponseEvaluation } from '@/lib/queue/bull'
import { prisma } from '@/lib/db/prisma'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is admin or teacher (roleId 0 or 1)
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { roleId: true },
  })

  if (!user || user.roleId > 1) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { responseId } = await request.json()

    if (!responseId) {
      return NextResponse.json({ error: 'responseId is required' }, { status: 400 })
    }

    // Get the response with question content
    const response = await prisma.response.findUnique({
      where: { id: responseId },
      include: {
        question: {
          select: {
            content: true,
          },
        },
      },
    })

    if (!response) {
      return NextResponse.json({ error: 'Response not found' }, { status: 404 })
    }

    console.log(`[Debug Test Eval] Manually queueing evaluation for response ${responseId}`)

    // Queue the evaluation
    const job = await queueResponseEvaluation({
      responseId: response.id,
      responseContent: response.content,
      questionContent: response.question.content,
    })

    // Update status to evaluating
    await prisma.response.update({
      where: { id: responseId },
      data: { aiEvaluationStatus: 'evaluating' },
    })

    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: `Evaluation job ${job.id} queued for response ${responseId}`,
    })
  } catch (error) {
    console.error('[Debug Test Eval] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to queue evaluation',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
