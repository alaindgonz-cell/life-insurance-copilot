/**
 * WebSocket reconnect configuration for the client.
 * Exported for use in useWebSocket hook documentation/constants.
 */

export const WS_RECONNECT_CONFIG = {
  maxAttempts: 5,
  baseDelayMs: 2000,
  maxDelayMs: 30000,
  jitterMs: 500,
} as const

export function calculateReconnectDelay(attempt: number): number {
  const delay = Math.min(
    WS_RECONNECT_CONFIG.baseDelayMs * Math.pow(2, attempt - 1),
    WS_RECONNECT_CONFIG.maxDelayMs
  )
  const jitter = Math.random() * WS_RECONNECT_CONFIG.jitterMs
  return Math.round(delay + jitter)
}
