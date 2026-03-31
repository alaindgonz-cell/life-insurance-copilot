import Link from 'next/link'
import { prisma } from '@/lib/db/client'

export default async function DashboardPage() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [activeCalls, todayCalls, totalSuggestions] = await Promise.all([
    prisma.callSession.count({ where: { status: 'active' } }),
    prisma.callSession.count({ where: { startedAt: { gte: today } } }),
    prisma.aISuggestion.count({ where: { accepted: true } }),
  ])

  const recentSessions = await prisma.callSession.findMany({
    orderBy: { startedAt: 'desc' },
    take: 5,
    include: { _count: { select: { transcript: true } } },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Link
          href="/dashboard/call"
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium"
        >
          + Start Call
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { label: 'Active Calls', value: activeCalls, color: 'text-green-600' },
          { label: "Today's Calls", value: todayCalls, color: 'text-blue-600' },
          { label: 'Suggestions Used', value: totalSuggestions, color: 'text-purple-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-lg shadow p-6">
            <h2 className="text-sm font-medium text-gray-500 mb-2">{label}</h2>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Recent calls */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent Calls</h2>
          <Link href="/dashboard/history" className="text-sm text-blue-600 hover:underline">
            View all
          </Link>
        </div>
        {recentSessions.length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-400">
            <p>No calls yet.</p>
            <Link href="/dashboard/call" className="text-blue-600 hover:underline text-sm mt-2 block">
              Start your first call
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {recentSessions.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/dashboard/sessions/${s.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {s.prospectName ?? 'Unknown Prospect'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(s.startedAt).toLocaleDateString()} · {s._count.transcript} transcript lines
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      s.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {s.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
