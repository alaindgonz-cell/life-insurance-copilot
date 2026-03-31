/**
 * Structured logger with request ID support.
 * In production, use a proper logging service (Datadog, etc.)
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  requestId?: string
  sessionId?: string
  [key: string]: unknown
}

function log(level: LogLevel, message: string, meta: Record<string, unknown> = {}): void {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  }

  const output = JSON.stringify(entry)

  if (level === 'error') {
    console.error(output)
  } else if (level === 'warn') {
    console.warn(output)
  } else {
    console.log(output)
  }
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => log('debug', message, meta),
  info: (message: string, meta?: Record<string, unknown>) => log('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => log('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => log('error', message, meta),
}
