import { useCallback, useEffect, useRef, useState } from 'react'
import type { WSMessage } from '@/types'

export type WSConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error'

export interface UseWebSocketOptions {
  url: string
  onMessage: (message: WSMessage) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Event) => void
  autoReconnect?: boolean
  reconnectDelayMs?: number
  maxReconnectAttempts?: number
}

export interface UseWebSocketReturn {
  connectionState: WSConnectionState
  send: (message: object) => void
  connect: () => void
  disconnect: () => void
}

export function useWebSocket({
  url,
  onMessage,
  onConnect,
  onDisconnect,
  onError,
  autoReconnect = true,
  reconnectDelayMs = 2000,
  maxReconnectAttempts = 5,
}: UseWebSocketOptions): UseWebSocketReturn {
  const [connectionState, setConnectionState] = useState<WSConnectionState>('disconnected')
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMountedRef = useRef(true)

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    setConnectionState('connecting')
    const ws = new WebSocket(url)

    ws.onopen = () => {
      if (!isMountedRef.current) return
      reconnectAttemptsRef.current = 0
      setConnectionState('connected')
      onConnect?.()
    }

    ws.onmessage = (event) => {
      if (!isMountedRef.current) return
      try {
        const message = JSON.parse(event.data as string) as WSMessage
        onMessage(message)
      } catch {
        console.error('[useWebSocket] Failed to parse message:', event.data)
      }
    }

    ws.onclose = () => {
      if (!isMountedRef.current) return
      setConnectionState('disconnected')
      onDisconnect?.()

      if (autoReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectAttemptsRef.current++
        const delay = reconnectDelayMs * Math.pow(2, reconnectAttemptsRef.current - 1)
        console.log(`[useWebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`)
        reconnectTimeoutRef.current = setTimeout(connect, delay)
      }
    }

    ws.onerror = (event) => {
      if (!isMountedRef.current) return
      setConnectionState('error')
      onError?.(event)
    }

    wsRef.current = ws
  }, [url, onMessage, onConnect, onDisconnect, onError, autoReconnect, reconnectDelayMs, maxReconnectAttempts])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    wsRef.current?.close()
    wsRef.current = null
    setConnectionState('disconnected')
  }, [])

  const send = useCallback((message: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    } else {
      console.warn('[useWebSocket] Cannot send: not connected')
    }
  }, [])

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
      wsRef.current?.close()
    }
  }, [])

  return { connectionState, send, connect, disconnect }
}
