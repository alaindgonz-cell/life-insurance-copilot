import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db/client'
import { formatDate, formatDuration } from '@/lib/utils/format'

interface SessionPageProps {
  params: { id: string }
}

export default async function SessionDetailPage({ params }: SessionPageProps) {
  const session = await prisma.callSession.findUnique({
    where: { id: params.id },
    include: {
      transcript: { orderBy: { timestamp: 'asc' } },
      suggestions: { orderBy: { createdAt: 'asc' } },
    },
  })

  if (!session) notFound()

  const duration =
    session.endedAt
      ? formatDuration(
          (new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 1000
        )
      : 'Ongoing'

  const acceptedSuggestions = session.suggestions.filter((s) => s.accepted).length

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard/history" className="hover:text-blue-600">
            Call History
          </Link>
          <span>/</span>
          <span>Session Detail</span>
        </div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {session.prospectName ?? 'Unknown Prospect'}
            </h1>
            {session.prospectPhone && (
              <p className="text-gray-500">{session.prospectPhone}</p>
            )}
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm font-semibold ${
              session.status === 'active'
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {session.status}
          </span>
        </div>
      </div>

      {/* Metadata cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Date', value: formatDate(session.startedAt.toISOString()) },
          { label: 'Duration', value: duration },
          { label: 'Transcript Lines', value: session.transcript.length.toString() },
          { label: 'Suggestions Used', value: `${acceptedSuggestions} / ${session.suggestions.length}` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">
              {label}
            </p>
            <p className="text-lg font-semibold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transcript */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Transcript</h2>
            </div>
            <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
              {session.transcript.length === 0 ? (
                <p className="text-gray-400 text-sm">No transcript recorded</p>
              ) : (
                session.transcript.map((seg) => (
                  <div
                    key={seg.id}
                    className={`flex gap-3 ${seg.speaker === 'agent' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        seg.speaker === 'agent'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-xs font-medium mb-1 opacity-75 capitalize">
                        {seg.speaker}
                      </p>
                      <p className="text-sm">{seg.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* AI Suggestions sidebar */}
        <div>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">AI Suggestions</h2>
            </div>
            <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
              {session.suggestions.length === 0 ? (
                <p className="text-gray-400 text-sm p-2">No suggestions generated</p>
              ) : (
                session.suggestions.map((sug) => (
                  <div
                    key={sug.id}
                    className={`rounded-lg border p-3 text-sm ${
                      sug.accepted
                        ? 'border-green-200 bg-green-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-gray-500 uppercase">
                        {sug.type.replace('_', ' ')}
                      </span>
                      {sug.accepted && (
                        <span className="text-xs text-green-600 font-medium">✓ Used</span>
                      )}
                    </div>
                    <p className="text-gray-800 text-xs leading-relaxed">{sug.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Export button */}
      <div className="mt-6">
        <a
          href={`/api/sessions/${session.id}/export`}
          className="text-sm text-gray-600 hover:text-blue-600 underline"
        >
          Export transcript as text
        </a>
      </div>
    </div>
  )
}
