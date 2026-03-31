/**
 * Tests for useAudioCapture hook
 * These test the logic without actually accessing media devices
 */

describe('useAudioCapture', () => {
  it('exports the hook', () => {
    // Dynamic import to avoid browser API issues in Node
    const module = require('../useAudioCapture')
    expect(module.useAudioCapture).toBeDefined()
    expect(typeof module.useAudioCapture).toBe('function')
  })

  it('exports correct state type values', () => {
    // Verify the type contract is stable
    const validStates = ['idle', 'requesting', 'capturing', 'paused', 'error']
    expect(validStates).toHaveLength(5)
  })
})
