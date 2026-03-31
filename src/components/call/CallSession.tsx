'use client'

import { useCallback } from 'react'
import { useCallSession } from '@/hooks/useCallSession'
import { TranscriptFeed } from './TranscriptFeed'
import { AudioControls } from './AudioControls'

interface CallSessionProps {
  agentId: string
}

export function CallSession({ agentId }: CallSessionProps) {
  const {
    callState,
    sessionId,
    transcriptSegments,
    error,
    startCall,
    endCall,
    isMicActive,
    toggleMic,
  } = useCallSession()

  const handleStartCall = useCallback(async () => {
    await startCall(agentId)
  }, [startCall, agentId])

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Call Session</h2>
          {sessionId && (
            <p className="text-xs text-gray-400 font-mono">{sessionId.slice(0, 8)}...</p>
          )}
        </div>
        <StatusBadge state={callState} />
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Transcript Feed */}
      <div className="flex-1 min-h-0">
        <TranscriptFeed
          segments={transcriptSegments}
          isActive={callState === 'active'}
        />
      </div>

      {/* Audio Controls */}
      <AudioControls
        callState={callState}
        isMicActive={isMicActive}
        onStartCall={handleStartCall}
        onEndCall={endCall}
        onToggleMic={toggleMic}
      />
    </div>
  )
}

function StatusBadge({ state }: { state: string }) {
  const config: Record<string, { label: string; className: string }> = {
    idle: { label: 'Ready', className: 'bg-gray-100 text-gray-600' },
    connecting: { label: 'Connecting', className: 'bg-yellow-100 text-yellow-700' },
    active: { label: 'Live', className: 'bg-green-100 text-green-700' },
    ending: { label: 'Ending', className: 'bg-orange-100 text-orange-700' },
    ended: { label: 'Ended', className: 'bg-gray-100 text-gray-500' },
    error: { label: 'Error', className: 'bg-red-100 text-red-700' },
  }

  const { label, className } = config[state] ?? config.idle

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${className}`}>
      {state === 'active' && (
        <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse" />
      )}
      {label}
    </span>
  )
}
