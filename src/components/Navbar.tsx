import Link from "next/link";
import { auth } from "@/lib/auth";

export default async function Navbar() {
  const session = await auth();

  return (
    <nav className="border-b border-gray-800 bg-gray-950 px-6 py-3">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-bold text-violet-400">
            Etheria
          </Link>
          <Link href="/roster" className="text-sm text-gray-400 hover:text-white transition-colors">
            Roster
          </Link>
          <Link href="/rta" className="text-sm text-gray-400 hover:text-white transition-colors">
            RTA Draft
          </Link>
          <Link href="/meta" className="text-sm text-gray-400 hover:text-white transition-colors">
            Meta Stats
          </Link>
        </div>
        <div className="flex items-center gap-3">
          {session?.user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400">{session.user.name}</span>
              <Link
                href="/api/auth/signout"
                className="rounded-full border border-gray-700 px-3 py-1 text-xs text-gray-400 hover:text-white transition-colors"
              >
                Sign out
              </Link>
            </div>
          ) : (
            <Link
              href="/api/auth/signin"
              className="rounded-full bg-violet-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-violet-500 transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
