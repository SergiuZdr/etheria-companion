"use client";

import { useEffect, useState } from "react";
import { getAIBuildRecommendation, saveBuild } from "./actions";

type Animus = {
  id: string;
  name: string;
  element: string;
  rarity: string;
};

type Build = {
  id: string;
  gameMode: string;
  notes: string | null;
  updatedAt: Date;
};

type AIRecommendation = {
  summary: string;
  modules: string;
  shells: string;
  imprints: string;
  reasoning: string;
};

export default function BuildOptimizer({
  animus,
  existingBuilds,
}: {
  animus: Animus;
  existingBuilds: Build[];
}) {
  const [recommendation, setRecommendation] = useState<AIRecommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getAIBuildRecommendation(animus.id, "RTA")
      .then(setRecommendation)
      .catch((e) => setError(e.message ?? "Failed to generate build recommendation."))
      .finally(() => setLoading(false));
  }, [animus.id]);

  async function handleSave() {
    if (!recommendation) return;
    await saveBuild(animus.id, "RTA", recommendation, notes);
    setSaved(true);
  }

  async function handleRegenerate() {
    setLoading(true);
    setRecommendation(null);
    setError(null);
    setSaved(false);
    try {
      const result = await getAIBuildRecommendation(animus.id, "RTA");
      setRecommendation(result);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Recommended RTA Build</h2>
        {!loading && (
          <button
            onClick={handleRegenerate}
            className="text-xs text-gray-500 hover:text-white transition-colors"
          >
            ↻ Regenerate
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-8 flex flex-col items-center gap-3">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
          <p className="text-sm text-gray-400">AI is analyzing the optimal build for {animus.name}...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Recommendation */}
      {recommendation && (
        <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-6 space-y-4">
          <p className="text-gray-300 text-sm leading-relaxed">{recommendation.summary}</p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-gray-700 bg-gray-900 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Modules</p>
              <p className="text-sm text-gray-200 whitespace-pre-line">{recommendation.modules}</p>
            </div>
            <div className="rounded-lg border border-gray-700 bg-gray-900 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Shells</p>
              <p className="text-sm text-gray-200 whitespace-pre-line">{recommendation.shells}</p>
            </div>
            <div className="rounded-lg border border-gray-700 bg-gray-900 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Imprints</p>
              <p className="text-sm text-gray-200 whitespace-pre-line">{recommendation.imprints}</p>
            </div>
          </div>

          <div className="rounded-lg border border-gray-700 bg-gray-900 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Why it works</p>
            <p className="text-sm text-gray-300 leading-relaxed">{recommendation.reasoning}</p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="text"
              placeholder="Optional notes (e.g. build vs CC teams)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="flex-1 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none"
            />
            <button
              onClick={handleSave}
              disabled={saved}
              className="rounded-full border border-violet-500 px-4 py-2 text-sm text-violet-300 hover:bg-violet-500/10 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              {saved ? "✓ Saved" : "Save"}
            </button>
          </div>
        </div>
      )}

      {/* Existing builds */}
      {existingBuilds.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Previously Saved Builds
          </h3>
          <div className="space-y-2">
            {existingBuilds.map((build) => (
              <div key={build.id} className="rounded-lg border border-gray-800 bg-gray-900 p-4">
                <div className="flex items-center justify-between">
                  <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-xs text-violet-300">
                    {build.gameMode}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(build.updatedAt).toLocaleDateString("en-US")}
                  </span>
                </div>
                {build.notes && (
                  <p className="mt-2 text-sm text-gray-400">{build.notes}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
