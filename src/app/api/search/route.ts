import { NextResponse } from 'next/server'
import { semanticSearch } from '@/lib/db/search'
import { z } from 'zod'

const SearchSchema = z.object({
  q: z.string().min(1).max(500),
  topK: z.coerce.number().min(1).max(20).default(5),
  types: z.array(z.enum(['product', 'knowledge'])).optional(),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const params = SearchSchema.parse({
      q: searchParams.get('q') ?? '',
      topK: searchParams.get('topK') ?? 5,
      types: searchParams.getAll('type').length > 0 ? searchParams.getAll('type') : undefined,
    })

    const results = await semanticSearch(params.q, {
      topK: params.topK,
      types: params.types as Array<'product' | 'knowledge'> | undefined,
    })

    return NextResponse.json({ results, query: params.q })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('[API] Search error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
