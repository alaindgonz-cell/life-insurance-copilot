'use client'

interface ComplianceAlertProps {
  severity: 'warning' | 'error'
  message: string
  correction: string
  flaggedText: string
  onDismiss: () => void
}

export function ComplianceAlert({
  severity,
  message,
  correction,
  flaggedText,
  onDismiss,
}: ComplianceAlertProps) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        severity === 'error'
          ? 'border-red-300 bg-red-50'
          : 'border-yellow-300 bg-yellow-50'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{severity === 'error' ? '🚨' : '⚠️'}</span>
          <span
            className={`text-xs font-bold uppercase tracking-wide ${
              severity === 'error' ? 'text-red-700' : 'text-yellow-700'
            }`}
          >
            {severity === 'error' ? 'Compliance Violation' : 'Compliance Warning'}
          </span>
        </div>
        <button
          onClick={onDismiss}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <p className="text-sm text-gray-800 mb-2">{message}</p>

      <div
        className={`text-xs px-2 py-1 rounded mb-2 font-mono ${
          severity === 'error' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
        }`}
      >
        Detected: &ldquo;{flaggedText}&rdquo;
      </div>

      <p className="text-xs text-gray-600 italic">{correction}</p>
    </div>
  )
}
