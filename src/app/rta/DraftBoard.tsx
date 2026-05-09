"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { getDraftRecommendation, submitMatchResult } from "./actions";

const ELEMENT_COLORS: Record<string, string> = {
  Reason:   "bg-red-500/20 text-red-300 border-red-500/40",
  Odd:      "bg-blue-500/20 text-blue-300 border-blue-500/40",
  Hollow:   "bg-green-500/20 text-green-300 border-green-500/40",
  Disorder: "bg-purple-500/20 text-purple-300 border-purple-500/40",
  Constant: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
};
const ELEMENT_DOT: Record<string, string> = {
  Reason: "bg-red-400", Odd: "bg-blue-400", Hollow: "bg-green-400",
  Disorder: "bg-purple-400", Constant: "bg-yellow-400",
};

// Pick order: index 0-9 → "me" | "enemy"
// First pick:  me picks 1,4,5,8,9  → indices 0,3,4,7,8
// Second pick: me picks 2,3,6,7,10 → indices 1,2,5,6,9
function buildPickOrder(first: "me" | "enemy"): Array<"me" | "enemy"> {
  const seq: Array<"me" | "enemy"> = ["A","A","B","B","A","A","B","B","A","B"].map(
    (x) => (x === "A" ? "me" : "enemy")
  );
  // first pick player gets slots A: 0,3,4,7,8 — confirmed by "1st left, 2-3 right, 4-5 left, 6-7 right, 8-9 left, 10 right"
  const order: Array<"me" | "enemy"> = [
    first,
    first === "me" ? "enemy" : "me",
    first === "me" ? "enemy" : "me",
    first,
    first,
    first === "me" ? "enemy" : "me",
    first === "me" ? "enemy" : "me",
    first,
    first,
    first === "me" ? "enemy" : "me",
  ];
  return order; // eslint-disable-line @typescript-eslint/no-unused-vars
  void seq;
}

type Animus = { id: string; name: string; element: string; rarity: string };
type Pick = { name: string; element: string };
type Rec = { name: string; reason: string };
type DraftResult = { phase: string; recommendations: Rec[]; teamAnalysis: string; banTarget: string };
type Phase = "setup" | "picking" | "banning" | "done";

function PickSlot({
  index, pick, isActive, isProtected, isBanned, side,
}: {
  index: number; pick: Pick | null; isActive: boolean; isProtected: boolean; isBanned: boolean; side: "me" | "enemy";
}) {
  return (
    <div className={`flex items-center gap-2 rounded-lg border p-2.5 transition-all ${
      isBanned ? "border-red-500/50 bg-red-500/5 opacity-50 line-through" :
      isActive ? "border-violet-500 bg-violet-500/10 shadow-sm shadow-violet-500/20" :
      pick ? "border-gray-700 bg-gray-900" : "border-dashed border-gray-800 bg-gray-900/40"
    } ${side === "enemy" ? "flex-row-reverse" : ""}`}>
      <span className="w-4 shrink-0 text-center text-xs text-gray-600">{index + 1}</span>
      {isProtected && !isBanned && (
        <span className="shrink-0 text-xs" title="Protected from ban">🛡</span>
      )}
      {isBanned && <span className="shrink-0 text-xs text-red-400">✕</span>}
      {pick ? (
        <>
          <span className={`h-2 w-2 shrink-0 rounded-full ${ELEMENT_DOT[pick.element] ?? "bg-gray-400"}`} />
          <span className={`flex-1 truncate text-sm font-medium text-white ${side === "enemy" ? "text-right" : ""}`}>
            {pick.name}
          </span>
        </>
      ) : (
        <span className={`flex-1 text-sm text-gray-600 ${side === "enemy" ? "text-right" : ""}`}>
          {isActive ? "← picking..." : "— empty —"}
        </span>
      )}
    </div>
  );
}

