import type WebSocket from 'ws'
import type { LiveClient } from '@deepgram/sdk'

interface SessionState {
  sessionId: string
  agentId: string
  ws: WebSocket
  deepgramConnection: LiveClient | null
  startedAt: Date
  isActive: boolean
}

class SessionManager {
  private sessions = new Map<string, SessionState>()

  add(sessionId: string, state: Omit<SessionState, 'isActive'>): void {
    this.sessions.set(sessionId, { ...state, isActive: true })
  }

  get(sessionId: string): SessionState | undefined {
    return this.sessions.get(sessionId)
  }

  setDeepgramConnection(sessionId: string, connection: LiveClient): void {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.deepgramConnection = connection
    }
  }

  end(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.isActive = false
      try {
        session.deepgramConnection?.requestClose()
      } catch {
        // ignore close errors
      }
      this.sessions.delete(sessionId)
    }
  }

  getAll(): SessionState[] {
    return Array.from(this.sessions.values())
  }

  count(): number {
    return this.sessions.size
  }
}

export const sessionManager = new SessionManager()
