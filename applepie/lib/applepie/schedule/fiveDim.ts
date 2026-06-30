// ================================================================
// 五维健康度计算引擎
// 基于《中小学生时间分配调研报告》的权威数据模型
// 数据来源：中国教育部、国家卫健委、WHO、AAP
// ================================================================

import type { DimCategory } from "@prisma/client";

// ================================================================
// 1. 目标模型定义
// ================================================================

/** 学段 */
export type SchoolStage = "primary" | "junior" | "senior";

/** 时段模式 */
export type PeriodMode = "school" | "vacation";

/** 单个五维维度的目标区间 */
export interface DimensionTarget {
  /** 推荐占比区间下限 (0-1) */
  minRatio: number;
  /** 推荐占比区间上限 (0-1) */
  maxRatio: number;
  /** 此时间段推荐的总小时数(下限) */
  minHours: number;
  /** 此时间段推荐的总小时数(上限) */
  maxHours: number;
  /** 是否为"铁底"（不可挤占的底线） */
  isHardBottom: boolean;
  /** 监控指标说明 */
  note: string;
}

/** 五维目标模型 */
export interface FiveDimTargetModel {
  stage: SchoolStage;
  mode: PeriodMode;
  dimensions: Record<string, DimensionTarget>;
  /** 非五维时间（饮食起居等）占比 */
  overheadRatio: number;
  /** 弹性留白占比（假期） */
  bufferRatio?: number;
}

// ================================================================
// 2. 调研报告完整数据 → 目标模型
// 参考: research/中小学生时间分配调研报告.md
// ================================================================

/**
 * 上学期间目标模型
 * 数据来源: 调研报告第四节"五维比例速查表 — 上学期间"
 */
const SCHOOL_TERM_MODELS: Record<SchoolStage, FiveDimTargetModel> = {
  primary: {
    stage: "primary",
    mode: "school",
    overheadRatio: 0.08, // 饮食起居 8%
    dimensions: {
      rest: {
        minRatio: 0.42, maxRatio: 0.42,
        minHours: 10, maxHours: 10,
        isHardBottom: true,
        note: "教育部强制要求小学生 10h 睡眠，不可挤占",
      },
      learn: {
        minRatio: 0.29, maxRatio: 0.34,
        minHours: 7, maxHours: 8,
        isHardBottom: false,
        note: "含在校学习 7h + 作业自习 1-1.5h，总计 ≤8h",
      },
      sport: {
        minRatio: 0.08, maxRatio: 0.10,
        minHours: 2, maxHours: 2.5,
        isHardBottom: true,
        note: "教育部要求每日体育活动 ≥2h（含体育课+课间），MVPA ≥60min",
      },
      social: {
        minRatio: 0.03, maxRatio: 0.05,
        minHours: 0.5, maxHours: 1,
        isHardBottom: false,
        note: "家庭对话、同伴互动（定性建议，基于作息框架反推）",
      },
      explore: {
        minRatio: 0.05, maxRatio: 0.08,
        minHours: 1, maxHours: 1.5,
        isHardBottom: false,
        note: "弹性时间：阅读、兴趣、游戏（定性建议，基于作息框架反推）",
      },
    },
  },
  junior: {
    stage: "junior",
    mode: "school",
    overheadRatio: 0.08,
    dimensions: {
      rest: {
        minRatio: 0.38, maxRatio: 0.38,
        minHours: 9, maxHours: 9,
        isHardBottom: true,
        note: "教育部强制要求初中生 9h 睡眠",
      },
      learn: {
        minRatio: 0.40, maxRatio: 0.44,
        minHours: 9.5, maxHours: 11,
        isHardBottom: false,
        note: "含在校学习 8h + 作业自习 2-3h，总计 ≤11h",
      },
      sport: {
        minRatio: 0.07, maxRatio: 0.08,
        minHours: 1.5, maxHours: 2,
        isHardBottom: true,
        note: "MVPA ≥60min，每日体育活动总量 ≥2h",
      },
      social: {
        minRatio: 0.02, maxRatio: 0.04,
        minHours: 0.5, maxHours: 1,
        isHardBottom: false,
        note: "同伴互动（定性建议，基于作息框架反推）",
      },
      explore: {
        minRatio: 0.03, maxRatio: 0.05,
        minHours: 0.5, maxHours: 1,
        isHardBottom: false,
        note: "兴趣发展（定性建议，基于作息框架反推）",
      },
    },
  },
  senior: {
    stage: "senior",
    mode: "school",
    overheadRatio: 0.06,
    dimensions: {
      rest: {
        minRatio: 0.35, maxRatio: 0.35,
        minHours: 8.5, maxHours: 8.5,
        isHardBottom: true,
        note: "教育部要求高中生 8-9h 睡眠",
      },
      learn: {
        minRatio: 0.45, maxRatio: 0.50,
        minHours: 11, maxHours: 12,
        isHardBottom: false,
        note: "含在校学习 9h + 自习 2-3h，总计 ≤12h",
      },
      sport: {
        minRatio: 0.05, maxRatio: 0.06,
        minHours: 1, maxHours: 1.5,
        isHardBottom: true,
        note: "MVPA ≥60min",
      },
      social: {
        minRatio: 0.02, maxRatio: 0.03,
        minHours: 0.5, maxHours: 0.75,
        isHardBottom: false,
        note: "同伴互动（定性建议）",
      },
      explore: {
        minRatio: 0.02, maxRatio: 0.04,
        minHours: 0.5, maxHours: 1,
        isHardBottom: false,
        note: "兴趣发展（定性建议）",
      },
    },
  },
};

