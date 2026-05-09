"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toggleOwned } from "./actions";

const ELEMENT_COLORS: Record<string, string> = {
  Reason: "bg-red-500/20 text-red-300 border-red-500/30",
  Odd: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Hollow: "bg-green-500/20 text-green-300 border-green-500/30",
  Disorder: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  Constant: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
};

const ELEMENTS = ["Reason", "Odd", "Hollow", "Disorder", "Constant"];
const RARITIES = ["SSR", "SR", "R"];

type Animus = {
  id: string;
  name: string;
  element: string;
  rarity: string;
  description: string | null;
  owned: boolean;
};

export default function AnimusGrid({ animuses }: { animuses: Animus[] }) {
  const [optimistic, setOptimistic] = useState<Record<string, boolean>>({});
  const [, startTransition] = useTransition();
  const [filterElement, setFilterElement] = useState<string | null>(null);
  const [filterRarity, setFilterRarity] = useState<string | null>(null);
  const [filterOwned, setFilterOwned] = useState(false);
  const [search, setSearch] = useState("");

  const isOwned = (a: Animus) => optimistic[a.id] ?? a.owned;

  function handleToggle(e: React.MouseEvent, animusId: string, currentOwned: boolean) {
    e.preventDefault();
    setOptimistic((prev) => ({ ...prev, [animusId]: !currentOwned }));
    startTransition(async () => {
      await toggleOwned(animusId, !currentOwned);
    });
  }

  const filtered = animuses.filter((a) => {
    if (filterElement && a.element !== filterElement) return false;
    if (filterRarity && a.rarity !== filterRarity) return false;
    if (filterOwned && !isOwned(a)) return false;
    if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const ownedCount = animuses.filter((a) => isOwned(a)).length;

  return (
    <div>
      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search animus..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none"
        />
        <div className="flex gap-1">
          {ELEMENTS.map((el) => (
            <button
              key={el}
              onClick={() => setFilterElement(filterElement === el ? null : el)}
              className={`rounded-full border px-3 py-1 text-xs transition-all ${
                filterElement === el
                  ? ELEMENT_COLORS[el]
                  : "border-gray-700 bg-gray-900 text-gray-400 hover:text-white"
              }`}
            >
              {el}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {RARITIES.map((r) => (
            <button
              key={r}
              onClick={() => setFilterRarity(filterRarity === r ? null : r)}
              className={`rounded-full border px-3 py-1 text-xs transition-all ${
                filterRarity === r
                  ? "border-amber-500 bg-amber-500/20 text-amber-300"
                  : "border-gray-700 bg-gray-900 text-gray-400 hover:text-white"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <button
          onClick={() => setFilterOwned(!filterOwned)}
          className={`rounded-full border px-3 py-1 text-xs transition-all ${
            filterOwned
              ? "border-violet-500 bg-violet-500/20 text-violet-300"
              : "border-gray-700 bg-gray-900 text-gray-400 hover:text-white"
          }`}
        >
          Owned ({ownedCount})
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {filtered.map((animus) => {
          const owned = isOwned(animus);
          const elementStyle = ELEMENT_COLORS[animus.element] ?? "bg-gray-500/20 text-gray-300 border-gray-500/30";
          return (
            <div key={animus.id} className="relative">
              <Link
                href={owned ? `/roster/${animus.id}` : "#"}
                className={`block rounded-xl border p-4 text-left transition-all duration-200 ${
                  owned
                    ? "border-violet-500 bg-violet-500/10 shadow-lg shadow-violet-500/10 hover:border-violet-400"
                    : "border-gray-800 bg-gray-900 opacity-50"
                }`}
              >
                {owned && (
                  <span className="absolute right-8 top-2 text-violet-400 text-xs font-bold">✓</span>
                )}
                <div className="mb-2 h-12 w-12 rounded-full bg-gray-800 flex items-center justify-center text-xl font-bold text-gray-400">
                  {animus.name[0]}
                </div>
                <p className="font-semibold text-sm text-white truncate">{animus.name}</p>
                <div className="mt-1 flex gap-1 flex-wrap">
                  <span className={`rounded-full border px-2 py-0.5 text-xs ${elementStyle}`}>
                    {animus.element}
                  </span>
                  <span className="rounded-full border border-amber-500/30 bg-amber-500/20 px-2 py-0.5 text-xs text-amber-300">
                    {animus.rarity}
                  </span>
                </div>
              </Link>
              {/* Toggle owned button */}
              <button
                onClick={(e) => handleToggle(e, animus.id, owned)}
                title={owned ? "Mark as not owned" : "Mark as owned"}
                className="absolute right-2 top-2 rounded-full p-1 text-gray-500 hover:text-white transition-colors"
              >
                {owned ? "★" : "☆"}
              </button>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="mt-12 text-center text-gray-500">No animuses found for the selected filters.</p>
      )}
    </div>
  );
}
