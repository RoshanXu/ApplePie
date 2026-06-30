import { prisma } from "./prisma";
import type { DimCategory } from "@prisma/client";

// Schedule queries
export async function getWeekSchedules(studentId: string, weekStart: Date) {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  return prisma.schedule.findMany({
    where: { studentId },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });
}

export async function getSchedulesByCategory(studentId: string) {
  const schedules = await prisma.schedule.findMany({
    where: { studentId },
  });

  const byCategory: Record<DimCategory, typeof schedules> = {
    learn: [],
    rest: [],
    sport: [],
    social: [],
    explore: [],
  };

  for (const s of schedules) {
    byCategory[s.category].push(s);
  }

  return byCategory;
}
