// ================================================================
// Parent Weekly Report — Data aggregation & generation
// ================================================================

import type { DimCategory } from "@prisma/client";
import { calculateFiveDimensions, type FiveDimReport } from "@applepie/schedule/fiveDim";

export interface WeeklyReportData {
  weekStart: string;       // ISO date
  weekEnd: string;         // ISO date
  studentName: string;
  grade: string;
  timeDistribution: Record<string, { pct: number; hours: number; status: string }>;
  gameSummary: {
    totalGames: number;
    completedGames: number;
    totalScenes: number;
    highlights: string[];
  };
  abilityChanges: {
    improvedKnowledge: string[];
    newInterests: string[];
  };
  highlights: string[];
}

/**
 * Generate a weekly report for a student.
 * MVP: returns mock data based on the five-dim model.
 */
export function generateWeeklyReport(
  schedules: { category: DimCategory; startTime: string; endTime: string }[],
  grade: string,
  studentName: string,
): WeeklyReportData {
  const fiveDim = calculateFiveDimensions(schedules, grade);

  const timeDistribution: Record<string, { pct: number; hours: number; status: string }> = {};
  for (const d of fiveDim.dimensions) {
    timeDistribution[d.category] = {
      pct: Math.round(d.actualRatio * 100),
      hours: Math.round(d.actualHours * 10) / 10,
      status: d.status === "normal" ? "✓ 正常" : d.severity === "critical" ? "❌ 需关注" : "⚠️ 可调整",
    };
  }

  // Game highlights (mock)
  const gameSummary = {
    totalGames: 3,
    completedGames: 2,
    totalScenes: 8,
    highlights: [
      "在星际探险游戏中展现了出色的逻辑推理能力",
      "一次函数章节有明显进步，正确率从 40% 提升到 60%",
    ],
  };

  // Ability changes (mock)
  const abilityChanges = {
    improvedKnowledge: ["一次函数的图像与性质"],
    newInterests: ["太空探索", "逻辑推理"],
  };

  // Highlights
  const highlights: string[] = [];
  for (const d of fiveDim.dimensions) {
    if (d.severity === "critical") {
      highlights.push(`${d.emoji} ${d.label}时间严重不足，建议优先调整`);
    }
  }
  if (gameSummary.completedGames > 0) {
    highlights.push(`🎮 本周完成了 ${gameSummary.completedGames} 局 AI 游戏`);
  }
  if (highlights.length === 0) {
    highlights.push("✅ 本周各项指标整体良好");
  }

  return {
    weekStart: getWeekStart(new Date()),
    weekEnd: getWeekEnd(new Date()),
    studentName,
    grade,
    timeDistribution,
    gameSummary,
    abilityChanges,
    highlights,
  };
}

function getWeekStart(date: Date): string {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().slice(0, 10);
}

function getWeekEnd(date: Date): string {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay() + 6);
  return d.toISOString().slice(0, 10);
}
