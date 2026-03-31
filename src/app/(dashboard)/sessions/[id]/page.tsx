export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { calls, transcripts, suggestions } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { formatDate, formatDuration } from '@/lib/utils/format';

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [session] = await db.select().from(calls).where(eq(calls.id, id));
  if (!session) notFound();

  const sessionTranscripts = await db.select().from(transcripts)
    .where(eq(transcripts.callId, id)).orderBy(asc(transcripts.timestamp));
  const sessionSuggestions = await db.select().from(suggestions)
    .where(eq(suggestions.callId, id)).orderBy(asc(suggestions.createdAt));

  const duration = session.endedAt && session.startedAt
    ? formatDuration((new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 1000)
    : 'Ongoing';

  const acceptedSuggestions = sessionSuggestions.filter((s) => s.accepted).length;

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard/history" className="hover:text-blue-600">Call History</Link>
          <span>/</span>
          <span>Session Detail</span>
        </div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{session.prospectName ?? 'Unknown Prospect'}</h1>
            {session.prospectPhone && <p className="text-gray-500">{session.prospectPhone}</p>}
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${session.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
            {session.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Date', value: session.startedAt ? formatDate(session.startedAt.toISOString()) : '' },
          { label: 'Duration', value: duration },
          { label: 'Transcript Lines', value: sessionTranscripts.length.toString() },
          { label: 'Suggestions Used', value: `${acceptedSuggestions} / ${sessionSuggestions.length}` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">{label}</p>
            <p className="text-lg font-semibold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Transcript</h2>
            </div>
            <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
              {sessionTranscripts.length === 0 ? (
                <p className="text-gray-400 text-sm">No transcript recorded</p>
              ) : (
                sessionTranscripts.map((seg) => (
                  <div key={seg.id} className={`flex gap-3 ${seg.speaker === 'agent' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-lg px-4 py-2 ${seg.speaker === 'agent' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                      <p className="text-xs font-medium mb-1 opacity-75 capitalize">{seg.speaker}</p>
                      <p className="text-sm">{seg.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">AI Suggestions</h2>
            </div>
            <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
              {sessionSuggestions.length === 0 ? (
                <p className="text-gray-400 text-sm p-2">No suggestions generated</p>
              ) : (
                sessionSuggestions.map((sug) => (
                  <div key={sug.id} className={`rounded-lg border p-3 text-sm ${sug.accepted ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-gray-500 uppercase">{(sug.type ?? '').replace('_', ' ')}</span>
                      {sug.accepted && <span className="text-xs text-green-600 font-medium">Used</span>}
                    </div>
                    <p className="text-gray-800 text-xs leading-relaxed">{sug.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <a href={`/api/sessions/${session.id}/export`} className="text-sm text-gray-600 hover:text-blue-600 underline">
          Export transcript as text
        </a>
      </div>
    </div>
  );
}
