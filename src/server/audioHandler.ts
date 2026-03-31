import type WebSocket from 'ws';
import { sessionManager } from './sessionManager';
import { processFinalTranscript } from './suggestionEngine';
import { createDeepgramConnection, type TranscriptResult } from './deepgramClient';
import { db } from '../lib/db';
import { calls, transcripts } from '../lib/db/schema';
import { eq } from 'drizzle-orm';
import { redis } from '../lib/redis';
import { processTranscriptForCompliance } from './complianceEngine';
import { scriptChecklist } from './scriptChecklist';
import { logger } from '../lib/logger';
import type {
  AudioChunkMessage,
  SessionStartMessage,
  SessionEndMessage,
  TranscriptMessage,
} from '../types';
import { v4 as uuidv4 } from 'uuid';

const ahLogger = logger.child({ component: 'audio-handler' });

export async function handleSessionStart(
  ws: WebSocket,
  message: SessionStartMessage
): Promise<void> {
  const { sessionId, agentId } = message.payload;

  ahLogger.info({ sessionId, agentId }, 'Session start');

  const deepgramConnection = createDeepgramConnection(
    sessionId,
    async (result: TranscriptResult) => {
      await handleTranscriptResult(sessionId, result);
    },
    (error: Error) => {
      ahLogger.error({ sessionId, error: error.message }, 'Deepgram error');
      sendToClient(ws, { type: 'error', payload: { message: error.message } });
    }
  );

  sessionManager.add(sessionId, {
    sessionId,
    agentId,
    ws,
    deepgramConnection,
    startedAt: new Date(),
  });

  // Upsert session in DB
  try {
    const [existing] = await db.select().from(calls).where(eq(calls.id, sessionId));
    if (existing) {
      await db.update(calls).set({ status: 'active' }).where(eq(calls.id, sessionId));
    } else {
      await db.insert(calls).values({ id: sessionId, agentId, status: 'active' });
    }
  } catch (error) {
    ahLogger.error({ error }, 'DB error creating session');
  }

  sendToClient(ws, { type: 'session_ready', payload: { sessionId } });
}

export function handleAudioChunk(
  ws: WebSocket,
  message: AudioChunkMessage
): void {
  const { sessionId, data } = message.payload;
  const session = sessionManager.get(sessionId);

  if (!session || !session.isActive) {
    ahLogger.warn({ sessionId }, 'Audio for unknown/inactive session');
    return;
  }

  if (!session.deepgramConnection) {
    ahLogger.warn({ sessionId }, 'No Deepgram connection');
    return;
  }

  try {
    const audioBuffer = Buffer.from(data, 'base64');
    session.deepgramConnection.send(audioBuffer as unknown as string);
  } catch (error) {
    ahLogger.error({ sessionId, error }, 'Error sending audio to Deepgram');
  }
}

export async function handleSessionEnd(
  ws: WebSocket,
  message: SessionEndMessage
): Promise<void> {
  const { sessionId } = message.payload;
  ahLogger.info({ sessionId }, 'Session end');

  try {
    await db.update(calls).set({ status: 'ended', endedAt: new Date() }).where(eq(calls.id, sessionId));
  } catch (error) {
    ahLogger.error({ error }, 'DB error ending session');
  }

  scriptChecklist.clear(sessionId);
  sessionManager.end(sessionId);
  sendToClient(ws, { type: 'session_ended', payload: { sessionId } });
}

async function handleTranscriptResult(
  sessionId: string,
  result: TranscriptResult
): Promise<void> {
  const session = sessionManager.get(sessionId);
  if (!session) return;

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
  };

  sendToClient(session.ws, transcriptMessage);

  // Publish to Redis
  await redis.publish(`session:${sessionId}`, JSON.stringify(transcriptMessage)).catch((err) =>
    ahLogger.error({ error: err }, 'Redis publish error')
  );

  if (result.isFinal) {
    try {
      await db.insert(transcripts).values({
        id: transcriptMessage.payload.id,
        callId: sessionId,
        speaker: result.speaker,
        content: result.text,
        confidence: result.confidence,
        startMs: result.startMs,
        endMs: result.endMs,
      });
    } catch (error) {
      ahLogger.error({ error }, 'DB error saving transcript');
    }

    await processFinalTranscript(sessionId, result.speaker, result.text).catch(
      (err) => ahLogger.error({ error: err }, 'Suggestion engine error')
    );

    processTranscriptForCompliance(sessionId, result.speaker, result.text).catch(
      (err) => ahLogger.error({ error: err }, 'Compliance check error')
    );

    scriptChecklist.tick(sessionId, result.text);
  }
}

function sendToClient(ws: WebSocket, message: object): void {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(message));
  }
}
