import { prisma } from "./prisma";

// Student profile queries
export async function getStudentProfile(userId: string) {
  return prisma.studentProfile.findUnique({
    where: { userId },
    include: { subjects: true, user: { select: { id: true, nickname: true, role: true } } },
  });
}

export async function updateStudentProfile(
  userId: string,
  data: {
    nickname?: string;
    grade?: string;
    textbookVersion?: string;
  }
) {
  // Update user nickname if provided
  if (data.nickname) {
    await prisma.user.update({
      where: { id: userId },
      data: { nickname: data.nickname },
    });
  }

  // Update student profile
  const profileData: Record<string, unknown> = {};
  if (data.grade) profileData.grade = data.grade;
  if (data.textbookVersion) profileData.textbookVersion = data.textbookVersion;

  if (Object.keys(profileData).length > 0) {
    await prisma.studentProfile.update({
      where: { userId },
      data: profileData,
    });
  }

  return getStudentProfile(userId);
}

export async function getStudentKnowledgePoints(studentId: string) {
  return prisma.studentKnowledgePoint.findMany({
    where: { studentId },
    include: { knowledgePoint: true },
  });
}
