import { CallView } from '@/components/call/CallView'

const PLACEHOLDER_AGENT_ID = 'agent-placeholder-001'

export default function CallPage() {
  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Start a Call</h1>
          <p className="text-gray-500 text-sm mt-1">
            AI suggestions appear in real-time as you speak with prospects.
          </p>
        </div>
      </div>
      <div className="h-[calc(100%-5rem)]">
        <CallView agentId={PLACEHOLDER_AGENT_ID} />
      </div>
    </div>
  )
}
