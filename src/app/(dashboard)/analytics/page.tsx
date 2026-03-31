import { formatDuration } from '@/lib/utils/format'
import {
  getDailyCallCounts,
  getAverageCallDuration,
  getTopObjections,
  getSuggestionAcceptanceRate,
  getAgentLeaderboard,
} from '@/lib/analytics/metrics'

export default async function AnalyticsPage() {
  const [dailyCalls, avgDuration, topObjections, acceptance, leaderboard] =
    await Promise.all([
      getDailyCallCounts(14),
      getAverageCallDuration(),
      getTopObjections(5),
      getSuggestionAcceptanceRate(),
      getAgentLeaderboard(),
    ])

  const totalCalls14d = dailyCalls.reduce((s, d) => s + d.count, 0)
  const maxCallsDay = Math.max(...dailyCalls.map((d) => d.count), 1)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Analytics</h1>

      {/* Top-line stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Calls (14d)', value: totalCalls14d.toString() },
          { label: 'Avg Duration', value: formatDuration(avgDuration) },
          { label: 'Suggestions Total', value: acceptance.total.toString() },
          { label: 'Acceptance Rate', value: `${acceptance.rate}%` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-lg shadow-sm p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              {label}
            </p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Daily calls chart (bar) */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Calls per Day (14 days)</h2>
          <div className="flex items-end gap-1 h-32">
            {dailyCalls.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-blue-500 rounded-t-sm min-h-[2px]"
                  style={{ height: `${(d.count / maxCallsDay) * 100}%` }}
                  title={`${d.date}: ${d.count} calls`}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>{dailyCalls[0]?.date.slice(5)}</span>
            <span>{dailyCalls[dailyCalls.length - 1]?.date.slice(5)}</span>
          </div>
        </div>

        {/* Top objections */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Top Objections</h2>
          {topObjections.length === 0 ? (
            <p className="text-gray-400 text-sm">No data yet</p>
          ) : (
            <div className="space-y-3">
              {topObjections.map((obj) => (
                <div key={obj.trigger} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate capitalize">&ldquo;{obj.trigger}&rdquo;</p>
                    <div className="mt-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full"
                        style={{
                          width: `${(obj.count / (topObjections[0]?.count ?? 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-600 flex-shrink-0">
                    {obj.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Agent leaderboard */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Agent Leaderboard</h2>
        </div>
        {leaderboard.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-400">No agents yet</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Agent', 'Total Calls', 'Avg Duration', 'Suggestions Used'].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaderboard.map((agent, i) => (
                <tr key={agent.agentId}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-400 w-4">{i + 1}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {agent.name ?? agent.email.split('@')[0]}
                        </p>
                        <p className="text-xs text-gray-400">{agent.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{agent.totalCalls}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {formatDuration(agent.avgDurationSeconds)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{agent.suggestionsAccepted}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
