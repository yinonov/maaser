export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-br from-primary/10 to-secondary/10">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm">
        <div className="text-center">
          <h1 className="text-6xl font-bold mb-4 text-primary">
            HaMaaser
          </h1>
          <p className="text-2xl mb-8 text-gray-600">
            Digital Tithing Platform - Dashboard
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-primary">
              <h2 className="text-xl font-semibold mb-2 text-primary">🏢 NGO Management</h2>
              <p className="text-gray-600">Manage your organization&apos;s stories and donations</p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-secondary">
              <h2 className="text-xl font-semibold mb-2 text-secondary">📖 Stories</h2>
              <p className="text-gray-600">Create and publish beneficiary stories</p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-accent">
              <h2 className="text-xl font-semibold mb-2 text-accent">💰 Donations</h2>
              <p className="text-gray-600">Track and manage donations in real-time</p>
            </div>
          </div>
          <div className="mt-12 space-y-4">
            <p className="text-sm text-gray-500">
              🚀 Phase 2 Foundation Complete
            </p>
            <div className="flex flex-wrap gap-2 justify-center text-xs">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">✓ Firebase Connected</span>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">✓ NextAuth Ready</span>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">✓ TypeScript Types</span>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">✓ Firestore Rules</span>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">✓ Storage Enabled</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

