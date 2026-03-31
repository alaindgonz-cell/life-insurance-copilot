import { NextResponse } from 'next/server';
import { scriptChecklist } from '@/server/scriptChecklist';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const progress = scriptChecklist.getProgress(id);
  return NextResponse.json(progress);
}