/**
 * 寒暑假期间目标模型
 * 数据来源: 调研报告第四节"五维比例速查表 — 寒暑假期间"
 */
const VACATION_MODELS: Record<SchoolStage, FiveDimTargetModel> = {
  primary: {
    stage: "primary",
    mode: "vacation",
    overheadRatio: 0.08,
    bufferRatio: 0.08,
    dimensions: {
      rest: {
        minRatio: 0.42, maxRatio: 0.42,
        minHours: 10, maxHours: 10,
        isHardBottom: true,
        note: "睡眠保持不变，起床可稍晚（偏移 ≤1.5h）",
      },
      learn: {
        minRatio: 0.05, maxRatio: 0.07,
        minHours: 1.5, maxHours: 2,
        isHardBottom: false,
        note: "假期作业+阅读，分散上下午，番茄工作法分段",
      },
      sport: {
        minRatio: 0.10, maxRatio: 0.12,
        minHours: 2, maxHours: 3,
        isHardBottom: true,
        note: "假期户外时间应增加，利用早晚凉爽时段；MVPA ≥60min",
      },
      social: {
        minRatio: 0.08, maxRatio: 0.12,
        minHours: 2, maxHours: 3,
        isHardBottom: false,
        note: "假期显著增加：同伴玩耍、亲子互动",
      },
      explore: {
        minRatio: 0.12, maxRatio: 0.17,
        minHours: 3, maxHours: 4,
        isHardBottom: false,
        note: "兴趣班、旅行、自然观察、项目制学习",
      },
    },
  },
  junior: {
    stage: "junior",
    mode: "vacation",
    overheadRatio: 0.08,
    bufferRatio: 0.06,
    dimensions: {
      rest: {
        minRatio: 0.38, maxRatio: 0.38,
        minHours: 9, maxHours: 9,
        isHardBottom: true,
        note: "睡眠保持不变，起床可稍晚（偏移 ≤1.5h）",
      },
      learn: {
        minRatio: 0.12, maxRatio: 0.17,
        minHours: 3, maxHours: 4,
        isHardBottom: false,
        note: "作业+预习+阅读，分散安排",
      },
      sport: {
        minRatio: 0.08, maxRatio: 0.10,
        minHours: 2, maxHours: 2.5,
        isHardBottom: true,
        note: "MVPA ≥60min，假期应增加户外",
      },
      social: {
        minRatio: 0.08, maxRatio: 0.12,
        minHours: 2, maxHours: 3,
        isHardBottom: false,
        note: "同伴交往、亲子互动",
      },
      explore: {
        minRatio: 0.12, maxRatio: 0.17,
        minHours: 3, maxHours: 4,
        isHardBottom: false,
        note: "兴趣发展、项目制学习",
      },
    },
  },
  senior: {
    stage: "senior",
    mode: "vacation",
    overheadRatio: 0.06,
    bufferRatio: 0.13,
    dimensions: {
      rest: {
        minRatio: 0.35, maxRatio: 0.35,
        minHours: 8.5, maxHours: 8.5,
        isHardBottom: true,
        note: "睡眠保持不变",
      },
      learn: {
        minRatio: 0.20, maxRatio: 0.25,
        minHours: 5, maxHours: 6,
        isHardBottom: false,
        note: "作业+复习+预习",
      },
      sport: {
        minRatio: 0.06, maxRatio: 0.08,
        minHours: 1.5, maxHours: 2,
        isHardBottom: true,
        note: "MVPA ≥60min",
      },
      social: {
        minRatio: 0.06, maxRatio: 0.10,
        minHours: 2, maxHours: 2.5,
        isHardBottom: false,
        note: "同伴交往",
      },
      explore: {
        minRatio: 0.08, maxRatio: 0.12,
        minHours: 2.5, maxHours: 3,
        isHardBottom: false,
        note: "兴趣发展",
      },
    },
  },
};

