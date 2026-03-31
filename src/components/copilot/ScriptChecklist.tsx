'use client'

interface ChecklistItem {
  id: string
  label: string
  checked: boolean
  required: boolean
}

interface ScriptChecklistProps {
  items: ChecklistItem[]
  score: number
}

export function ScriptChecklist({ items, score }: ScriptChecklistProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Script Progress</h3>
        <span
          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            score >= 80
              ? 'bg-green-100 text-green-700'
              : score >= 50
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {score}%
        </span>
      </div>
      <ul className="divide-y divide-gray-50 p-2">
        {items.map((item) => (
          <li
            key={item.id}
            className={`flex items-center gap-2 px-2 py-2 rounded ${
              item.checked ? 'opacity-70' : ''
            }`}
          >
            <span
              className={`flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                item.checked
                  ? 'bg-green-500 border-green-500'
                  : item.required
                  ? 'border-red-300'
                  : 'border-gray-300'
              }`}
            >
              {item.checked && (
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </span>
            <span
              className={`text-xs ${
                item.checked
                  ? 'line-through text-gray-400'
                  : item.required
                  ? 'text-gray-800'
                  : 'text-gray-600'
              }`}
            >
              {item.label}
              {item.required && !item.checked && (
                <span className="ml-1 text-red-500">*</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
