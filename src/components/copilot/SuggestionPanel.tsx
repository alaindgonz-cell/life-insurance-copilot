'use client'

import { useCallback, useState } from 'react'
import type { AISuggestion } from '@/types'
import { SuggestionCard } from './SuggestionCard'

interface SuggestionPanelProps {
  suggestions: AISuggestion[]
  sessionId: string | null
  isCallActive: boolean
}

export function SuggestionPanel({ suggestions, sessionId, isCallActive }: SuggestionPanelProps) {
  const [localSuggestions, setLocalSuggestions] = useState<AISuggestion[]>(suggestions)

  // Sync with parent suggestions (new ones come in via WebSocket)
  const mergedSuggestions = suggestions.map((s) => {
    const local = localSuggestions.find((ls: AISuggestion) => ls.id === s.id)
    return local ?? s
  })

  const handleAccept = useCallback(
    async (id: string) => {
      setLocalSuggestions((prev: AISuggestion[]) =>
        prev.map((s: AISuggestion) => (s.id === id ? { ...s, accepted: true } : s))
      )

      if (sessionId) {
        try {
          await fetch(`/api/sessions/${sessionId}/suggestions/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accepted: true }),
          })
        } catch {
          // Best-effort — don't fail the UI
        }
      }
    },
    [sessionId]
  )

  const handleDismiss = useCallback((id: string) => {
    setLocalSuggestions((prev: AISuggestion[]) => prev.filter((s: AISuggestion) => s.id !== id))
  }, [])

  if (!isCallActive && mergedSuggestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 p-6">
        <svg className="w-10 h-10 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <p className="text-sm text-center">
          AI suggestions will appear here during your call
        </p>
      </div>
    )
  }

  if (isCallActive && mergedSuggestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 p-6">
        <div className="flex gap-1 mb-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
        <p className="text-sm text-center">Listening for cues...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700">
          AI Suggestions
          {mergedSuggestions.length > 0 && (
            <span className="ml-2 bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full">
              {mergedSuggestions.length}
            </span>
          )}
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {mergedSuggestions.map((suggestion) => (
          <SuggestionCard
            key={suggestion.id}
            suggestion={suggestion}
            onAccept={handleAccept}
            onDismiss={handleDismiss}
          />
        ))}
      </div>
    </div>
  )
}
