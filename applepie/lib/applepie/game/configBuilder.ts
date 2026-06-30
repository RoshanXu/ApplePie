// ================================================================
// GameConfigBuilder — Assembles student data into a structured
// game configuration. Each game is a sequence of ~5-minute
// knowledge-point episodes.
// ================================================================

import type { KpEpisode } from "./templates";

export interface ApplePieGameConfig {
  student: {
    name: string;
    grade: string;
    age: number;
    textbookVersion: string;
  };
  subjects: SubjectState[];
  /** Knowledge point episodes — one per ~5-minute scene */
  episodes: KpEpisode[];
  weakPoints?: {
    knowledgeGaps: KnowledgeGapState[];
    errorPatterns: ErrorPatternState[];
  };
  interests?: {
    detectedSignals: string[];
    selfReported: string[];
  };
  gameParams: {
    difficulty: "easy" | "normal" | "hard";
    /** Per-episode target duration (minutes) */
    duration: 5;
    themePreference?: string;
  };
}

export interface SubjectState {
  subject: string;
  currentChapter: string;
  textbookUnit?: string;
  masteryLevel: number; // 0-1
}

export interface KnowledgeGapState {
  knowledgePointId: string;
  knowledgePointName: string;
  gapDescription: string;
  severity: number;
}

export interface ErrorPatternState {
  id: string;
  type: string;
  description: string;
  frequency: number;
}

/** Theme mapping */
const THEME_MAP: Record<string, string> = {
  space: "星际探险 — 在宇宙冒险中解开数理谜题",
  history: "古文明解密 — 穿越时空破解文史知识谜题",
  ecology: "生态守护 — 保护自然生态的科幻冒险",
  random: "校园日常+奇幻冒险",
};

/**
 * Build a game config for a student. Returns probe-mode for first-time
 * players, precision-mode with KP queue for returning players.
 */
export async function buildGameConfig(
  studentId: string,
  options?: {
    theme?: string;
    difficulty?: "easy" | "normal" | "hard";
  }
): Promise<ApplePieGameConfig> {
  // TODO: Fetch real student + knowledge point data from DB
  return buildMockConfig(options);
}

/** Build a mock config with a knowledge-point episode queue */
function buildMockConfig(options?: {
  theme?: string;
  difficulty?: "easy" | "normal" | "hard";
}): ApplePieGameConfig {
  const theme = options?.theme ?? "random";

  return {
    student: {
      name: "测试同学",
      grade: "初二上",
      age: 13,
      textbookVersion: "人教版",
    },
    subjects: [
      { subject: "数学", currentChapter: "第十四章 一次函数", masteryLevel: 0.6 },
      { subject: "物理", currentChapter: "第五章 透镜及其应用", masteryLevel: 0.7 },
    ],
    /** 3 knowledge-point episodes, ~5 min each */
    episodes: [
      {
        knowledgePoint: "一次函数的图像与性质",
        subject: "数学",
        gapDescription: "k和b的含义容易混淆，符号经常搞反",
        errorPatterns: ["符号错误", "k/b含义混淆"],
      },
      {
        knowledgePoint: "透镜成像规律",
        subject: "物理",
        gapDescription: "物距像距关系记混，实像虚像判断不准",
        errorPatterns: ["物距像距混淆", "实像虚像判断错误"],
      },
      {
        knowledgePoint: "一次函数的实际应用（行程问题）",
        subject: "数学",
        gapDescription: "不会从文字描述建立函数模型",
        errorPatterns: ["变量设置错误"],
      },
    ],
    weakPoints: {
      knowledgeGaps: [
        {
          knowledgePointId: "kp-1",
          knowledgePointName: "一次函数的图像与性质",
          gapDescription: "配方时符号经常搞反，k和b的含义容易混淆",
          severity: 0.7,
        },
      ],
      errorPatterns: [
        {
          id: "ep-1",
          type: "符号错误",
          description: "在移项和合并同类项时经常出现符号错误",
          frequency: 5,
        },
      ],
    },
    interests: {
      detectedSignals: ["逻辑推理", "太空探索"],
      selfReported: ["喜欢看科幻小说"],
    },
    gameParams: {
      difficulty: options?.difficulty ?? "normal",
      duration: 5,
      themePreference: THEME_MAP[theme] ?? THEME_MAP.random,
    },
  };
}
