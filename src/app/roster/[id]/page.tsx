import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import BuildOptimizer from "./BuildOptimizer";

export default async function AnimusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/api/auth/signin");

  const animus = await prisma.animus.findUnique({ where: { id } });
  if (!animus) notFound();

  const userAnimus = await prisma.userAnimus.findUnique({
    where: { userId_animusId: { userId: session.user.id, animusId: id } },
  });
  if (!userAnimus?.owned) redirect("/roster");

  const existingBuilds = await prisma.userBuild.findMany({
    where: { userId: session.user.id, animusId: id },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/roster" className="text-sm text-gray-500 hover:text-white transition-colors">
          ← Back to Roster
        </Link>

        <div className="mt-6 flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-gray-800 flex items-center justify-center text-2xl font-bold text-gray-300">
            {animus.name[0]}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">{animus.name}</h1>
            <div className="mt-1 flex gap-2">
              <span className="rounded-full border border-gray-600 px-3 py-0.5 text-sm text-gray-300">
                {animus.element}
              </span>
              <span className="rounded-full border border-amber-500/50 bg-amber-500/10 px-3 py-0.5 text-sm text-amber-300">
                {animus.rarity}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <BuildOptimizer animus={animus} existingBuilds={existingBuilds} />
        </div>
      </div>
    </main>
  );
}
