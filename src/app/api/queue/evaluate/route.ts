import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { queueQuestionEvaluation, queueResponseEvaluation, EvaluationJob, ResponseEvaluationJob } from '@/lib/queue/bull'

export const runtime = 'nodejs'

interface QuestionEvaluationRequest {
  type: 'question'
  data: EvaluationJob
}

interface ResponseEvaluationRequest {
  type: 'response'
  data: ResponseEvaluationJob
}

type EvaluationRequest = QuestionEvaluationRequest | ResponseEvaluationRequest

export async function POST(request: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json() as EvaluationRequest

    if (body.type === 'question') {
      // Verify user matches the job's userId
      if (body.data.userId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const job = await queueQuestionEvaluation(body.data)
      return NextResponse.json({ success: true, jobId: job.id })
    } else if (body.type === 'response') {
      const job = await queueResponseEvaluation(body.data)
      return NextResponse.json({ success: true, jobId: job.id })
    }

    return NextResponse.json({ error: 'Invalid evaluation type' }, { status: 400 })
  } catch (error) {
    console.error('Failed to queue evaluation:', error)
    return NextResponse.json(
      { error: 'Failed to queue evaluation' },
      { status: 500 }
    )
  }
}
