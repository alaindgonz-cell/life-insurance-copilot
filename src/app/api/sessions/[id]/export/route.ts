import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calls, transcripts } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [session] = await db.select().from(calls).where(eq(calls.id, id));

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const segments = await db.select().from(transcripts)
      .where(eq(transcripts.callId, id)).orderBy(asc(transcripts.timestamp));

    const lines = [
      'Life Insurance Copilot — Call Transcript',
      '='.repeat(50),
      '',
      `Session ID: ${session.id}`,
      `Prospect: ${session.prospectName ?? 'Unknown'}`,
      session.prospectPhone ? `Phone: ${session.prospectPhone}` : '',
      `Date: ${session.startedAt?.toISOString() ?? ''}`,
      `Status: ${session.status}`,
      '',
      '='.repeat(50),
      'TRANSCRIPT',
      '='.repeat(50),
      '',
      ...segments.map(seg =>
        `[${seg.timestamp ? new Date(seg.timestamp).toLocaleTimeString() : ''}] ${(seg.speaker ?? '').toUpperCase()}: ${seg.content}`
      ),
    ].filter(l => l !== null);

    return new NextResponse(lines.join('\n'), {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="call-${session.id.slice(0, 8)}.txt"`,
      },
    });
  } catch (error) {
    logger.error({ error }, 'Export error');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
