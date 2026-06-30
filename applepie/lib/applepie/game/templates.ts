import type { ApplePieGameConfig } from "./configBuilder";

/**
 * Knowledge-point episode metadata — one per scene (~5 minutes).
 */
export interface KpEpisode {
  knowledgePoint: string;
  subject: string;
  gapDescription?: string;
  errorPatterns?: string[];
}

/**
 * Build a worldSetting that describes a SEQUENCE of knowledge-point episodes.
 * The AI writer handles ONE episode per scene (~5 min each), with natural hooks
 * between them. After all episodes, the game ends with a summary.
 */
export function buildKpQueueWorldSetting(config: ApplePieGameConfig): string {
  const { student, subjects, episodes, weakPoints, interests, gameParams } = config;

  const subjectLines = subjects
    .map((s) => `${s.subject}：${s.currentChapter || "本学期内容"}（掌握度：${Math.round(s.masteryLevel * 100)}%）。`)
    .join("\n");

  const episodeLines = episodes
    .map((ep, i) => {
      const gap = ep.gapDescription ? ` | 薄弱点：${ep.gapDescription}` : "";
      const errors = ep.errorPatterns?.length ? ` | 易错：${ep.errorPatterns.join("、")}` : "";
      return `第${i + 1}集：${ep.knowledgePoint}（${ep.subject}）${gap}${errors}`;
    })
    .join("\n");

  const gapLines = (weakPoints?.knowledgeGaps ?? [])
    .map((g) => `· ${g.knowledgePointName}：${g.gapDescription}`)
    .join("\n");

  const interestStr = (interests?.detectedSignals ?? []).join("、") || "暂未检测";

  return `【学生信息】
${student.name}，${student.grade}学生，${student.age}岁，${student.textbookVersion}教材。

【学习近况】
${subjectLines}

薄弱环节：${gapLines || "无"}
兴趣倾向：${interestStr}

【知识点剧情序列】（共 ${episodes.length} 集，每集约5分钟）
${episodeLines}

【剧情创作规则 — 极其重要】
你是一个教育互动故事编剧。你必须严格按照以下规则创作：

1. 【一次一集】每次只生成一集剧情（约5分钟，不超过8个beat）。

2. 【按顺序推进】按上述剧集顺序，每次生成一集。场景自然衔接到下一集的知识点。

3. 【每集结构】
   - 开场钩子（30秒）：用自然场景引出本集知识点
   - 互动挑战（2-3分钟）：1-2个需要知识的场景，玩家通过选择/决策应用知识
   - 陷阱/拓展（1分钟）：如该知识点有常见错误，设计合理陷阱选项
   - 总结（30秒）：剧情总结本集收获，自然衔接到下一集

4. 【关键规则】
   - 知识融入剧情，不做题 —— 玩家在冒险/探索中自然用到知识
   - 对话像动画台词，不死板 —— NPC 有个性、有趣
   - 陷阱选项要合理 —— 不是"明显错"而是"常见误解"，选错后NPC自然纠正
   - 游戏时长约${gameParams.duration}分钟，难度${gameParams.difficulty}
   - 故事主题：${gameParams.themePreference || "校园冒险"}

5. 【结束规则】
   - 所有剧集完成后，最后一个场景给出学习总结（剧情方式，非成绩单）
   - 在非最后一集时，结尾给出"继续 / 结束"选择`;
}
