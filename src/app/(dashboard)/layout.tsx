export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <span className="text-xl font-bold text-brand-700">
              Life Insurance Copilot
            </span>
            <div className="flex gap-4 text-sm text-gray-600">
              <a href="/dashboard" className="hover:text-brand-600">Dashboard</a>
              <a href="/dashboard/call" className="hover:text-brand-600">Start Call</a>
              <a href="/dashboard/history" className="hover:text-brand-600">History</a>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
