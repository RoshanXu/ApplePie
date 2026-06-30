// ================================================================
// GameConfigBuilder — Assembles student data into a structured
// game configuration that drives worldSetting generation.
// ================================================================

export interface ApplePieGameConfig {
  student: {
    name: string;
    grade: string;
    age: number;
    textbookVersion: string;
  };
  subjects: SubjectState[];
  weakPoints?: {
    knowledgeGaps: KnowledgeGapState[];
    errorPatterns: ErrorPatternState[];
  };
  interests?: {
    detectedSignals: string[];
    selfReported: string[];
  };
  gameParams: {
    targetKnowledge: string[];
    difficulty: "easy" | "normal" | "hard";
    duration: 15 | 20 | 25;
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
  space: "星际探险 — 在浩瀚宇宙中解开物理与数学的谜题，拯救人类文明",
  history: "古文明解密 — 穿越时空，用语文与历史知识揭开失落文明的秘密",
  ecology: "生态守护 — 踏上保护自然生态的征程，用生物与地理知识守护地球",
  random: "校园日常+奇幻冒险",
};

/**
 * Build a game config for a student. Returns probe-mode config if the
 * student has never played; precision-mode config if they have history.
 */
export async function buildGameConfig(
  studentId: string,
  options?: {
    theme?: string;
    difficulty?: "easy" | "normal" | "hard";
    duration?: 15 | 20 | 25;
  }
): Promise<ApplePieGameConfig> {
  // TODO: Fetch from DB when connected
  // For now return a mock config for development
  return buildMockConfig(options);
}

/** Mock config for development without DB */
function buildMockConfig(options?: {
  theme?: string;
  difficulty?: "easy" | "normal" | "hard";
  duration?: 15 | 20 | 25;
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
      targetKnowledge: ["一次函数的图像与性质", "透镜成像规律"],
      difficulty: options?.difficulty ?? "normal",
      duration: options?.duration ?? 20,
      themePreference: THEME_MAP[theme] ?? THEME_MAP.random,
    },
  };
}
