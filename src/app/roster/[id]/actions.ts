"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Groq from "groq-sdk";
import { revalidatePath } from "next/cache";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are an expert Etheria: Restart build optimizer.
The game has 5 elements: Reason (red), Odd (blue), Hollow (green), Disorder (purple), Constant (yellow).
Each animus equips: 6 Modules (Mask, Transistor, Wristwheel + 3 Cores), Shells (floating accessories with extra skills), and Imprints (element-based stat bonuses).
Key stats: ATK, HP, SPD, DEF, CRIT Rate, CRIT DMG, Effect Hit, Effect RES.
Always respond with valid JSON only, no markdown, no code blocks.`;

export async function getAIBuildRecommendation(animusId: string, gameMode: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const animus = await prisma.animus.findUnique({ where: { id: animusId } });
  if (!animus) throw new Error("Animus not found");

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.7,
    max_tokens: 1024,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Give me the optimal build for ${animus.name} (${animus.element} element, ${animus.rarity} rarity) for ${gameMode} mode in Etheria: Restart.

Respond with this exact JSON structure:
{
  "summary": "2-3 sentence overview of the build strategy",
  "modules": "recommended module stats (main stats and substats to prioritize)",
  "shells": "recommended shells and why",
  "imprints": "recommended imprint sets and priorities",
  "reasoning": "detailed explanation of why this build works for this character in this mode"
}`,
      },
    ],
  });

  const text = completion.choices[0]?.message?.content?.trim() ?? "";
  const clean = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();

  try {
    return JSON.parse(clean);
  } catch {
    return {
      summary: clean,
      modules: "See full reasoning.",
      shells: "See full reasoning.",
      imprints: "See full reasoning.",
      reasoning: clean,
    };
  }
}

export async function saveBuild(
  animusId: string,
  gameMode: string,
  recommendation: object,
  notes: string
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  await prisma.userBuild.create({
    data: {
      userId: session.user.id,
      animusId,
      gameMode,
      modules: recommendation,
      notes: notes || null,
    },
  });

  revalidatePath(`/roster/${animusId}`);
}
