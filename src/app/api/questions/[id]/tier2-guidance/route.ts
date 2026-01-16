import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { getTier2Guidance, generateTier2Guidance } from '@/lib/services/tier2GuidanceService'

// GET - Retrieve existing Tier 2 guidance
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: questionId } = await params

    const guidance = await getTier2Guidance(questionId)

    if (!guidance) {
      return NextResponse.json(
        { error: 'No Tier 2 guidance found. Use POST to generate.' },
        { status: 404 }
      )
    }

    return NextResponse.json(guidance)
  } catch (error) {
    console.error('Failed to get Tier 2 guidance:', error)
    return NextResponse.json({ error: 'Failed to get guidance' }, { status: 500 })
  }
}

// POST - Generate new Tier 2 guidance
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: questionId } = await params

    const guidance = await generateTier2Guidance(questionId, session.user.id)

    if (!guidance) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    return NextResponse.json(guidance)
  } catch (error) {
    console.error('Failed to generate Tier 2 guidance:', error)
    return NextResponse.json({ error: 'Failed to generate guidance' }, { status: 500 })
  }
}
