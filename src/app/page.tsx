import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="mb-8">
        <h1 className="text-5xl font-bold tracking-tight text-white">
          Etheria <span className="text-violet-400">Companion</span>
        </h1>
        <p className="mt-4 text-lg text-gray-400">
          Build optimizer &amp; RTA draft assistant for Etheria: Restart
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 w-full max-w-2xl">
        <Link
          href="/roster"
          className="rounded-xl border border-gray-800 bg-gray-900 p-6 hover:border-violet-500 transition-colors"
        >
          <h2 className="text-lg font-semibold text-white">Roster</h2>
          <p className="mt-1 text-sm text-gray-400">Manage your animuses and builds</p>
        </Link>

        <Link
          href="/rta"
          className="rounded-xl border border-gray-800 bg-gray-900 p-6 hover:border-violet-500 transition-colors"
        >
          <h2 className="text-lg font-semibold text-white">RTA Draft</h2>
          <p className="mt-1 text-sm text-gray-400">Live pick &amp; ban assistant</p>
        </Link>

        <Link
          href="/meta"
          className="rounded-xl border border-gray-800 bg-gray-900 p-6 hover:border-violet-500 transition-colors"
        >
          <h2 className="text-lg font-semibold text-white">Meta Stats</h2>
          <p className="mt-1 text-sm text-gray-400">Community win rates &amp; statistics</p>
        </Link>
      </div>

      <div className="mt-10">
        <Link
          href="/api/auth/signin"
          className="rounded-full bg-violet-600 px-8 py-3 text-sm font-semibold text-white hover:bg-violet-500 transition-colors"
        >
          Sign in to get started
        </Link>
      </div>
    </main>
  );
}
