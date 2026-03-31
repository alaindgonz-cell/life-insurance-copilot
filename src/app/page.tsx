import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-900 to-brand-700 flex items-center justify-center">
      <div className="text-center text-white">
        <h1 className="text-5xl font-bold mb-4">Life Insurance Copilot</h1>
        <p className="text-xl text-blue-200 mb-8">
          Real-time AI assistance for insurance sales calls
        </p>
        <Link
          href="/dashboard"
          className="bg-white text-brand-700 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </main>
  )
}
