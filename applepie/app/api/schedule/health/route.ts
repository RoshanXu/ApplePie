import { NextResponse } from "next/server";
import { calculateFiveDimensions } from "@applepie/schedule/fiveDim";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/schedule/health?studentId=xxx&grade=初二上
 * Returns five-dimension health analysis using real schedule data.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId") ?? "mock-student-id";
    const grade = searchParams.get("grade") ?? "初二上";

    // Fetch from database
    const schedules = await prisma.schedule.findMany({
      where: { studentId },
      select: { category: true, startTime: true, endTime: true },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    if (schedules.length === 0) {
      return NextResponse.json({
        report: null,
        message: "暂无日程数据。请先添加课表后再查看健康度分析。",
      });
    }

    const report = calculateFiveDimensions(schedules, grade);
    return NextResponse.json({ report });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
