import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { redis } from '@/lib/redis';
import { sql } from 'drizzle-orm';

export async function GET() {
  const checks: Record<string, { status: string; latencyMs?: number }> = {};

  // Check PostgreSQL
  try {
    const start = Date.now();
    await db.execute(sql`SELECT 1`);
    checks.postgres = { status: 'ok', latencyMs: Date.now() - start };
  } catch {
    checks.postgres = { status: 'error' };
  }

  // Check Redis
  try {
    const start = Date.now();
    await redis.ping();
    checks.redis = { status: 'ok', latencyMs: Date.now() - start };
  } catch {
    checks.redis = { status: 'error' };
  }

  const allHealthy = Object.values(checks).every((c) => c.status === 'ok');

  return NextResponse.json(
    {
      status: allHealthy ? 'healthy' : 'degraded',
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: allHealthy ? 200 : 503 }
  );
}
