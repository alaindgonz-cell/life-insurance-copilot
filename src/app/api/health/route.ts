import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'

export async function GET() {
  const health: {
    status: string
    timestamp: string
    checks: Record<string, { status: string; latencyMs?: number; error?: string }>
  } = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    checks: {},
  }

  // Database check
  const dbStart = Date.now()
  try {
    await prisma.$queryRaw`SELECT 1`
    health.checks.database = { status: 'ok', latencyMs: Date.now() - dbStart }
  } catch (error) {
    health.checks.database = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
    health.status = 'degraded'
  }

  // Redis check (optional — don't fail health if Redis is down)
  try {
    const { getRedisClient } = await import('@/lib/redis/client')
    const redisStart = Date.now()
    const client = await getRedisClient()
    await client.ping()
    health.checks.redis = { status: 'ok', latencyMs: Date.now() - redisStart }
  } catch {
    health.checks.redis = { status: 'degraded', error: 'Redis unavailable' }
  }

  const statusCode = health.status === 'ok' ? 200 : 503
  return NextResponse.json(health, { status: statusCode })
}
