import type WebSocket from 'ws'
import { sessionManager } from './sessionManager'
import { processFinalTranscript } from './suggestionEngine'
import { createDeepgramConnection, type TranscriptResult } from './deepgramClient'
import { prisma } from '../lib/db/client'
import { publishToSession } from '../lib/redis/client'
import { processTranscriptForCompliance } from './complianceEngine'
import { scriptChecklist } from './scriptChecklist'
import type {
  AudioChunkMessage,
  SessionStartMessage,
  SessionEndMessage,
  TranscriptMessage,
} from '../types'
import { v4 as uuidv4 } from 'uuid'

export async function handleSessionStart(
  ws: WebSocket,
  message: SessionStartMessage
): Promise<void> {
  const { sessionId, agentId } = message.payload

  console.log(`[AudioHandler] Session start: ${sessionId} agent: ${agentId}`)

  // Create Deepgram connection
  const deepgramConnection = createDeepgramConnection(
    sessionId,
    async (result: TranscriptResult) => {
      await handleTranscriptResult(sessionId, result)
    },
    (error: Error) => {
      console.error(`[AudioHandler] Deepgram error for ${sessionId}:`, error)
      sendToClient(ws, { type: 'error', payload: { message: error.message } })
    }
  )

  sessionManager.add(sessionId, {
    sessionId,
    agentId,
    ws,
    deepgramConnection,
    startedAt: new Date(),
  })

  // Ensure session exists in DB
  try {
    await prisma.callSession.upsert({
      where: { id: sessionId },
      update: { status: 'active' },
      create: {
        id: sessionId,
        agentId,
        status: 'active',
      },
    })
  } catch (error) {
    console.error('[AudioHandler] DB error creating session:', error)
  }

  sendToClient(ws, { type: 'session_ready', payload: { sessionId } })
}

export function handleAudioChunk(
  ws: WebSocket,
  message: AudioChunkMessage
): void {
  const { sessionId, data } = message.payload
  const session = sessionManager.get(sessionId)

  if (!session || !session.isActive) {
    console.warn(`[AudioHandler] Received audio for unknown/inactive session: ${sessionId}`)
    return
  }

  if (!session.deepgramConnection) {
    console.warn(`[AudioHandler] No Deepgram connection for session: ${sessionId}`)
    return
  }

  try {
    const audioBuffer = Buffer.from(data, 'base64')
    session.deepgramConnection.send(audioBuffer as unknown as string)
  } catch (error) {
    console.error(`[AudioHandler] Error sending audio to Deepgram for ${sessionId}:`, error)
  }
}

export async function handleSessionEnd(
  ws: WebSocket,
  message: SessionEndMessage
): Promise<void> {
  const { sessionId } = message.payload
  console.log(`[AudioHandler] Session end: ${sessionId}`)

  try {
    await prisma.callSession.update({
      where: { id: sessionId },
      data: { status: 'ended', endedAt: new Date() },
    })
  } catch (error) {
    console.error('[AudioHandler] DB error ending session:', error)
  }

  scriptChecklist.clear(sessionId)
  sessionManager.end(sessionId)
  sendToClient(ws, { type: 'session_ended', payload: { sessionId } })
}

async function handleTranscriptResult(
  sessionId: string,
  result: TranscriptResult
): Promise<void> {
  const session = sessionManager.get(sessionId)
  if (!session) return

  const transcriptMessage: TranscriptMessage = {
    type: 'transcript',
    payload: {
      id: uuidv4(),
      sessionId,
      speaker: result.speaker as 'agent' | 'prospect',
      text: result.text,
      confidence: result.confidence,
      timestamp: new Date().toISOString(),
      startMs: result.startMs,
      endMs: result.endMs,
    },
  }

  // Send to client immediately (interim or final)
  sendToClient(session.ws, transcriptMessage)

  // Publish to Redis for Next.js to consume
  await publishToSession(sessionId, transcriptMessage).catch((err) =>
    console.error('[AudioHandler] Redis publish error:', err)
  )

  // Persist final transcripts to DB
  if (result.isFinal) {
    try {
      await prisma.transcript.create({
        data: {
          id: transcriptMessage.payload.id,
          sessionId,
          speaker: result.speaker,
          text: result.text,
          confidence: result.confidence,
          startMs: result.startMs,
          endMs: result.endMs,
        },
      })
    } catch (error) {
      console.error('[AudioHandler] DB error saving transcript:', error)
    }

    // Fire suggestion engine for final transcripts
    await processFinalTranscript(sessionId, result.speaker, result.text).catch(
      (err) => console.error('[AudioHandler] Suggestion engine error:', err)
    )

    // Check compliance
    processTranscriptForCompliance(sessionId, result.speaker, result.text).catch(
      (err) => console.error('[AudioHandler] Compliance check error:', err)
    )
    // Update script checklist
    scriptChecklist.tick(sessionId, result.text)
  }
}

function sendToClient(ws: WebSocket, message: object): void {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(message))
  }
}
