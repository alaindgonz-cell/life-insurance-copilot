/**
 * Sliding window transcript buffer per session.
 * Maintains the last N transcript segments to provide context to Claude.
 */

interface BufferedSegment {
  speaker: string
  text: string
  timestamp: number
}

class TranscriptBuffer {
  private buffers = new Map<string, BufferedSegment[]>()
  private maxSegments: number

  constructor(maxSegments = 20) {
    this.maxSegments = maxSegments
  }

  push(sessionId: string, speaker: string, text: string): void {
    if (!this.buffers.has(sessionId)) {
      this.buffers.set(sessionId, [])
    }
    const buffer = this.buffers.get(sessionId)!
    buffer.push({ speaker, text, timestamp: Date.now() })

    // Keep only last N segments
    if (buffer.length > this.maxSegments) {
      buffer.splice(0, buffer.length - this.maxSegments)
    }
  }

  getContext(sessionId: string, lastN = 10): string {
    const buffer = this.buffers.get(sessionId) ?? []
    const recent = buffer.slice(-lastN)
    return recent.map((s) => `${s.speaker.toUpperCase()}: ${s.text}`).join('\n')
  }

  getLastSegment(sessionId: string): BufferedSegment | null {
    const buffer = this.buffers.get(sessionId)
    if (!buffer || buffer.length === 0) return null
    return buffer[buffer.length - 1]
  }

  clear(sessionId: string): void {
    this.buffers.delete(sessionId)
  }

  size(sessionId: string): number {
    return this.buffers.get(sessionId)?.length ?? 0
  }
}

export const transcriptBuffer = new TranscriptBuffer()
