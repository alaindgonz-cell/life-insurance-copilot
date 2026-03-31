import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import {
  getDailyCallCounts,
  getAverageCallDuration,
  getTopObjections,
  getSuggestionAcceptanceRate,
  getAgentLeaderboard,
} from '@/lib/analytics/metrics'

export async function GET() {
  try {
    const [dailyCalls, avgDuration, topObjections, acceptance, leaderboard] =
      await Promise.all([
        getDailyCallCounts(30),
        getAverageCallDuration(),
        getTopObjections(5),
        getSuggestionAcceptanceRate(),
        getAgentLeaderboard(),
      ])

    return NextResponse.json({
      dailyCalls,
      avgDurationSeconds: avgDuration,
      topObjections,
      suggestionAcceptance: acceptance,
      leaderboard,
    })
  } catch (error) {
    console.error('[API] Analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