export default function DraftBoard({ allAnimuses }: { allAnimuses: Animus[] }) {
  const [phase, setPhase] = useState<Phase>("setup");
  const [firstPick, setFirstPick] = useState<"me" | "enemy">("me");
  const [picks, setPicks] = useState<(Pick | null)[]>(Array(10).fill(null)); // 10 total picks
  const [myBan, setMyBan] = useState<string | null>(null);
  const [enemyBan, setEnemyBan] = useState<string | null>(null);
  const [result, setResult] = useState<DraftResult | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [matchSubmitted, setMatchSubmitted] = useState(false);
  const [search, setSearch] = useState("");
  const [filterEl, setFilterEl] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pickOrder = buildPickOrder(firstPick);
  const currentPickIndex = picks.findIndex((p) => p === null);
  const allPicksDone = currentPickIndex === -1;

  // My picks are those where pickOrder[i] === "me"
  const myPicks = picks.filter((_, i) => pickOrder[i] === "me");
  const enemyPicks = picks.filter((_, i) => pickOrder[i] === "enemy");
  const myPicksFilled = myPicks.filter(Boolean) as Pick[];
  const enemyPicksFilled = enemyPicks.filter(Boolean) as Pick[];

  // Slots in order for display
  const mySlots = pickOrder
    .map((owner, i) => ({ owner, pick: picks[i], globalIndex: i }))
    .filter((x) => x.owner === "me");
  const enemySlots = pickOrder
    .map((owner, i) => ({ owner, pick: picks[i], globalIndex: i }))
    .filter((x) => x.owner === "enemy");

  const allPickedNames = picks.filter(Boolean).map((p) => p!.name);
  const currentOwner = phase === "picking" && !allPicksDone ? pickOrder[currentPickIndex] : null;

  // Auto-enter ban phase when all picks done
  useEffect(() => {
    if (allPicksDone && phase === "picking") setPhase("banning");
  }, [allPicksDone, phase]);

  // Auto AI recommendations
  useEffect(() => {
    if (phase !== "picking" && phase !== "banning") return;
    if (myPicksFilled.length === 0 && enemyPicksFilled.length === 0) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setIsUpdating(true);
      startTransition(async () => {
        try {
          const res = await getDraftRecommendation(
            myPicksFilled,
            enemyPicksFilled,
            allAnimuses.map((a) => ({ name: a.name, element: a.element }))
          );
          setResult(res);
        } finally {
          setIsUpdating(false);
        }
      });
    }, 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(picks), phase]);

  function selectAnimus(a: Animus) {
    if (phase !== "picking" || allPicksDone || allPickedNames.includes(a.name)) return;
    setPicks((prev) => {
      const updated = [...prev];
      updated[currentPickIndex] = { name: a.name, element: a.element };
      return updated;
    });
  }

  function removePick(globalIndex: number) {
    if (phase !== "picking") return;
    setPicks((prev) => {
      const updated = [...prev];
      updated[globalIndex] = null;
      // Shift: clear all picks after this index too (maintain order)
      for (let i = globalIndex + 1; i < updated.length; i++) updated[i] = null;
      return updated;
    });
    setResult(null);
  }

  function handleBan(bannedName: string, side: "my" | "enemy") {
    if (side === "my") setEnemyBan(bannedName);
    else setMyBan(bannedName);
    // Check if both bans done
    if (side === "my" && myBan) setPhase("done");
    if (side === "enemy" && enemyBan) setPhase("done");
  }

  async function handleSubmitResult(r: "WIN" | "LOSS") {
    await submitMatchResult(
      myPicksFilled.map((p) => p.name),
      enemyPicksFilled.map((p) => p.name),
      r
    );
    setMatchSubmitted(true);
  }

  function handleReset() {
    setPicks(Array(10).fill(null));
    setMyBan(null);
    setEnemyBan(null);
    setResult(null);
    setMatchSubmitted(false);
    setPhase("setup");
  }

  // Filtered animus list for bottom grid
  const filteredAnimuses = allAnimuses.filter((a) => {
    if (allPickedNames.includes(a.name)) return false;
    if (filterEl && a.element !== filterEl) return false;
    if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const ELEMENTS = ["Reason", "Odd", "Hollow", "Disorder", "Constant"];

  if (phase === "setup") {
    return (
      <div className="flex flex-col items-center justify-center gap-8 py-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">Who picks first?</h2>
          <p className="mt-2 text-gray-400">This determines the pick order for the draft.</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => { setFirstPick("me"); setPhase("picking"); }}
            className="rounded-xl border border-violet-500 bg-violet-500/10 px-10 py-5 text-lg font-semibold text-white hover:bg-violet-500/20 transition-all"
          >
            I pick first
          </button>
          <button
            onClick={() => { setFirstPick("enemy"); setPhase("picking"); }}
            className="rounded-xl border border-gray-600 bg-gray-900 px-10 py-5 text-lg font-semibold text-gray-300 hover:border-gray-400 transition-all"
          >
            Enemy picks first
          </button>
        </div>
        <p className="text-xs text-gray-600">Pick order: 1 / 2-3 / 4-5 / 6-7 / 8-9 / 10</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Draft header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {phase === "picking" && !allPicksDone && (
            <span className={`rounded-full px-3 py-1 text-sm font-medium ${
              currentOwner === "me"
                ? "bg-violet-500/20 text-violet-300"
                : "bg-orange-500/20 text-orange-300"
            }`}>
              {currentOwner === "me" ? "Your pick" : "Enemy's pick"} — {currentPickIndex + 1}/10
            </span>
          )}
          {allPicksDone && phase === "picking" && (
            <span className="rounded-full bg-yellow-500/20 px-3 py-1 text-sm font-medium text-yellow-300">
              All picks done — ready to ban
            </span>
          )}
          {phase === "banning" && (
            <span className="rounded-full bg-red-500/20 px-3 py-1 text-sm font-medium text-red-300">
              Ban phase
            </span>
          )}
          {phase === "done" && (
            <span className="rounded-full bg-green-500/20 px-3 py-1 text-sm font-medium text-green-300">
              Draft complete — 4v4
            </span>
          )}
        </div>
        <button onClick={handleReset} className="text-xs text-gray-600 hover:text-white transition-colors">
          ↺ New draft
        </button>
      </div>

      {/* Teams + AI */}
      <div className="grid grid-cols-3 gap-4">
        {/* My Team */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-violet-300">My Team</h3>
          {mySlots.map(({ pick, globalIndex }, slotIdx) => (
            <div key={globalIndex} onClick={() => removePick(globalIndex)} className={pick && phase === "picking" ? "cursor-pointer" : ""}>
              <PickSlot
                index={slotIdx}
                pick={pick ?? null}
                isActive={phase === "picking" && !allPicksDone && currentPickIndex === globalIndex}
                isProtected={slotIdx === 2}
                isBanned={pick?.name === enemyBan}
                side="me"
              />
            </div>
          ))}
        </div>

        {/* AI Panel */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white">AI Recommendations</h3>
            {isUpdating && <span className="h-3 w-3 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />}
          </div>

          {result ? (
            <div className="space-y-3">
              {result.teamAnalysis && (
                <div className="rounded-lg border border-gray-700 bg-gray-900/80 p-3">
                  <p className="text-xs text-gray-400 leading-relaxed">{result.teamAnalysis}</p>
                </div>
              )}

              {!allPicksDone && result.recommendations?.filter((r) => !allPickedNames.includes(r.name)).map((rec, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (currentOwner !== "me") return;
                    const a = allAnimuses.find((x) => x.name.toLowerCase() === rec.name.toLowerCase());
                    if (a) selectAnimus(a);
                  }}
                  disabled={currentOwner !== "me" || allPickedNames.includes(rec.name)}
                  className="w-full rounded-lg border border-violet-500/30 bg-violet-500/5 p-2.5 text-left hover:border-violet-500/60 hover:bg-violet-500/10 disabled:opacity-40 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-violet-300">#{i + 1} {rec.name}</span>
                    {currentOwner === "me" && <span className="text-xs text-violet-400">+ Pick</span>}
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">{rec.reason}</p>
                </button>
              ))}

              {/* Ban recommendation — always visible once all picks done */}
              {allPicksDone && result.banTarget && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-red-400">Recommended Ban</p>
                  <p className="text-xs text-gray-300">{result.banTarget}</p>
                </div>
              )}

              {/* Ban phase UI */}
              {phase === "banning" && (
                <div className="space-y-2 rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-400">Execute Bans</p>
                  {!myBan && (
                    <div>
                      <p className="mb-1 text-xs text-gray-500">You ban (click enemy pick):</p>
                      {enemyPicksFilled.filter((_, i) => i !== 2).map((p) => (
                        <button
                          key={p.name}
                          onClick={() => { setMyBan(p.name); if (enemyBan) setPhase("done"); }}
                          className="mb-1 flex w-full items-center gap-2 rounded border border-red-500/20 px-2 py-1.5 text-left text-xs text-gray-300 hover:bg-red-500/10 transition-colors"
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${ELEMENT_DOT[p.element]}`} />
                          {p.name}
                        </button>
                      ))}
                    </div>
                  )}
                  {myBan && <p className="text-xs text-red-300">✓ You banned: <strong>{myBan}</strong></p>}
                  {!enemyBan && (
                    <div>
                      <p className="mb-1 text-xs text-gray-500">Enemy banned (click your pick):</p>
                      {myPicksFilled.filter((_, i) => i !== 2).map((p) => (
                        <button key={p.name} onClick={() => { setEnemyBan(p.name); if (myBan) setPhase("done"); }}
                          className="mb-1 flex w-full items-center gap-2 rounded border border-orange-500/20 px-2 py-1.5 text-left text-xs text-gray-300 hover:bg-orange-500/10 transition-colors">
                          <span className={`h-1.5 w-1.5 rounded-full ${ELEMENT_DOT[p.element]}`} />
                          {p.name}
                        </button>
                      ))}
                    </div>
                  )}
                  {enemyBan && <p className="text-xs text-orange-300">✓ Enemy banned: <strong>{enemyBan}</strong></p>}
                </div>
              )}

              {/* Match result */}
              {phase === "done" && !matchSubmitted && (
                <div className="rounded-lg border border-gray-700 bg-gray-900 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Submit Result</p>
                  <div className="flex gap-2">
                    <button onClick={() => handleSubmitResult("WIN")}
                      className="flex-1 rounded-lg border border-green-500/40 bg-green-500/10 py-1.5 text-xs font-semibold text-green-300 hover:bg-green-500/20 transition-colors">
                      Win
                    </button>
                    <button onClick={() => handleSubmitResult("LOSS")}
                      className="flex-1 rounded-lg border border-red-500/40 bg-red-500/10 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/20 transition-colors">
                      Loss
                    </button>
                  </div>
                </div>
              )}
              {matchSubmitted && (
                <p className="text-center text-xs text-green-400">✓ Match saved!</p>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-800 p-4 text-center">
              <p className="text-xs text-gray-600">Pick an animus to get recommendations.</p>
            </div>
          )}
        </div>

        {/* Enemy Team */}
        <div className="space-y-2">
          <h3 className="text-right text-sm font-semibold text-orange-300">Enemy Team</h3>
          {enemySlots.map(({ pick, globalIndex }, slotIdx) => (
            <div key={globalIndex} onClick={() => removePick(globalIndex)} className={pick && phase === "picking" ? "cursor-pointer" : ""}>
              <PickSlot
                index={slotIdx}
                pick={pick ?? null}
                isActive={phase === "picking" && !allPicksDone && currentPickIndex === globalIndex}
                isProtected={slotIdx === 2}
                isBanned={pick?.name === myBan}
                side="enemy"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Animus picker grid */}
      {(phase === "picking" && !allPicksDone) && (
        <div className="mt-2 rounded-xl border border-gray-800 bg-gray-900/50 p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className={`text-xs font-medium ${currentOwner === "me" ? "text-violet-300" : "text-orange-300"}`}>
              {currentOwner === "me" ? "Click to add to your team:" : "Click to add to enemy team:"}
            </span>
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="rounded-md border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none"
            />
            {ELEMENTS.map((el) => (
              <button key={el} onClick={() => setFilterEl(filterEl === el ? null : el)}
                className={`rounded-full border px-2 py-0.5 text-xs transition-all ${
                  filterEl === el ? ELEMENT_COLORS[el] : "border-gray-700 text-gray-500 hover:text-white"
                }`}>
                {el}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12">
            {filteredAnimuses.map((a) => (
              <button
                key={a.id}
                onClick={() => selectAnimus(a)}
                draggable
                onDragStart={(e) => e.dataTransfer.setData("animusId", a.id)}
                title={`${a.name} (${a.element} · ${a.rarity})`}
                className={`rounded-lg border p-2 text-left transition-all hover:scale-105 active:scale-95 ${
                  ELEMENT_COLORS[a.element]
                } hover:brightness-125`}
              >
                <p className="truncate text-xs font-medium leading-tight">{a.name}</p>
                <p className="mt-0.5 text-xs opacity-60">{a.rarity}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
