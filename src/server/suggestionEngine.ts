import { v4 as uuidv4 } from 'uuid';
import { createLLMClient } from '../lib/llm';
import { transcriptBuffer } from './transcriptBuffer';
import { detectTriggers } from './triggerDetector';
import { redis } from '../lib/redis';
import { db } from '../lib/db';
import { suggestions } from '../lib/db/schema';
import { sessionManager } from './sessionManager';
import { logger } from '../lib/logger';
import type { SuggestionMessage } from '../types';

const seLogger = logger.child({ component: 'suggestion-engine' });

const lastSuggestionTime = new Map<string, number>();
const DEBOUNCE_MS = 8000;

function debounceKey(sessionId: string, type: string): string {
  return `${sessionId}:${type}`;
}

function isDebounced(sessionId: string, type: string): boolean {
  const key = debounceKey(sessionId, type);
  const last = lastSuggestionTime.get(key) ?? 0;
  return Date.now() - last < DEBOUNCE_MS;
}

function markSuggested(sessionId: string, type: string): void {
  lastSuggestionTime.set(debounceKey(sessionId, type), Date.now());
}

export async function processFinalTranscript(
  sessionId: string,
  speaker: string,
  text: string
): Promise<void> {
  transcriptBuffer.push(sessionId, speaker, text);

  const triggers = detectTriggers(text);
  if (triggers.length === 0) return;

  const session = sessionManager.get(sessionId);
  if (!session) return;

  for (const trigger of triggers) {
    if (isDebounced(sessionId, trigger.type)) continue;

    markSuggested(sessionId, trigger.type);

    generateAndSendSuggestion(sessionId, trigger.type, trigger.matchedKeywords[0] ?? text).catch(
      (err) => seLogger.error({ sessionId, error: err }, 'Error generating suggestion')
    );
  }
}

const systemPrompts: Record<string, string> = {
  product_info: `You are a life insurance product expert. Based on the conversation context,
    provide a concise (2-3 sentences) product recommendation or information point that would
    help the agent. Focus on specific product features relevant to what the prospect said.`,
  objection_handler: `You are an expert insurance sales trainer. Based on the objection raised
    in the conversation, provide a concise (2-3 sentences) response strategy. Be empathetic
    and address the specific concern mentioned.`,
  compliance: `You are a life insurance compliance officer. Flag any compliance-sensitive
    statements and provide the correct phrasing. Keep responses brief and actionable.`,
  tip: `You are an experienced insurance sales coach. Based on the conversation flow,
    provide a brief (1-2 sentence) tactical tip to help move the conversation forward.`,
};

async function generateAndSendSuggestion(
  sessionId: string,
  type: 'product_info' | 'objection_handler' | 'compliance' | 'tip',
  trigger: string
): Promise<void> {
  const context = transcriptBuffer.getContext(sessionId, 8);
  if (!context.trim()) return;

  seLogger.info({ sessionId, type }, 'Generating suggestion');

  // Fetch grounding context via vector search
  let groundingContext = '';
  try {
    const { semanticSearch } = await import('../lib/db/search');
    const searchResults = await semanticSearch(trigger || context.slice(-200), { topK: 3 });
    if (searchResults.length > 0) {
      groundingContext = '\n\nRelevant product/knowledge context:\n' +
        searchResults.map((r) => `- ${r.title}: ${r.content.slice(0, 200)}`).join('\n');
    }
  } catch {
    // Non-fatal — proceed without grounding
  }

  const client = createLLMClient('suggestion');
  const response = await client.call({
    system: systemPrompts[type],
    messages: [{
      role: 'user',
      content: `Recent conversation:\n${context}${groundingContext}\n\nProvide a helpful ${type.replace('_', ' ')} suggestion for the agent.`,
    }],
    max_tokens: 256,
  });

  const suggestion = {
    id: uuidv4(),
    sessionId,
    type,
    content: response.content,
    trigger,
    shown: false,
    accepted: false,
    createdAt: new Date().toISOString(),
  };

  try {
    await db.insert(suggestions).values({
      id: suggestion.id,
      callId: sessionId,
      type,
      content: response.content,
      trigger,
    });
  } catch (err) {
    seLogger.error({ error: err }, 'DB error saving suggestion');
  }

  const message: SuggestionMessage = {
    type: 'suggestion',
    payload: suggestion,
  };

  await redis.publish(`session:${sessionId}`, JSON.stringify(message)).catch((err) =>
    seLogger.error({ error: err }, 'Redis publish error')
  );

  const session = sessionManager.get(sessionId);
  if (session?.ws.readyState === 1) {
    session.ws.send(JSON.stringify(message));
  }
}
