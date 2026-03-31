import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { knowledgeCards } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { embedKnowledgeEntry } from '@/lib/embeddings/pipeline';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const CreateEntrySchema = z.object({
  category: z.enum(['objection', 'script', 'compliance', 'faq']),
  title: z.string().min(1),
  content: z.string().min(1),
  tags: z.array(z.string()).default([]),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const entries = await db.select({
      id: knowledgeCards.id, category: knowledgeCards.category,
      title: knowledgeCards.title, content: knowledgeCards.content,
      tags: knowledgeCards.tags, createdAt: knowledgeCards.createdAt,
    }).from(knowledgeCards)
      .where(category ? eq(knowledgeCards.category, category) : undefined)
      .orderBy(desc(knowledgeCards.createdAt));

    return NextResponse.json(entries);
  } catch (error) {
    logger.error({ error }, 'Error listing knowledge entries');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = CreateEntrySchema.parse(body);

    const [entry] = await db.insert(knowledgeCards).values(data).returning();
    embedKnowledgeEntry(entry.id).catch(err => logger.error({ error: err }, `Failed to embed entry ${entry.id}`));

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    logger.error({ error }, 'Error creating knowledge entry');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
