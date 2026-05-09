"use server";

import Groq from "groq-sdk";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are an expert Etheria: Restart RTA (Real-Time Arena) draft coach.
Game rules: each player picks 5 animuses. Slot 3 is protected from bans. After all picks, each player bans 1 animus from the opponent's team (not slot 3).
Elements: Reason (red), Odd (blue), Hollow (green), Disorder (purple), Constant (yellow).
Key roles: DPS, Support/Healer, Tank, Control/CC, Buffer/Debuffer.
Always respond with valid JSON only, no markdown, no code blocks.`;

type AnimusDraft = { name: string; element: string };

export async function getDraftRecommendation(
  myPicks: AnimusDraft[],
  enemyPicks: AnimusDraft[],
  allAnimuses: AnimusDraft[]
) {
  const picked = [...myPicks, ...enemyPicks].map((a) => a.name);
  const available = allAnimuses.filter((a) => !picked.includes(a.name));
  const myPicksLeft = 5 - myPicks.length;

  // Fetch community WR stats to enrich the prompt
  const topStats = await prisma.draftPickStat.findMany({
    where: { picks: { gt: 0 } },
    orderBy: { wins: "desc" },
    take: 15,
    include: { animus: { select: { name: true } } },
  });

  const wrContext = topStats.length > 0
    ? "Community WR data (picks/wins): " +
      topStats
        .map((s) => `${s.animus.name} ${s.picks}p ${Math.round((s.wins / s.picks) * 100)}%WR`)
        .join(", ")
    : "No community WR data yet.";

  const prompt = `Current RTA draft state:
My picks (${myPicks.length}/5): ${myPicks.length ? myPicks.map((a) => `${a.name} (${a.element})`).join(", ") : "none yet"}
Enemy picks (${enemyPicks.length}/5): ${enemyPicks.length ? enemyPicks.map((a) => `${a.name} (${a.element})`).join(", ") : "none yet"}
I still need to pick: ${myPicksLeft} more animus${myPicksLeft !== 1 ? "es" : ""}
${wrContext}

Available animuses: ${available.slice(0, 25).map((a) => `${a.name} (${a.element})`).join(", ")}

${myPicksLeft > 0 ? `Recommend my next ${Math.min(3, myPicksLeft)} best picks.` : "All picks done. Recommend which enemy animus to ban."}

Respond with this exact JSON:
{
  "phase": "picking",
  "recommendations": [
    { "name": "Animus Name", "reason": "short reason" },
    { "name": "Animus Name", "reason": "short reason" },
    { "name": "Animus Name", "reason": "short reason" }
  ],
  "teamAnalysis": "brief analysis of current composition and what's needed",
  "banTarget": "which enemy animus to ban and why (only if all 5 picks done, otherwise empty string)"
}`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.5,
    max_tokens: 800,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
  });

  const text = completion.choices[0]?.message?.content?.trim() ?? "";
  const clean = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();

  try {
    return JSON.parse(clean);
  } catch {
    return {
      phase: "picking",
      recommendations: [{ name: "—", reason: text }],
      teamAnalysis: "Could not parse AI response.",
      banTarget: "",
    };
  }
}

export async function submitMatchResult(
  myPicks: string[],
  enemyPicks: string[],
  result: "WIN" | "LOSS"
) {
  const session = await auth();

  // Save the match (anonymous allowed)
  await prisma.rtaMatch.create({
    data: {
      reportedBy: session?.user?.id ?? "anonymous",
      myPicks,
      enemyPicks,
      myBans: [],
      enemyBans: [],
      result,
    },
  });

  // Update DraftPickStat for each animus on my team
  for (const name of myPicks) {
    const animus = await prisma.animus.findUnique({ where: { name } });
    if (!animus) continue;
    await prisma.draftPickStat.upsert({
      where: { animusId_season: { animusId: animus.id, season: "SS4" } },
      update: {
        picks: { increment: 1 },
        wins: result === "WIN" ? { increment: 1 } : undefined,
      },
      create: {
        animusId: animus.id,
        season: "SS4",
        picks: 1,
        wins: result === "WIN" ? 1 : 0,
        bans: 0,
      },
    });
  }

  // Update DraftPickStat for enemy picks too (as losses for them if we won)
  for (const name of enemyPicks) {
    const animus = await prisma.animus.findUnique({ where: { name } });
    if (!animus) continue;
    await prisma.draftPickStat.upsert({
      where: { animusId_season: { animusId: animus.id, season: "SS4" } },
      update: {
        picks: { increment: 1 },
        wins: result === "LOSS" ? { increment: 1 } : undefined,
      },
      create: {
        animusId: animus.id,
        season: "SS4",
        picks: 1,
        wins: result === "LOSS" ? 1 : 0,
        bans: 0,
      },
    });
  }
}
