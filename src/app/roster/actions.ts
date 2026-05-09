"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function toggleOwned(animusId: string, owned: boolean) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  await prisma.userAnimus.upsert({
    where: { userId_animusId: { userId: session.user.id, animusId } },
    update: { owned },
    create: { userId: session.user.id, animusId, owned },
  });

  revalidatePath("/roster");
}
