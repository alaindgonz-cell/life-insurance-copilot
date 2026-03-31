import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { suggestions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const UpdateSuggestionSchema = z.object({
  accepted: z.boolean().optional(),
  shown: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; suggestionId: string }> }
) {
  try {
    const { id, suggestionId } = await params;
    const body = await request.json();
    const data = UpdateSuggestionSchema.parse(body);

    const [updated] = await db.update(suggestions)
      .set(data)
      .where(and(eq(suggestions.id, suggestionId), eq(suggestions.callId, id)))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    logger.error({ error }, 'Error updating suggestion');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
