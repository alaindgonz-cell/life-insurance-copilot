'use client'

import { useEffect, useRef } from 'react'
import type { TranscriptSegment } from '@/types'

interface TranscriptFeedProps {
  segments: TranscriptSegment[]
  isActive: boolean
}

export function TranscriptFeed({ segments, isActive }: TranscriptFeedProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [segments])

  if (segments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <svg className="w-12 h-12 mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
        <p className="text-sm">
          {isActive ? 'Listening... Start speaking' : 'No transcript yet'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3 overflow-y-auto h-full p-4">
      {segments.map((segment) => (
        <div
          key={segment.id}
          className={`flex gap-2 ${segment.speaker === 'agent' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[80%] rounded-lg px-4 py-2 ${
              segment.speaker === 'agent'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-900'
            }`}
          >
            <p className="text-xs font-medium mb-1 opacity-75 capitalize">{segment.speaker}</p>
            <p className="text-sm leading-relaxed">{segment.text}</p>
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
