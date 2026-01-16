import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { validateKeywords } from '@/lib/services/keywordExtractionService'
import { matchKeywords } from '@/lib/utils/keywordMatcher'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { keywords, studentResponse, useAdvancedMatching = false, minSimilarity = 0.8 } = body

    // Validate input
    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { error: 'keywords must be a non-empty array' },
        { status: 400 }
      )
    }

    if (!studentResponse || typeof studentResponse !== 'string') {
      return NextResponse.json(
        { error: 'studentResponse is required and must be a string' },
        { status: 400 }
      )
    }

    if (studentResponse.length < 10) {
      return NextResponse.json(
        { error: 'studentResponse must be at least 10 characters' },
        { status: 400 }
      )
    }

    // Use advanced matching if requested
    if (useAdvancedMatching) {
      const result = matchKeywords(keywords, studentResponse, { minSimilarity })
      return NextResponse.json({
        matches: result.results.map((r) => ({
          keyword: r.keyword,
          found: r.matched,
          matchType: r.score === 1 ? 'exact' : r.matched ? 'fuzzy' : 'not_found',
          score: r.score,
          matchedWord: r.matchedWord,
        })),
        totalMatched: result.matchedCount,
        matchRate: result.matchRate,
        method: 'advanced',
      })
    }

    // Use basic validation
    const result = validateKeywords({
      keywords,
      studentResponse,
    })

    return NextResponse.json({
      ...result,
      method: 'basic',
    })
  } catch (error) {
    console.error('Failed to validate keywords:', error)
    return NextResponse.json({ error: 'Failed to validate keywords' }, { status: 500 })
  }
}
