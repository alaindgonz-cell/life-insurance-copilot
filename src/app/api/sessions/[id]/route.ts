import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calls, transcripts, suggestions } from '@/lib/db/schema';
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

    const sessionTranscripts = await db.select().from(transcripts)
      .where(eq(transcripts.callId, id)).orderBy(asc(transcripts.timestamp));
    const sessionSuggestions = await db.select().from(suggestions)
      .where(eq(suggestions.callId, id)).orderBy(asc(suggestions.createdAt));

    return NextResponse.json({ ...session, transcripts: sessionTranscripts, suggestions: sessionSuggestions });
  } catch (error) {
    logger.error({ error }, 'Error fetching session');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
