/**
 * Script checklist tracker.
 * Monitors whether required call phases/talking points were covered.
 */

interface ChecklistItem {
  id: string
  label: string
  keywords: string[]
  required: boolean
}

const SCRIPT_ITEMS: ChecklistItem[] = [
  {
    id: 'greeting',
    label: 'Introduced yourself and company',
    keywords: ['my name is', 'i am calling from', 'this is', 'i represent'],
    required: true,
  },
  {
    id: 'needs_analysis',
    label: 'Conducted needs analysis',
    keywords: ['dependents', 'income', 'financial obligations', 'what are your goals', 'how much coverage'],
    required: true,
  },
  {
    id: 'product_explanation',
    label: 'Explained product options',
    keywords: ['term life', 'whole life', 'universal', 'final expense', 'coverage amount', 'death benefit'],
    required: true,
  },
  {
    id: 'premium_discussion',
    label: 'Discussed premium/cost',
    keywords: ['premium', 'monthly payment', 'per month', 'cost', 'affordable'],
    required: true,
  },
  {
    id: 'objection_handling',
    label: 'Addressed objections',
    keywords: ['i understand', 'that makes sense', 'i hear you', 'many people', 'common concern'],
    required: false,
  },
  {
    id: 'close',
    label: 'Attempted to close / next steps',
    keywords: ['get started', 'next step', 'application', 'fill out', 'would you like to proceed', 'schedule'],
    required: true,
  },
  {
    id: 'free_look',
    label: 'Disclosed free look period',
    keywords: ['free look', 'days to review', 'full refund', '10 days', '30 days'],
    required: true,
  },
]

export class ScriptChecklistTracker {
  private sessionState = new Map<string, Set<string>>()

  tick(sessionId: string, text: string): string[] {
    if (!this.sessionState.has(sessionId)) {
      this.sessionState.set(sessionId, new Set())
    }

    const checked = this.sessionState.get(sessionId)!
    const lowerText = text.toLowerCase()
    const newlyChecked: string[] = []

    for (const item of SCRIPT_ITEMS) {
      if (!checked.has(item.id) && item.keywords.some((kw) => lowerText.includes(kw))) {
        checked.add(item.id)
        newlyChecked.push(item.id)
      }
    }

    return newlyChecked
  }

  getProgress(sessionId: string): {
    items: Array<{ id: string; label: string; checked: boolean; required: boolean }>
    score: number
    requiredComplete: boolean
  } {
    const checked = this.sessionState.get(sessionId) ?? new Set<string>()

    const items = SCRIPT_ITEMS.map((item) => ({
      id: item.id,
      label: item.label,
      checked: checked.has(item.id),
      required: item.required,
    }))

    const requiredItems = SCRIPT_ITEMS.filter((i) => i.required)
    const completedRequired = requiredItems.filter((i) => checked.has(i.id)).length
    const score = Math.round((completedRequired / requiredItems.length) * 100)
    const requiredComplete = completedRequired === requiredItems.length

    return { items, score, requiredComplete }
  }

  clear(sessionId: string): void {
    this.sessionState.delete(sessionId)
  }
}

export const scriptChecklist = new ScriptChecklistTracker()
