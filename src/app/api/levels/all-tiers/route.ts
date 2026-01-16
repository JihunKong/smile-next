import { NextResponse } from 'next/server'
import { getAllTiers, TIERS } from '@/lib/services/levelService'

/**
 * GET: Get all tier information
 */
export async function GET() {
  try {
    const tiers = getAllTiers()

    return NextResponse.json({
      tiers,
      totalTiers: Object.keys(TIERS).length,
    })
  } catch (error) {
    console.error('[GET /api/levels/all-tiers] Error:', error)
    return NextResponse.json(
      { error: 'Failed to get tiers' },
      { status: 500 }
    )
  }
}
