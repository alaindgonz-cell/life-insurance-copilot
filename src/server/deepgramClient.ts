import { createClient, LiveTranscriptionEvents, type LiveClient } from '@deepgram/sdk';
import { config } from '../lib/config';
import { logger } from '../lib/logger';

const dgLogger = logger.child({ component: 'deepgram' });
const deepgram = createClient(config.DEEPGRAM_API_KEY);

export interface TranscriptResult {
  sessionId: string;
  text: string;
  speaker: string;
  confidence: number;
  startMs: number;
  endMs: number;
  isFinal: boolean;
}

export function createDeepgramConnection(
  sessionId: string,
  onTranscript: (result: TranscriptResult) => void,
  onError: (error: Error) => void
): LiveClient {
  const connection = deepgram.listen.live({
    model: 'nova-2',
    language: 'en-US',
    smart_format: true,
    interim_results: true,
    endpointing: 300,
    encoding: 'linear16',
    sample_rate: 16000,
    channels: 1,
  });

  connection.on(LiveTranscriptionEvents.Open, () => {
    dgLogger.info({ sessionId }, 'Connection opened');
  });

  connection.on(LiveTranscriptionEvents.Transcript, (data) => {
    const alt = data.channel?.alternatives?.[0];
    if (!alt || !alt.transcript || alt.transcript.trim() === '') return;

    const words = alt.words || [];
    const startMs = words.length > 0 ? Math.round((words[0].start || 0) * 1000) : 0;
    const endMs = words.length > 0 ? Math.round((words[words.length - 1].end || 0) * 1000) : 0;

    onTranscript({
      sessionId,
      text: alt.transcript,
      speaker: 'agent',
      confidence: alt.confidence || 0,
      startMs,
      endMs,
      isFinal: data.is_final !== false,
    });
  });

  connection.on(LiveTranscriptionEvents.Error, (error) => {
    dgLogger.error({ sessionId, error }, 'Deepgram error');
    onError(new Error(String(error)));
  });

  connection.on(LiveTranscriptionEvents.Close, () => {
    dgLogger.info({ sessionId }, 'Connection closed');
  });

  return connection;
}
