import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import AnimusGrid from "./AnimusGrid";

export default async function RosterPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/api/auth/signin");

  const allAnimuses = await prisma.animus.findMany({ orderBy: { name: "asc" } });

  const userAnimuses = await prisma.userAnimus.findMany({
    where: { userId: session.user.id },
  });

  const ownedIds = new Set(
    userAnimuses.filter((ua) => ua.owned).map((ua) => ua.animusId)
  );

  const animusesWithOwned = allAnimuses.map((a) => ({
    ...a,
    owned: ownedIds.has(a.id),
  }));

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Roster</h1>
          <p className="mt-1 text-gray-400">
            Mark the animuses you own. {ownedIds.size} / {allAnimuses.length} owned.
          </p>
        </div>
        <AnimusGrid animuses={animusesWithOwned} />
      </div>
    </main>
  );
}
