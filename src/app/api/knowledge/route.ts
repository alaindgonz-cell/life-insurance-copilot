import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'

export const dynamic = 'force-dynamic'
import { z } from 'zod'
import { embedKnowledgeEntry } from '@/lib/embeddings/pipeline'

const CreateEntrySchema = z.object({
  category: z.enum(['objection', 'script', 'compliance', 'faq']),
  title: z.string().min(1),
  content: z.string().min(1),
  tags: z.array(z.string()).default([]),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    const entries = await prisma.knowledgeBase.findMany({
      where: category ? { category } : undefined,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        category: true,
        title: true,
        content: true,
        tags: true,
        createdAt: true,
      },
    })
    return NextResponse.json(entries)
  } catch (error) {
    console.error('[API] Error listing knowledge entries:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json()
    const data = CreateEntrySchema.parse(body)

    const entry = await prisma.knowledgeBase.create({ data })

    // Generate embedding in background
    embedKnowledgeEntry(entry.id).catch((err) =>
      console.error(`[API] Failed to embed knowledge entry ${entry.id}:`, err)
    )

    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('[API] Error creating knowledge entry:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