// ================================================================
// 3. 年级 → 学段 映射
// ================================================================

/**
 * Parse grade string to determine school stage.
 * e.g. "初一上" → "junior", "五年级下" → "primary"
 */
export function parseSchoolStage(grade: string): SchoolStage {
  if (grade.includes("初一") || grade.includes("初二") || grade.includes("初三")) {
    return "junior";
  }
  if (grade.includes("高一") || grade.includes("高二") || grade.includes("高三")) {
    return "senior";
  }
  // Default: primary (also covers 一年级~六年级)
  return "primary";
}

// ================================================================
// 4. 时段判定
// ================================================================

/** 中国寒暑假大致月份（可配置） */
const WINTER_VACATION_MONTHS = [1, 2];  // 寒假: 1-2月
const SUMMER_VACATION_MONTHS = [7, 8];  // 暑假: 7-8月

/**
 * Determine if a given week falls in school or vacation period.
 * Simplified: checks if the week is in winter(1-2月) or summer(7-8月) vacation.
 */
export function getPeriodMode(date: Date = new Date()): PeriodMode {
  const month = date.getMonth() + 1; // 0-indexed
  if (WINTER_VACATION_MONTHS.includes(month) || SUMMER_VACATION_MONTHS.includes(month)) {
    return "vacation";
  }
  return "school";
}

// ================================================================
// 5. 五维计算
// ================================================================

/** 单个维度的评估结果 */
export interface DimensionAssessment {
  category: DimCategory;
  label: string;
  emoji: string;
  actualRatio: number;    // 实际占比 0-1
  actualHours: number;    // 实际小时数
  targetMinRatio: number;
  targetMaxRatio: number;
  targetMinHours: number;
  targetMaxHours: number;
  status: "below" | "normal" | "above";
  severity: "good" | "warning" | "critical";
  isHardBottom: boolean;
  advice: string;
}

/** 完整的五维健康度报告 */
export interface FiveDimReport {
  stage: SchoolStage;
  mode: PeriodMode;
  model: FiveDimTargetModel;
  dimensions: DimensionAssessment[];
  totalTrackedHours: number;
  /** 总结性建议 */
  summary: string[];
  /** 优先关注维度 */
  priorities: string[];
}

/** 维度标签映射 */
const DIM_LABELS: Record<string, { label: string; emoji: string }> = {
  rest: { label: "休息", emoji: "😴" },
  learn: { label: "学习", emoji: "📚" },
  sport: { label: "运动", emoji: "🏃" },
  social: { label: "社交", emoji: "💬" },
  explore: { label: "探索", emoji: "🔍" },
};

/**
 * Calculate hours per dimension from schedule items.
 */
function aggregateHours(schedules: { category: DimCategory; startTime: string; endTime: string }[]): Record<string, number> {
  const hours: Record<string, number> = { learn: 0, rest: 0, sport: 0, social: 0, explore: 0 };

  for (const s of schedules) {
    const [sh, sm] = s.startTime.split(":").map(Number);
    const [eh, em] = s.endTime.split(":").map(Number);
    const duration = (eh + em / 60) - (sh + sm / 60);
    if (duration > 0) {
      hours[s.category] = (hours[s.category] || 0) + duration;
    }
  }

  return hours;
}

/**
 * Assess a single dimension against its target model.
 */
function assessDimension(
  cat: DimCategory,
  actualHours: number,
  totalTrackedHours: number,
  target: DimensionTarget,
): DimensionAssessment {
  const actualRatio = totalTrackedHours > 0 ? actualHours / totalTrackedHours : 0;
  const meta = DIM_LABELS[cat] ?? { label: cat, emoji: "📌" };

  // Determine status
  let status: "below" | "normal" | "above";
  let severity: "good" | "warning" | "critical";
  let advice = "";

  if (actualRatio < target.minRatio) {
    status = "below";
    const gap = Math.round((target.minRatio - actualRatio) * 100);
    const gapHours = (target.minHours - actualHours).toFixed(1);
    if (target.isHardBottom) {
      severity = "critical";
      advice = `严重不足！${target.note}。当前比推荐下限低 ${gap} 个百分点（约少 ${gapHours}h），需立即调整。`;
    } else {
      severity = "warning";
      advice = `偏低。建议增加到 ${target.minHours}-${target.maxHours}h/天（占比 ${Math.round(target.minRatio * 100)}-${Math.round(target.maxRatio * 100)}%）。当前比推荐下限低 ${gap} 个百分点。`;
    }
  } else if (actualRatio > target.maxRatio) {
    status = "above";
    const excess = Math.round((actualRatio - target.maxRatio) * 100);
    if (cat === "learn") {
      severity = "warning";
      advice = `学习时间偏高，超出推荐上限 ${excess} 个百分点。可以考虑把部分刷题换成 AI 游戏或户外运动。`;
    } else {
      severity = "warning";
      advice = `偏高。超出推荐区间上限 ${excess} 个百分点。请检查是否挤占了其他维度时间。`;
    }
  } else {
    status = "normal";
    severity = "good";
    advice = "在推荐区间内，保持当前节奏 👍";
  }

  return {
    category: cat,
    label: meta.label,
    emoji: meta.emoji,
    actualRatio,
    actualHours,
    targetMinRatio: target.minRatio,
    targetMaxRatio: target.maxRatio,
    targetMinHours: target.minHours,
    targetMaxHours: target.maxHours,
    status,
    severity,
    isHardBottom: target.isHardBottom,
    advice,
  };
}

