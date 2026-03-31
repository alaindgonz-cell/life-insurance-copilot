'use client'

import type { AISuggestion } from '@/types'

const TYPE_CONFIG = {
  product_info: {
    label: 'Product Info',
    icon: '📋',
    className: 'border-blue-200 bg-blue-50',
    labelClass: 'text-blue-700 bg-blue-100',
  },
  objection_handler: {
    label: 'Objection Handler',
    icon: '🛡️',
    className: 'border-amber-200 bg-amber-50',
    labelClass: 'text-amber-700 bg-amber-100',
  },
  compliance: {
    label: 'Compliance Alert',
    icon: '⚠️',
    className: 'border-red-200 bg-red-50',
    labelClass: 'text-red-700 bg-red-100',
  },
  tip: {
    label: 'Sales Tip',
    icon: '💡',
    className: 'border-green-200 bg-green-50',
    labelClass: 'text-green-700 bg-green-100',
  },
} as const

interface SuggestionCardProps {
  suggestion: AISuggestion
  onAccept: (id: string) => void
  onDismiss: (id: string) => void
}

export function SuggestionCard({ suggestion, onAccept, onDismiss }: SuggestionCardProps) {
  const config = TYPE_CONFIG[suggestion.type] ?? TYPE_CONFIG.tip

  return (
    <div
      className={`rounded-lg border p-4 transition-all ${config.className} ${
        suggestion.accepted ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${config.labelClass}`}>
          {config.icon} {config.label}
        </span>
        <button
          onClick={() => onDismiss(suggestion.id)}
          className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          aria-label="Dismiss suggestion"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <p className="text-sm text-gray-800 leading-relaxed mb-3">{suggestion.content}</p>

      {suggestion.trigger && (
        <p className="text-xs text-gray-400 mb-3 italic">
          Triggered by: &ldquo;{suggestion.trigger}&rdquo;
        </p>
      )}

      {!suggestion.accepted && (
        <button
          onClick={() => onAccept(suggestion.id)}
          className="text-xs font-medium text-gray-600 hover:text-gray-900 underline transition-colors"
        >
          Mark as used
        </button>
      )}

      {suggestion.accepted && (
        <span className="text-xs text-green-600 font-medium">✓ Used</span>
      )}
    </div>
  )
}
