import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await prisma.callSession.findUnique({
      where: { id: params.id },
      include: {
        transcript: { orderBy: { timestamp: 'asc' } },
        suggestions: { orderBy: { createdAt: 'asc' } },
      },
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    return NextResponse.json(session)
  } catch (error) {
    console.error('[API] Error fetching session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
