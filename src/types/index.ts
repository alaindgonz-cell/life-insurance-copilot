export interface TranscriptSegment {
  id: string
  sessionId: string
  speaker: 'agent' | 'prospect'
  text: string
  confidence?: number
  timestamp: string
  startMs?: number
  endMs?: number
}

export interface AISuggestion {
  id: string
  sessionId: string
  type: 'product_info' | 'objection_handler' | 'compliance' | 'tip'
  content: string
  trigger?: string
  shown: boolean
  accepted: boolean
  createdAt: string
}

export interface CallSession {
  id: string
  agentId: string
  prospectName?: string
  prospectPhone?: string
  status: 'active' | 'ended'
  startedAt: string
  endedAt?: string
}

export interface WSMessage {
  type: string
  payload: Record<string, unknown>
}

export interface AudioChunkMessage extends WSMessage {
  type: 'audio_chunk'
  payload: {
    sessionId: string
    data: string // base64 encoded audio
    mimeType: string
  }
}

export interface TranscriptMessage extends WSMessage {
  type: 'transcript'
  payload: TranscriptSegment
}

export interface SuggestionMessage extends WSMessage {
  type: 'suggestion'
  payload: AISuggestion
}

export interface SessionStartMessage extends WSMessage {
  type: 'session_start'
  payload: {
    sessionId: string
    agentId: string
  }
}

export interface SessionEndMessage extends WSMessage {
  type: 'session_end'
  payload: {
    sessionId: string
  }
}
