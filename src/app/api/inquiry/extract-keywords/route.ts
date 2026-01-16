import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { extractKeywords } from '@/lib/services/keywordExtractionService'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { chapterText, pool1Count = 5, pool2Count = 5, activityContext } = body

    // Validate input
    if (!chapterText || typeof chapterText !== 'string') {
      return NextResponse.json(
        { error: 'chapterText is required and must be a string' },
        { status: 400 }
      )
    }

    if (chapterText.length < 100) {
      return NextResponse.json(
        { error: 'chapterText must be at least 100 characters' },
        { status: 400 }
      )
    }

    if (pool1Count < 3 || pool1Count > 15 || pool2Count < 3 || pool2Count > 15) {
      return NextResponse.json(
        { error: 'pool1Count and pool2Count must be between 3 and 15' },
        { status: 400 }
      )
    }

    const result = await extractKeywords({
      chapterText,
      pool1Count,
      pool2Count,
      activityContext,
    })

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to extract keywords. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to extract keywords:', error)
    return NextResponse.json({ error: 'Failed to extract keywords' }, { status: 500 })
  }
}
