import { NextResponse } from "next/server";
import { generateWeeklyReport } from "@applepie/parent/report";
import type { DimCategory } from "@prisma/client";

/**
 * GET /api/parent/report
 * Returns the weekly report for a bound student.
 */
export async function GET() {
  try {
    // TODO: Get parentId from auth, get bound studentId, fetch schedules from DB
    const mockSchedules: { category: DimCategory; startTime: string; endTime: string }[] = [
      { category: "learn", startTime: "08:00", endTime: "11:30" },
      { category: "learn", startTime: "13:30", endTime: "15:30" },
      { category: "learn", startTime: "17:00", endTime: "18:30" },
      { category: "rest", startTime: "21:00", endTime: "07:00" },
      { category: "rest", startTime: "12:00", endTime: "13:00" },
      { category: "sport", startTime: "15:30", endTime: "16:30" },
      { category: "social", startTime: "18:30", endTime: "19:00" },
      { category: "explore", startTime: "19:30", endTime: "20:30" },
    ];

    const report = generateWeeklyReport(mockSchedules, "初二上", "小明");
    return NextResponse.json({ report });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
