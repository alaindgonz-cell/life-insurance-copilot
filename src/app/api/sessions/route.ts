import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calls } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const CreateSessionSchema = z.object({
  agentId: z.string().uuid(),
  prospectName: z.string().optional(),
  prospectPhone: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = CreateSessionSchema.parse(body);

    const [session] = await db.insert(calls).values({
      agentId: data.agentId,
      prospectName: data.prospectName,
      prospectPhone: data.prospectPhone,
      status: 'active',
    }).returning();

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    logger.error({ error }, 'Error creating session');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');

    const sessions = await db.select()
      .from(calls)
      .where(agentId ? eq(calls.agentId, agentId) : undefined)
      .orderBy(desc(calls.startedAt))
      .limit(50);

    return NextResponse.json(sessions);
  } catch (error) {
    logger.error({ error }, 'Error listing sessions');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
