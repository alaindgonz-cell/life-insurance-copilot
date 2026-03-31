import { handleAudioChunk, handleSessionEnd } from '../audioHandler'
import { sessionManager } from '../sessionManager'

// Mock dependencies
jest.mock('../../lib/db/client', () => ({
  prisma: {
    callSession: {
      upsert: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
    },
    transcript: {
      create: jest.fn().mockResolvedValue({}),
    },
  },
}))

jest.mock('../../lib/redis/client', () => ({
  publishToSession: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('../deepgramClient', () => ({
  createDeepgramConnection: jest.fn().mockReturnValue({
    send: jest.fn(),
    requestClose: jest.fn(),
  }),
}))

const mockWs = {
  readyState: 1, // OPEN
  send: jest.fn(),
  OPEN: 1,
} as unknown as import('ws').WebSocket

describe('audioHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('handleAudioChunk', () => {
    it('ignores audio for unknown session', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      handleAudioChunk(mockWs, {
        type: 'audio_chunk',
        payload: {
          sessionId: 'nonexistent-session',
          data: Buffer.from('test').toString('base64'),
          mimeType: 'audio/pcm',
        },
      })
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('unknown/inactive session')
      )
      consoleSpy.mockRestore()
    })
  })

  describe('handleSessionEnd', () => {
    it('marks session as inactive', async () => {
      const { prisma } = require('../../lib/db/client')
      await handleSessionEnd(mockWs, {
        type: 'session_end',
        payload: { sessionId: 'test-session-123' },
      })
      expect(prisma.callSession.update).toHaveBeenCalledWith({
        where: { id: 'test-session-123' },
        data: { status: 'ended', endedAt: expect.any(Date) },
      })
    })
  })
})
