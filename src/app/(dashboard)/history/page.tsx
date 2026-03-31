import Link from 'next/link'
import { prisma } from '@/lib/db/client'
import { formatDuration, formatDate } from '@/lib/utils/format'

export default async function HistoryPage() {
  const sessions = await prisma.callSession.findMany({
    orderBy: { startedAt: 'desc' },
    take: 50,
    include: {
      _count: { select: { transcript: true, suggestions: true } },
    },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Call History</h1>
        <Link
          href="/dashboard/call"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + New Call
        </Link>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm">
          <p className="text-gray-500 text-lg mb-4">No calls yet</p>
          <Link
            href="/dashboard/call"
            className="text-blue-600 hover:underline font-medium"
          >
            Start your first call
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prospect
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transcript
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Suggestions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">View</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sessions.map((session) => {
                const duration =
                  session.endedAt
                    ? formatDuration(
                        (new Date(session.endedAt).getTime() -
                          new Date(session.startedAt).getTime()) /
                          1000
                      )
                    : 'Ongoing'

                return (
                  <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {session.prospectName ?? 'Unknown Prospect'}
                      </div>
                      {session.prospectPhone && (
                        <div className="text-sm text-gray-500">{session.prospectPhone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(session.startedAt.toISOString())}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{duration}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {session._count.transcript} lines
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {session._count.suggestions} shown
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          session.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {session.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      <Link
                        href={`/dashboard/sessions/${session.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
