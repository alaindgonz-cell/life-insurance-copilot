import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await prisma.callSession.findUnique({
      where: { id: params.id },
      include: {
        transcript: { orderBy: { timestamp: 'asc' } },
      },
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const lines: string[] = [
      `Life Insurance Copilot — Call Transcript`,
      `${'='.repeat(50)}`,
      ``,
      `Session ID: ${session.id}`,
      `Prospect: ${session.prospectName ?? 'Unknown'}`,
      session.prospectPhone ? `Phone: ${session.prospectPhone}` : '',
      `Date: ${session.startedAt.toISOString()}`,
      `Status: ${session.status}`,
      ``,
      `${'='.repeat(50)}`,
      `TRANSCRIPT`,
      `${'='.repeat(50)}`,
      ``,
      ...session.transcript.map(
        (seg) =>
          `[${new Date(seg.timestamp).toLocaleTimeString()}] ${seg.speaker.toUpperCase()}: ${seg.text}`
      ),
    ].filter((l) => l !== null)

    const text = lines.join('\n')

    return new NextResponse(text, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="call-${session.id.slice(0, 8)}.txt"`,
      },
    })
  } catch (error) {
    console.error('[API] Export error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
