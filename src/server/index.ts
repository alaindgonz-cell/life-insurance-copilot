import 'dotenv/config'
import { WebSocketServer, WebSocket } from 'ws'
import type { IncomingMessage } from 'http'
import {
  handleSessionStart,
  handleAudioChunk,
  handleSessionEnd,
} from './audioHandler'
import type { WSMessage } from '../types'

const WS_PORT = parseInt(process.env.WS_PORT || '3001', 10)

const wss = new WebSocketServer({ port: WS_PORT })

console.log(`[WS Server] Starting on port ${WS_PORT}`)

wss.on('listening', () => {
  console.log(`[WS Server] Listening on ws://localhost:${WS_PORT}`)
})

wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
  const clientIp = req.socket.remoteAddress
  console.log(`[WS Server] New connection from ${clientIp}`)

  ws.on('message', async (raw) => {
    let message: WSMessage

    try {
      message = JSON.parse(raw.toString()) as WSMessage
    } catch {
      console.error('[WS Server] Invalid JSON message received')
      ws.send(JSON.stringify({ type: 'error', payload: { message: 'Invalid JSON' } }))
      return
    }

    try {
      switch (message.type) {
        case 'session_start':
          await handleSessionStart(ws, message as Parameters<typeof handleSessionStart>[1])
          break
        case 'audio_chunk':
          handleAudioChunk(ws, message as Parameters<typeof handleAudioChunk>[1])
          break
        case 'session_end':
          await handleSessionEnd(ws, message as Parameters<typeof handleSessionEnd>[1])
          break
        default:
          console.warn(`[WS Server] Unknown message type: ${message.type}`)
      }
    } catch (error) {
      console.error('[WS Server] Error handling message:', error)
      ws.send(JSON.stringify({ type: 'error', payload: { message: 'Internal server error' } }))
    }
  })

  ws.on('close', () => {
    console.log(`[WS Server] Connection closed from ${clientIp}`)
  })

  ws.on('error', (error) => {
    console.error(`[WS Server] WebSocket error from ${clientIp}:`, error)
  })

  // Send welcome message
  ws.send(JSON.stringify({ type: 'connected', payload: { status: 'ready' } }))
})

wss.on('error', (error) => {
  console.error('[WS Server] Server error:', error)
})

process.on('SIGTERM', () => {
  console.log('[WS Server] Shutting down...')
  wss.close(() => {
    console.log('[WS Server] Closed')
    process.exit(0)
  })
})
