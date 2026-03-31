import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { z } from 'zod'

const UpdateSuggestionSchema = z.object({
  accepted: z.boolean().optional(),
  shown: z.boolean().optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; suggestionId: string } }
) {
  try {
    const body: unknown = await request.json()
    const data = UpdateSuggestionSchema.parse(body)

    const suggestion = await prisma.aISuggestion.update({
      where: {
        id: params.suggestionId,
        sessionId: params.id,
      },
      data,
    })

    return NextResponse.json(suggestion)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('[API] Error updating suggestion:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
