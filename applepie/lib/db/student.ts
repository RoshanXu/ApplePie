import { prisma } from "./prisma";

// Student profile queries
export async function getStudentProfile(userId: string) {
  return prisma.studentProfile.findUnique({
    where: { userId },
    include: { subjects: true },
  });
}

export async function getStudentKnowledgePoints(studentId: string) {
  return prisma.studentKnowledgePoint.findMany({
    where: { studentId },
    include: { knowledgePoint: true },
  });
}
