/**
 * Detects when to fire AI suggestions based on transcript content.
 * Uses keyword matching for fast, low-latency trigger detection.
 */

export type SuggestionTrigger = {
  type: 'product_info' | 'objection_handler' | 'compliance' | 'tip'
  confidence: number
  matchedKeywords: string[]
}

const OBJECTION_KEYWORDS = [
  "can't afford", "too expensive", "not interested", "already have",
  "need to think", "call back later", "spouse", "husband", "wife",
  "don't need it", "too old", "pre-existing", "health issues",
  "just looking", "not right now", "maybe later", "no money",
  "budget", "cost too much", "cheaper", "other options",
]

const PRODUCT_KEYWORDS = [
  "how much", "what does it cover", "term life", "whole life",
  "universal life", "final expense", "burial", "beneficiary",
  "premium", "policy", "coverage amount", "death benefit",
  "cash value", "riders", "what kind", "types of",
  "which plan", "best option", "recommend", "suggestion",
]

const COMPLIANCE_PHRASES = [
  "guarantee", "guaranteed", "for sure", "definitely will",
  "promise", "100 percent", "no doubt", "absolutely certain",
  "medical exam", "no medical", "no health questions",
  "backdating", "free look", "cancel anytime",
]

const TIP_TRIGGERS = [
  "let me think", "i'm not sure", "what do you think",
  "sounds good", "tell me more", "how does that work",
  "what's next", "go ahead", "yes", "interested", "okay",
]

export function detectTriggers(text: string): SuggestionTrigger[] {
  const lower = text.toLowerCase()
  const triggers: SuggestionTrigger[] = []

  const objectionMatches = OBJECTION_KEYWORDS.filter((kw) => lower.includes(kw))
  if (objectionMatches.length > 0) {
    triggers.push({
      type: 'objection_handler',
      confidence: Math.min(0.5 + objectionMatches.length * 0.2, 1.0),
      matchedKeywords: objectionMatches,
    })
  }

  const productMatches = PRODUCT_KEYWORDS.filter((kw) => lower.includes(kw))
  if (productMatches.length > 0) {
    triggers.push({
      type: 'product_info',
      confidence: Math.min(0.4 + productMatches.length * 0.15, 1.0),
      matchedKeywords: productMatches,
    })
  }

  const complianceMatches = COMPLIANCE_PHRASES.filter((kw) => lower.includes(kw))
  if (complianceMatches.length > 0) {
    triggers.push({
      type: 'compliance',
      confidence: Math.min(0.7 + complianceMatches.length * 0.1, 1.0),
      matchedKeywords: complianceMatches,
    })
  }

  const tipMatches = TIP_TRIGGERS.filter((kw) => lower.includes(kw))
  if (tipMatches.length >= 2) {
    triggers.push({
      type: 'tip',
      confidence: 0.4,
      matchedKeywords: tipMatches,
    })
  }

  // Sort by confidence descending, return top 2
  return triggers.sort((a, b) => b.confidence - a.confidence).slice(0, 2)
}
