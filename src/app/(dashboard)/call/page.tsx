import { CallSession } from '@/components/call/CallSession'

// Temporary: use a placeholder agent ID until auth is implemented (Phase 6)
const PLACEHOLDER_AGENT_ID = 'agent-placeholder-001'

export default function CallPage() {
  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Start a Call</h1>
          <p className="text-gray-500 text-sm mt-1">
            Click &quot;Start Call&quot; to begin capturing and transcribing your call in real-time.
          </p>
        </div>
      </div>
      <CallSession agentId={PLACEHOLDER_AGENT_ID} />
    </div>
  )
}
