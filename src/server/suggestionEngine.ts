import { v4 as uuidv4 } from 'uuid'
import { generateSuggestion } from '../lib/claude/client'
import { transcriptBuffer } from './transcriptBuffer'
import { detectTriggers } from './triggerDetector'
import { publishToSession } from '../lib/redis/client'
import { prisma } from '../lib/db/client'
import { sessionManager } from './sessionManager'
import type { SuggestionMessage } from '../types'

// Debounce state: track last suggestion time per session per type
const lastSuggestionTime = new Map<string, number>()
const DEBOUNCE_MS = 8000 // min 8 seconds between same suggestion type per session

function debounceKey(sessionId: string, type: string): string {
  return `${sessionId}:${type}`
}

function isDebounced(sessionId: string, type: string): boolean {
  const key = debounceKey(sessionId, type)
  const last = lastSuggestionTime.get(key) ?? 0
  return Date.now() - last < DEBOUNCE_MS
}

function markSuggested(sessionId: string, type: string): void {
  lastSuggestionTime.set(debounceKey(sessionId, type), Date.now())
}

export async function processFinalTranscript(
  sessionId: string,
  speaker: string,
  text: string
): Promise<void> {
  // Add to buffer
  transcriptBuffer.push(sessionId, speaker, text)

  // Only trigger on prospect speech (their objections/questions drive suggestions)
  // Also trigger on agent speech for compliance checks
  const triggers = detectTriggers(text)
  if (triggers.length === 0) return

  const session = sessionManager.get(sessionId)
  if (!session) return

  for (const trigger of triggers) {
    if (isDebounced(sessionId, trigger.type)) continue

    markSuggested(sessionId, trigger.type)

    // Fire and forget — don't block the transcript pipeline
    generateAndSendSuggestion(sessionId, trigger.type, trigger.matchedKeywords[0] ?? text).catch(
      (err) => console.error(`[SuggestionEngine] Error generating suggestion for ${sessionId}:`, err)
    )
  }
}

async function generateAndSendSuggestion(
  sessionId: string,
  type: 'product_info' | 'objection_handler' | 'compliance' | 'tip',
  trigger: string
): Promise<void> {
  const context = transcriptBuffer.getContext(sessionId, 8)
  if (!context.trim()) return

  console.log(`[SuggestionEngine] Generating ${type} suggestion for session ${sessionId}`)

  const content = await generateSuggestion(context, type)

  const suggestion = {
    id: uuidv4(),
    sessionId,
    type,
    content,
    trigger,
    shown: false,
    accepted: false,
    createdAt: new Date().toISOString(),
  }

  // Persist to DB
  try {
    await prisma.aISuggestion.create({
      data: {
        id: suggestion.id,
        sessionId,
        type,
        content,
        trigger,
      },
    })
  } catch (err) {
    console.error('[SuggestionEngine] DB error saving suggestion:', err)
  }

  const message: SuggestionMessage = {
    type: 'suggestion',
    payload: suggestion,
  }

  // Send via Redis so the WS server can forward to the client
  await publishToSession(sessionId, message).catch((err) =>
    console.error('[SuggestionEngine] Redis publish error:', err)
  )

  // Also send directly via WS if session is still active
  const session = sessionManager.get(sessionId)
  if (session?.ws.readyState === 1) {
    session.ws.send(JSON.stringify(message))
  }
}
