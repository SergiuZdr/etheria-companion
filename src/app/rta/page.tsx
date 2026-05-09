import { prisma } from "@/lib/prisma";
import DraftBoard from "./DraftBoard";

export default async function RtaPage() {
  const animuses = await prisma.animus.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, element: true, rarity: true },
  });

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">RTA Draft Assistant</h1>
          <p className="mt-1 text-gray-400">
            Add picks as they happen — AI recommends what to pick or ban next.
          </p>
        </div>
        <DraftBoard allAnimuses={animuses} />
      </div>
    </main>
  );
}
