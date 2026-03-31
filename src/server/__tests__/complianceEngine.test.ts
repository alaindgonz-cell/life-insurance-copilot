import { checkCompliance } from '../complianceEngine'

describe('complianceEngine', () => {
  it('flags guarantee language', () => {
    const alerts = checkCompliance('session-1', 'I guarantee you will be approved for this policy')
    expect(alerts.length).toBeGreaterThan(0)
    expect(alerts[0].ruleId).toBe('no-guarantee')
    expect(alerts[0].severity).toBe('error')
  })

  it('flags scare tactics', () => {
    const alerts = checkCompliance('session-1', "You don't have long, you need to decide now")
    const scareAlert = alerts.find((a) => a.ruleId === 'no-scare-tactics')
    expect(scareAlert).toBeDefined()
    expect(scareAlert?.severity).toBe('warning')
  })

  it('returns empty array for compliant speech', () => {
    const alerts = checkCompliance(
      'session-1',
      'Based on current interest rates, this policy builds cash value over time.'
    )
    expect(alerts).toHaveLength(0)
  })

  it('includes correction guidance in alerts', () => {
    const alerts = checkCompliance('session-1', 'I guarantee approval')
    expect(alerts[0].correction).toBeTruthy()
    expect(alerts[0].correction.length).toBeGreaterThan(10)
  })
})