/**
 * 主入口：计算五维健康度报告
 *
 * @param schedules - 该周所有日程记录
 * @param grade - 学生年级（如 "初二上"）
 * @param date - 参考日期（用于判定上学/假期），默认今天
 */
export function calculateFiveDimensions(
  schedules: { category: DimCategory; startTime: string; endTime: string }[],
  grade: string,
  date: Date = new Date(),
): FiveDimReport {
  const stage = parseSchoolStage(grade);
  const mode = getPeriodMode(date);
  const model = mode === "school" ? SCHOOL_TERM_MODELS[stage] : VACATION_MODELS[stage];

  // Aggregate
  const hours = aggregateHours(schedules);

  // Total tracked hours (24h minus overhead)
  const totalTrackedHours = 24 * (1 - model.overheadRatio);

  // Assess each dimension
  const dimensions: DimensionAssessment[] = [];
  const summary: string[] = [];
  const priorities: string[] = [];

  for (const cat of Object.keys(model.dimensions) as DimCategory[]) {
    const target = model.dimensions[cat];
    const actualHours = hours[cat] || 0;
    const assessment = assessDimension(cat, actualHours, totalTrackedHours, target);
    dimensions.push(assessment);

    if (assessment.severity === "critical") {
      priorities.push(`${assessment.emoji} ${assessment.label}: ${assessment.advice}`);
    }
  }

  // Sort: critical first, then warning, then good
  dimensions.sort((a, b) => {
    const order = { critical: 0, warning: 1, good: 2 };
    return order[a.severity] - order[b.severity];
  });

  // Generate summary
  const modeLabel = mode === "school" ? "上学期间" : "假期";
  summary.push(`📅 ${modeLabel} · ${stage === "primary" ? "小学" : stage === "junior" ? "初中" : "高中"}阶段`);

  // 睡眠检查（铁底）
  const rest = dimensions.find((d) => d.category === "rest");
  if (rest && rest.status === "below") {
    summary.push("⚠️ 睡眠不足！睡眠是不可挤占的铁底，请优先保障。");
  }

  // 运动检查（铁底）
  const sport = dimensions.find((d) => d.category === "sport");
  if (sport && sport.status === "below") {
    summary.push("⚠️ 运动量不足！每日 MVPA ≥60min 是健康底线。");
  }

  // 学习超标
  const learn = dimensions.find((d) => d.category === "learn");
  if (learn && learn.status === "above") {
    summary.push("💡 学习时间偏高，可以考虑把部分刷题替换为 AI 游戏或户外探索。");
  }

  // 社交/探索
  if (mode === "vacation") {
    const social = dimensions.find((d) => d.category === "social");
    if (social && social.status === "below") {
      summary.push("💡 假期是社交和探索的黄金时间，建议增加同伴互动和户外活动。");
    }
  }

  if (summary.length === 1) {
    summary.push("✅ 各项指标整体良好，继续保持！");
  }

  return {
    stage,
    mode,
    model,
    dimensions,
    totalTrackedHours,
    summary,
    priorities,
  };
}

// ================================================================
// 6. 生成自然语言提醒
// ================================================================

export function generateReminderMessage(report: FiveDimReport): string {
  const modeLabel = report.mode === "school" ? "上学期间" : "假期";

  let msg = `📊 本周五维健康度报告（${modeLabel}）\n\n`;

  for (const d of report.dimensions) {
    const pct = Math.round(d.actualRatio * 100);
    const icon = d.severity === "good" ? "✅" : d.severity === "critical" ? "❌" : "⚠️";
    msg += `${icon} ${d.emoji} ${d.label}: ${pct}%（推荐 ${Math.round(d.targetMinRatio * 100)}-${Math.round(d.targetMaxRatio * 100)}%）\n`;
  }

  msg += `\n📝 建议：\n`;
  for (const p of report.priorities.slice(0, 2)) {
    msg += `· ${p}\n`;
  }
  if (report.summary.length > 1) {
    msg += `· ${report.summary[1]}\n`;
  }

  return msg;
}
