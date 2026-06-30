import { prisma } from "./prisma";

// Parent-related queries
export async function getBoundChildren(parentId: string) {
  const bindings = await prisma.parentChildBinding.findMany({
    where: { parentId, status: "active" },
    include: { student: { include: { user: true } } },
  });
  return bindings.map((b) => b.student);
}

export async function getWeeklyReport(studentId: string, parentId: string, weekStart: Date) {
  return prisma.weeklyReport.findUnique({
    where: {
      studentId_parentId_weekStart: {
        studentId,
        parentId,
        weekStart,
      },
    },
  });
}
