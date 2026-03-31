import { useCallback, useRef, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useAudioCapture } from './useAudioCapture'
import { useWebSocket } from './useWebSocket'
import type { TranscriptSegment, AISuggestion, WSMessage } from '@/types'

export type CallState = 'idle' | 'connecting' | 'active' | 'ending' | 'ended' | 'error'

export interface UseCallSessionReturn {
  callState: CallState
  sessionId: string | null
  transcriptSegments: TranscriptSegment[]
  suggestions: AISuggestion[]
  error: string | null
  startCall: (agentId: string) => Promise<void>
  endCall: () => void
  isMicActive: boolean
  toggleMic: () => void
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001'

export function useCallSession(): UseCallSessionReturn {
  const [callState, setCallState] = useState<CallState>('idle')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [transcriptSegments, setTranscriptSegments] = useState<TranscriptSegment[]>([])
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isMicActive, setIsMicActive] = useState(true)
  const agentIdRef = useRef<string>('')
  const currentSessionIdRef = useRef<string | null>(null)

  const handleWSMessage = useCallback((message: WSMessage) => {
    switch (message.type) {
      case 'session_ready':
        setCallState('active')
        break
      case 'transcript':
        setTranscriptSegments((prev) => {
          const segment = message.payload as TranscriptSegment
          // Replace interim segments with final ones
          const filtered = prev.filter(
            (s) => !(s.startMs === segment.startMs && !s.id.includes('-final'))
          )
          return [...filtered, segment]
        })
        break
      case 'suggestion':
        setSuggestions((prev) => [message.payload as AISuggestion, ...prev])
        break
      case 'session_ended':
        setCallState('ended')
        audio.stopCapture()
        break
      case 'error':
        setError((message.payload as { message: string }).message)
        break
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const ws = useWebSocket({
    url: WS_URL,
    onMessage: handleWSMessage,
    onConnect: () => {
      console.log('[useCallSession] WS connected')
    },
    onDisconnect: () => {
      console.log('[useCallSession] WS disconnected')
    },
    onError: () => {
      setError('WebSocket connection error')
      setCallState('error')
    },
    autoReconnect: false,
  })

  const audio = useAudioCapture({
    onAudioChunk: (data, mimeType) => {
      if (!currentSessionIdRef.current) return
      ws.send({
        type: 'audio_chunk',
        payload: {
          sessionId: currentSessionIdRef.current,
          data,
          mimeType,
        },
      })
    },
    onError: (err) => {
      setError(err.message)
      setCallState('error')
    },
  })

  const startCall = useCallback(
    async (agentId: string) => {
      const newSessionId = uuidv4()
      currentSessionIdRef.current = newSessionId
      agentIdRef.current = agentId
      setSessionId(newSessionId)
      setTranscriptSegments([])
      setSuggestions([])
      setError(null)
      setCallState('connecting')

      ws.connect()

      // Wait briefly for connection before sending session_start
      await new Promise((resolve) => setTimeout(resolve, 500))

      ws.send({
        type: 'session_start',
        payload: { sessionId: newSessionId, agentId },
      })

      await audio.startCapture()
    },
    [ws, audio]
  )

  const endCall = useCallback(() => {
    if (!currentSessionIdRef.current) return
    setCallState('ending')
    ws.send({
      type: 'session_end',
      payload: { sessionId: currentSessionIdRef.current },
    })
    audio.stopCapture()
    ws.disconnect()
  }, [ws, audio])

  const toggleMic = useCallback(() => {
    if (isMicActive) {
      audio.pauseCapture()
    } else {
      audio.resumeCapture()
    }
    setIsMicActive((v) => !v)
  }, [isMicActive, audio])

  return {
    callState,
    sessionId,
    transcriptSegments,
    suggestions,
    error,
    startCall,
    endCall,
    isMicActive,
    toggleMic,
  }
}
