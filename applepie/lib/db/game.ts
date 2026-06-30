import { prisma } from "./prisma";

// Game session queries
export async function getLatestGameSession(studentId: string) {
  return prisma.gameSession.findFirst({
    where: { studentId },
    orderBy: { startedAt: "desc" },
    include: { result: true },
  });
}

export async function getGameResults(studentId: string) {
  return prisma.gameResult.findMany({
    where: { studentId },
    include: { session: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAbilityProfile(studentId: string) {
  return prisma.abilityProfile.findUnique({
    where: { studentId },
  });
}
