import { ScriptChecklistTracker } from '../scriptChecklist'

// We need to test the class directly, so let's export it from scriptChecklist.ts
// For now test the exported singleton
import { scriptChecklist } from '../scriptChecklist'

describe('scriptChecklist', () => {
  afterEach(() => {
    scriptChecklist.clear('test-session')
  })

  it('starts with 0% progress', () => {
    const { score } = scriptChecklist.getProgress('test-session')
    expect(score).toBe(0)
  })

  it('detects greeting phase', () => {
    scriptChecklist.tick('test-session', 'Hi, my name is John and I am calling from Acme Insurance')
    const { items } = scriptChecklist.getProgress('test-session')
    const greeting = items.find((i) => i.id === 'greeting')
    expect(greeting?.checked).toBe(true)
  })

  it('updates score when items checked', () => {
    scriptChecklist.tick('test-session', 'My name is John from Acme')
    scriptChecklist.tick('test-session', 'Do you have any dependents or income protection needs?')
    scriptChecklist.tick('test-session', 'We have term life and whole life options')
    const { score } = scriptChecklist.getProgress('test-session')
    expect(score).toBeGreaterThan(0)
  })
})
