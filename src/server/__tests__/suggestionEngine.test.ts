import { detectTriggers } from '../triggerDetector'
import { transcriptBuffer } from '../transcriptBuffer'

describe('triggerDetector', () => {
  it('detects objection keywords', () => {
    const triggers = detectTriggers("I can't afford this right now, it's too expensive")
    expect(triggers.length).toBeGreaterThan(0)
    expect(triggers[0].type).toBe('objection_handler')
  })

  it('detects product inquiry keywords', () => {
    const triggers = detectTriggers('How much does it cost and what does it cover?')
    const types = triggers.map((t) => t.type)
    expect(types).toContain('product_info')
  })

  it('detects compliance phrases', () => {
    const triggers = detectTriggers('I guarantee you will get approved no matter what')
    const types = triggers.map((t) => t.type)
    expect(types).toContain('compliance')
  })

  it('returns empty array for neutral text', () => {
    const triggers = detectTriggers('Hello how are you doing today')
    expect(triggers).toHaveLength(0)
  })

  it('limits results to 2 triggers max', () => {
    const triggers = detectTriggers(
      "I can't afford this and guarantee it and what does it cover"
    )
    expect(triggers.length).toBeLessThanOrEqual(2)
  })
})

describe('transcriptBuffer', () => {
  afterEach(() => {
    transcriptBuffer.clear('test-session')
  })

  it('stores and retrieves segments', () => {
    transcriptBuffer.push('test-session', 'agent', 'Hello there')
    transcriptBuffer.push('test-session', 'prospect', 'Hi how are you')
    const context = transcriptBuffer.getContext('test-session')
    expect(context).toContain('AGENT: Hello there')
    expect(context).toContain('PROSPECT: Hi how are you')
  })

  it('limits to max segments', () => {
    for (let i = 0; i < 25; i++) {
      transcriptBuffer.push('test-session', 'agent', `Segment ${i}`)
    }
    expect(transcriptBuffer.size('test-session')).toBe(20)
  })

  it('returns empty string for unknown session', () => {
    expect(transcriptBuffer.getContext('nonexistent')).toBe('')
  })
})
