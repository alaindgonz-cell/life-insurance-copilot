import { createClient, LiveTranscriptionEvents, type LiveClient } from '@deepgram/sdk'
import { v4 as uuidv4 } from 'uuid'

const deepgram = createClient(process.env.DEEPGRAM_API_KEY || '')

export interface TranscriptResult {
  sessionId: string
  text: string
  speaker: string
  confidence: number
  startMs: number
  endMs: number
  isFinal: boolean
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
  })

  connection.on(LiveTranscriptionEvents.Open, () => {
    console.log(`[Deepgram] Connection opened for session ${sessionId}`)
  })

  connection.on(LiveTranscriptionEvents.Transcript, (data) => {
    const alt = data.channel?.alternatives?.[0]
    if (!alt || !alt.transcript || alt.transcript.trim() === '') return

    const words = alt.words || []
    const startMs = words.length > 0 ? Math.round((words[0].start || 0) * 1000) : 0
    const endMs = words.length > 0 ? Math.round((words[words.length - 1].end || 0) * 1000) : 0

    onTranscript({
      sessionId,
      text: alt.transcript,
      speaker: 'agent',
      confidence: alt.confidence || 0,
      startMs,
      endMs,
      isFinal: !data.is_final ? false : true,
    })
  })

  connection.on(LiveTranscriptionEvents.Error, (error) => {
    console.error(`[Deepgram] Error for session ${sessionId}:`, error)
    onError(new Error(String(error)))
  })

  connection.on(LiveTranscriptionEvents.Close, () => {
    console.log(`[Deepgram] Connection closed for session ${sessionId}`)
  })

  return connection
}
