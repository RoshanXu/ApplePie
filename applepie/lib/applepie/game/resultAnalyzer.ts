// ================================================================
// GameResultAnalyzer — Post-game LLM analysis of the full Session
// Extracts knowledge mastery signals, interest tendencies, and
// thinking style from the player's choices and beat interactions.
// ================================================================

import type { Session } from "@infiplot/types";
import { chat } from "@infiplot/ai-client";
import { loadEngineConfig } from "@/lib/config";

// ================================================================
// Output types
// ================================================================

export interface KnowledgePointPerformance {
  knowledgePointId: string;
  knowledgePointName: string;
  appearedInScenes: number;
  correctResponses: number;
  incorrectResponses: number;
  masterySignal: number; // -1 to 1
}

export interface InterestSignal {
  category: string;    // e.g. "动手制作", "逻辑推理", "艺术表达"
  strength: number;    // 0 to 1
  evidenceBeats: string[]; // Beat IDs that support this signal
}

export interface ThinkingStyle {
  prefersExploration: boolean;
  prefersLogic: boolean;
  prefersCollaboration: boolean;
  responseSpeed: number; // 0 to 1 (relative)
}

export interface GameResult {
  knowledgePointPerformance: KnowledgePointPerformance[];
  interestSignals: InterestSignal[];
  thinkingStyle: ThinkingStyle;
  totalScenes: number;
  totalChoices: number;
  duration: number; // minutes
}

// ================================================================
// Prompt
// ================================================================

function buildAnalysisPrompt(session: Session, targetKnowledge: string[]): string {
  const sceneCount = session.history.length;
  let totalChoices = 0;
  let sceneDump = "";

  for (const entry of session.history) {
    sceneDump += `\n【场景】${entry.scene.scenePrompt}\n`;
    for (const beat of entry.scene.beats) {
      const text = [beat.narration, beat.speaker ? `${beat.speaker}：${beat.line}` : beat.line]
        .filter(Boolean)
        .join(" ");
      const visited = entry.visitedBeatIds.includes(beat.id) ? "✓" : " ";
      sceneDump += `  [${visited}] ${text}\n`;

      if (beat.next.type === "choice") {
        for (const c of beat.next.choices) {
          totalChoices++;
          const chosen = entry.exit?.kind === "choice" && entry.exit.choiceId === c.id ? "→选" : "";
          sceneDump += `    [选项] ${c.label} ${chosen}\n`;
        }
      }
    }
  }

  return `你是一位教育评估专家。请分析以下学生在 AI 互动游戏中的表现，提取学习信号。

目标知识点：
${targetKnowledge.map((k) => `- ${k}`).join("\n")}

游戏过程：
${sceneDump}

请分析并以 JSON 格式返回：
1. knowledgePointPerformance: 每个目标知识点的表现（name、appearedInScenes、correctResponses、incorrectResponses、masterySignal[-1到1]）
2. interestSignals: 兴趣倾向信号（category 如"逻辑推理"、"动手制作"、"艺术表达"、"团队协作"，strength[0到1]，evidenceBeats 引用原文节拍 ID）
3. thinkingStyle: 思维风格（prefersExploration、prefersLogic、prefersCollaboration 布尔值，responseSpeed 0-1）

JSON 输出（不要其他文字）：`;
}

// ================================================================
// Main function
// ================================================================

export async function analyzeGameSession(
  session: Session,
  targetKnowledge: string[],
): Promise<GameResult> {
  const config = loadEngineConfig();
  const prompt = buildAnalysisPrompt(session, targetKnowledge);

  const messages = [
    {
      role: "system" as const,
      content:
        "你是一位教育评估专家。你的任务是根据学生在 AI 互动游戏中的表现，客观分析其知识点掌握程度、兴趣倾向和思维风格。你只输出 JSON，不输出任何其他文字。",
    },
    { role: "user" as const, content: prompt },
  ];

  const response = await chat(config.text, messages, {
    temperature: 0.3,
    tag: "game-analyzer",
  });

  // Parse JSON from response (chat returns string)
  const content = response.trim();
  // Handle possible JSON-in-markdown
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`Failed to parse analysis JSON. Raw: ${content.slice(0, 200)}`);
  }

  const parsed = JSON.parse(jsonMatch[0]);

  // Build default values for missing fields
  const thinkingStyle: ThinkingStyle = {
    prefersExploration: parsed.thinkingStyle?.prefersExploration ?? false,
    prefersLogic: parsed.thinkingStyle?.prefersLogic ?? false,
    prefersCollaboration: parsed.thinkingStyle?.prefersCollaboration ?? false,
    responseSpeed: parsed.thinkingStyle?.responseSpeed ?? 0.5,
  };

  const result: GameResult = {
    knowledgePointPerformance: (parsed.knowledgePointPerformance ?? []).map(
      (kp: Record<string, unknown>) => ({
        knowledgePointId: (kp.knowledgePointId as string) ?? "",
        knowledgePointName: (kp.knowledgePointName as string) ?? (kp.name as string) ?? "",
        appearedInScenes: (kp.appearedInScenes as number) ?? 0,
        correctResponses: (kp.correctResponses as number) ?? 0,
        incorrectResponses: (kp.incorrectResponses as number) ?? 0,
        masterySignal: (kp.masterySignal as number) ?? 0,
      })
    ),
    interestSignals: (parsed.interestSignals ?? []).map(
      (s: Record<string, unknown>) => ({
        category: (s.category as string) ?? "",
        strength: (s.strength as number) ?? 0,
        evidenceBeats: (s.evidenceBeats as string[]) ?? [],
      })
    ),
    thinkingStyle,
    totalScenes: session.history.length,
    totalChoices: session.history.reduce(
      (sum, entry) =>
        sum +
        entry.scene.beats.reduce(
          (bs, beat) => bs + (beat.next.type === "choice" ? beat.next.choices.length : 0),
          0
        ),
      0
    ),
    duration: 15, // TODO: calculate from timestamps
  };

  return result;
}

/**
 * For MVP without a running LLM: return a mock analysis.
 */
export function mockAnalyzeGameSession(): GameResult {
  return {
    knowledgePointPerformance: [
      {
        knowledgePointId: "kp-1",
        knowledgePointName: "一次函数的图像与性质",
        appearedInScenes: 2,
        correctResponses: 1,
        incorrectResponses: 1,
        masterySignal: 0.2,
      },
      {
        knowledgePointId: "kp-2",
        knowledgePointName: "透镜成像规律",
        appearedInScenes: 1,
        correctResponses: 1,
        incorrectResponses: 0,
        masterySignal: 0.8,
      },
    ],
    interestSignals: [
      {
        category: "逻辑推理",
        strength: 0.75,
        evidenceBeats: ["beat-1", "beat-3"],
      },
      {
        category: "太空探索",
        strength: 0.6,
        evidenceBeats: ["beat-2"],
      },
    ],
    thinkingStyle: {
      prefersExploration: true,
      prefersLogic: true,
      prefersCollaboration: false,
      responseSpeed: 0.5,
    },
    totalScenes: 3,
    totalChoices: 6,
    duration: 18,
  };
}
