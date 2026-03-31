/**
 * Real-time compliance monitoring engine.
 * Checks final transcript segments against compliance rules and fires alerts.
 */

import { publishToSession } from '../lib/redis/client'
import { sessionManager } from './sessionManager'
import { prisma } from '../lib/db/client'
import { v4 as uuidv4 } from 'uuid'

interface ComplianceRule {
  id: string
  severity: 'warning' | 'error'
  pattern: RegExp
  message: string
  correction: string
}

const COMPLIANCE_RULES: ComplianceRule[] = [
  {
    id: 'no-guarantee',
    severity: 'error',
    pattern: /\b(guarantee|guaranteed|i promise|for sure|100 percent|absolutely certain)\b/i,
    message: 'Avoid using guarantee language about policy outcomes or returns.',
    correction: 'Instead say: "Based on current rates..." or "Subject to underwriting approval..."',
  },
  {
    id: 'no-free-claim',
    severity: 'error',
    pattern: /\b(free insurance|no cost to you|completely free)\b/i,
    message: 'Do not imply insurance is free — all policies have premiums.',
    correction: 'Say: "This policy has a premium of..." or "Your monthly cost would be..."',
  },
  {
    id: 'no-investment-promise',
    severity: 'error',
    pattern: /\b(will definitely grow|guaranteed return|risk.?free investment)\b/i,
    message: 'Do not promise specific investment returns on cash-value policies.',
    correction: 'Say: "Cash value grows based on current credited interest rates, which may change."',
  },
  {
    id: 'no-scare-tactics',
    severity: 'warning',
    pattern: /\b(you will die|when you die soon|don.?t have long|running out of time)\b/i,
    message: 'Avoid pressure tactics or morbid language.',
    correction: 'Focus on the positive: protection for loved ones, legacy, peace of mind.',
  },
  {
    id: 'medical-misrepresent',
    severity: 'error',
    pattern: /\b(skip the medical questions|don.?t mention|leave that out|they won.?t check)\b/i,
    message: 'Never instruct a prospect to misrepresent health information on an application.',
    correction: 'All health questions must be answered accurately. Material misrepresentation can void a policy.',
  },
  {
    id: 'unlicensed-advice',
    severity: 'warning',
    pattern: /\b(as your (financial|tax|legal) advisor|this is (financial|tax|legal) advice)\b/i,
    message: 'Do not present yourself as giving financial, tax, or legal advice.',
    correction: 'Say: "I recommend consulting with a financial advisor or tax professional for..."',
  },
]

// Required disclosures that should be made during a call
const REQUIRED_DISCLOSURES = [
  {
    id: 'free-look',
    keyword: 'free look',
    prompt: 'Reminder: Disclose the free look period (typically 10-30 days) before closing.',
  },
  {
    id: 'privacy-notice',
    keyword: 'privacy',
    prompt:
      'Reminder: If not yet mentioned, disclose that personal information is subject to the privacy notice.',
  },
]

interface ComplianceAlert {
  sessionId: string
  ruleId: string
  severity: 'warning' | 'error'
  message: string
  correction: string
  flaggedText: string
  timestamp: string
}

// Track disclosed items per session
const disclosedItems = new Map<string, Set<string>>()

export function checkCompliance(
  sessionId: string,
  text: string
): ComplianceAlert[] {
  const alerts: ComplianceAlert[] = []

  for (const rule of COMPLIANCE_RULES) {
    const match = rule.pattern.exec(text)
    if (match) {
      alerts.push({
        sessionId,
        ruleId: rule.id,
        severity: rule.severity,
        message: rule.message,
        correction: rule.correction,
        flaggedText: match[0],
        timestamp: new Date().toISOString(),
      })
    }
  }

  return alerts
}

export async function processTranscriptForCompliance(
  sessionId: string,
  speaker: string,
  text: string
): Promise<void> {
  // Check compliance rules (mainly on agent speech)
  if (speaker === 'agent') {
    const alerts = checkCompliance(sessionId, text)

    for (const alert of alerts) {
      await sendComplianceAlert(sessionId, alert)
    }
  }

  // Check if required disclosures were made
  const lowerText = text.toLowerCase()
  for (const disclosure of REQUIRED_DISCLOSURES) {
    if (lowerText.includes(disclosure.keyword)) {
      if (!disclosedItems.has(sessionId)) {
        disclosedItems.set(sessionId, new Set())
      }
      disclosedItems.get(sessionId)!.add(disclosure.id)
    }
  }
}

async function sendComplianceAlert(sessionId: string, alert: ComplianceAlert): Promise<void> {
  const message = {
    type: 'compliance_alert',
    payload: alert,
  }

  // Send via Redis pub/sub
  await publishToSession(sessionId, message).catch((err) =>
    console.error('[ComplianceEngine] Redis publish error:', err)
  )

  // Also send directly via WS if available
  const session = sessionManager.get(sessionId)
  if (session?.ws.readyState === 1) {
    session.ws.send(JSON.stringify(message))
  }

  // Save compliance suggestion to DB
  try {
    await prisma.aISuggestion.create({
      data: {
        id: uuidv4(),
        sessionId,
        type: 'compliance',
        content: `${alert.message}\n\n${alert.correction}`,
        trigger: alert.flaggedText,
      },
    })
  } catch (err) {
    console.error('[ComplianceEngine] DB error saving compliance alert:', err)
  }
}

export function getComplianceScore(sessionId: string): number {
  // Simple heuristic: 100 base, minus 10 per violation per session
  // In production, track violations in state
  return 85 // placeholder
}

export function clearSession(sessionId: string): void {
  disclosedItems.delete(sessionId)
}
