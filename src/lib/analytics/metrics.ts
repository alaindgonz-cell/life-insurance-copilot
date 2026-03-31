import { prisma } from '../db/client'

export interface DailyCallCount {
  date: string
  count: number
}

export interface AgentStats {
  agentId: string
  name: string | null
  email: string
  totalCalls: number
  avgDurationSeconds: number
  suggestionsAccepted: number
}

export interface TopObjection {
  trigger: string
  count: number
}

export async function getDailyCallCounts(days = 30): Promise<DailyCallCount[]> {
  const since = new Date()
  since.setDate(since.getDate() - days)

  const sessions = await prisma.callSession.findMany({
    where: { startedAt: { gte: since } },
    select: { startedAt: true },
    orderBy: { startedAt: 'asc' },
  })

  // Group by date
  const counts = new Map<string, number>()
  for (const s of sessions) {
    const date = s.startedAt.toISOString().slice(0, 10)
    counts.set(date, (counts.get(date) ?? 0) + 1)
  }

  // Fill in zero-count days
  const result: DailyCallCount[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const date = d.toISOString().slice(0, 10)
    result.push({ date, count: counts.get(date) ?? 0 })
  }

  return result
}

export async function getAverageCallDuration(): Promise<number> {
  const sessions = await prisma.callSession.findMany({
    where: {
      status: 'ended',
      endedAt: { not: null },
    },
    select: { startedAt: true, endedAt: true },
  })

  if (sessions.length === 0) return 0

  const totalSeconds = sessions.reduce((sum, s) => {
    if (!s.endedAt) return sum
    return sum + (new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime()) / 1000
  }, 0)

  return Math.round(totalSeconds / sessions.length)
}

export async function getTopObjections(limit = 5): Promise<TopObjection[]> {
  const suggestions = await prisma.aISuggestion.findMany({
    where: { type: 'objection_handler', trigger: { not: null } },
    select: { trigger: true },
  })

  const counts = new Map<string, number>()
  for (const s of suggestions) {
    if (!s.trigger) continue
    counts.set(s.trigger, (counts.get(s.trigger) ?? 0) + 1)
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([trigger, count]) => ({ trigger, count }))
}

export async function getSuggestionAcceptanceRate(): Promise<{
  total: number
  accepted: number
  rate: number
}> {
  const [total, accepted] = await Promise.all([
    prisma.aISuggestion.count(),
    prisma.aISuggestion.count({ where: { accepted: true } }),
  ])

  return {
    total,
    accepted,
    rate: total > 0 ? Math.round((accepted / total) * 100) : 0,
  }
}

export async function getAgentLeaderboard(): Promise<AgentStats[]> {
  const users = await prisma.user.findMany({
    include: {
      callSessions: {
        select: {
          startedAt: true,
          endedAt: true,
          suggestions: { select: { accepted: true } },
        },
      },
    },
  })

  return users
    .map((user) => {
      const totalCalls = user.callSessions.length
      const completedSessions = user.callSessions.filter((s) => s.endedAt)
      const totalDurationSeconds =
        completedSessions.reduce(
          (sum, s) =>
            sum + (s.endedAt ? (new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime()) / 1000 : 0),
          0
        )
      const avgDurationSeconds =
        completedSessions.length > 0
          ? Math.round(totalDurationSeconds / completedSessions.length)
          : 0

      const suggestionsAccepted = user.callSessions
        .flatMap((s) => s.suggestions)
        .filter((s) => s.accepted).length

      return {
        agentId: user.id,
        name: user.name,
        email: user.email,
        totalCalls,
        avgDurationSeconds,
        suggestionsAccepted,
      }
    })
    .sort((a, b) => b.totalCalls - a.totalCalls)
}
