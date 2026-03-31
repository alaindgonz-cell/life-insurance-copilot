import { db } from '../db';
import { calls, suggestions, users } from '../db/schema';
import { eq, gte, count, sql } from 'drizzle-orm';

export interface DailyCallCount { date: string; count: number; }
export interface TopObjection { trigger: string; count: number; }

export async function getDailyCallCounts(days = 30): Promise<DailyCallCount[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const rows = await db.select({ startedAt: calls.startedAt })
    .from(calls)
    .where(gte(calls.startedAt, since));

  const counts = new Map<string, number>();
  for (const r of rows) {
    if (!r.startedAt) continue;
    const date = r.startedAt.toISOString().slice(0, 10);
    counts.set(date, (counts.get(date) ?? 0) + 1);
  }

  const result: DailyCallCount[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const date = d.toISOString().slice(0, 10);
    result.push({ date, count: counts.get(date) ?? 0 });
  }
  return result;
}

export async function getAverageCallDuration(): Promise<number> {
  const rows = await db.select({ startedAt: calls.startedAt, endedAt: calls.endedAt })
    .from(calls)
    .where(eq(calls.status, 'ended'));

  const completed = rows.filter(r => r.endedAt && r.startedAt);
  if (completed.length === 0) return 0;

  const totalSeconds = completed.reduce((sum, r) => {
    return sum + (new Date(r.endedAt!).getTime() - new Date(r.startedAt!).getTime()) / 1000;
  }, 0);
  return Math.round(totalSeconds / completed.length);
}

export async function getTopObjections(limit = 5): Promise<TopObjection[]> {
  const rows = await db.select({ trigger: suggestions.trigger })
    .from(suggestions)
    .where(eq(suggestions.type, 'objection_handler'));

  const counts = new Map<string, number>();
  for (const r of rows) {
    if (!r.trigger) continue;
    counts.set(r.trigger, (counts.get(r.trigger) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([trigger, count]) => ({ trigger, count }));
}

export async function getSuggestionAcceptanceRate() {
  const [totalResult] = await db.select({ value: count() }).from(suggestions);
  const [acceptedResult] = await db.select({ value: count() }).from(suggestions).where(eq(suggestions.accepted, true));

  const total = totalResult?.value ?? 0;
  const accepted = acceptedResult?.value ?? 0;
  return { total, accepted, rate: total > 0 ? Math.round((accepted / total) * 100) : 0 };
}

export async function getAgentLeaderboard() {
  const allUsers = await db.select().from(users);
  const allCalls = await db.select().from(calls);
  const allSuggestions = await db.select().from(suggestions);

  return allUsers.map(user => {
    const userCalls = allCalls.filter(c => c.agentId === user.id);
    const completed = userCalls.filter(c => c.endedAt && c.startedAt);
    const totalDuration = completed.reduce((sum, c) =>
      sum + (new Date(c.endedAt!).getTime() - new Date(c.startedAt!).getTime()) / 1000, 0);

    const callIds = new Set(userCalls.map(c => c.id));
    const userSuggestions = allSuggestions.filter(s => s.callId && callIds.has(s.callId));

    return {
      agentId: user.id,
      name: user.name,
      email: user.email,
      totalCalls: userCalls.length,
      avgDurationSeconds: completed.length > 0 ? Math.round(totalDuration / completed.length) : 0,
      suggestionsAccepted: userSuggestions.filter(s => s.accepted).length,
    };
  }).sort((a, b) => b.totalCalls - a.totalCalls);
}
