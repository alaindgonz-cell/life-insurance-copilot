import { NextResponse } from 'next/server'
import { scriptChecklist } from '@/server/scriptChecklist'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const progress = scriptChecklist.getProgress(params.id)
  return NextResponse.json(progress)
}
