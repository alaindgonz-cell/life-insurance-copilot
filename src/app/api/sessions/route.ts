import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { z } from 'zod'

const CreateSessionSchema = z.object({
  agentId: z.string().uuid(),
  prospectName: z.string().optional(),
  prospectPhone: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json()
    const data = CreateSessionSchema.parse(body)

    const session = await prisma.callSession.create({
      data: {
        agentId: data.agentId,
        prospectName: data.prospectName,
        prospectPhone: data.prospectPhone,
        status: 'active',
      },
    })

    return NextResponse.json(session, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('[API] Error creating session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agentId')

    const sessions = await prisma.callSession.findMany({
      where: agentId ? { agentId } : undefined,
      orderBy: { startedAt: 'desc' },
      take: 50,
      select: {
        id: true,
        agentId: true,
        prospectName: true,
        prospectPhone: true,
        status: true,
        startedAt: true,
        endedAt: true,
        _count: { select: { transcript: true } },
      },
    })

    return NextResponse.json(sessions)
  } catch (error) {
    console.error('[API] Error listing sessions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
