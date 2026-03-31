'use client'

import { useState } from 'react'

interface ProspectInfoFormProps {
  onSubmit: (data: { prospectName: string; prospectPhone: string }) => void
  onSkip: () => void
}

export function ProspectInfoForm({ onSubmit, onSkip }: ProspectInfoFormProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ prospectName: name, prospectPhone: phone })
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Before You Start</h2>
      <p className="text-gray-500 text-sm mb-6">
        Add prospect details to organize your call history. You can skip this step.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Prospect Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Smith"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 000-0000"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium text-sm transition-colors"
          >
            Start Call
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium text-sm transition-colors"
          >
            Skip
          </button>
        </div>
      </form>
    </div>
  )
}
