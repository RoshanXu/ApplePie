import type { ApplePieGameConfig } from "./configBuilder";

/**
 * Build worldSetting text for "probe mode" — first-time player with no history data.
 * Covers a broad range of knowledge points since we don't yet know their weak areas.
 */
export function buildProbeModeWorldSetting(config: ApplePieGameConfig): string {
  const { student, subjects, gameParams } = config;

  const subjectLines = subjects
    .map((s) => `${s.subject}：正在学习${s.currentChapter || "本学期内容"}。`)
    .join("\n");

  const targetLines = gameParams.targetKnowledge
    .map((k) => `- ${k}`)
    .join("\n");

  return `【学生信息】
${student.name}，${student.grade}学生，${student.age}岁，使用${student.textbookVersion}教材。

【当前学习内容】
${subjectLines}

【本次游戏设置】
这是一次知识探测游戏。请围绕以下知识点设计故事中的挑战和谜题：
${targetLines}

难度级别：${gameParams.difficulty}
预计时长：约${gameParams.duration}分钟

【故事主题】
${gameParams.themePreference || "校园日常+奇幻冒险"}

【游戏设计要求】
1. 故事中的挑战/谜题/任务必须天然地用到上述知识点，不能让玩家觉得"在做题"
2. 知识点要融入剧情——比如解一个密码用到函数、和NPC对话时用到文言文理解
3. 如果玩家选择了某个解法路径，请记录这个选择反映出的思维方式倾向
4. 每个知识点至少出现一次，让玩家有机会展示掌握程度
5. NPC 性格鲜明，对话生动，让学生愿意互动
6. 每个场景末尾给出 2-3 个选择分支，引导剧情向不同方向展开
7. 最终场景给出本次游戏中玩家的表现总结（以剧情方式呈现，不是成绩单）`;
}

/**
 * Build worldSetting text for "precision mode" — returning player with history.
 * Focuses on weak areas and known interests.
 */
export function buildPrecisionModeWorldSetting(config: ApplePieGameConfig): string {
  const { student, subjects, weakPoints, interests, gameParams } = config;

  const subjectLines = subjects
    .map((s) => `${s.subject}：${s.currentChapter || "本学期内容"}（整体掌握度：${Math.round(s.masteryLevel * 100)}%）`)
    .join("\n");

  const gapLines = (weakPoints?.knowledgeGaps ?? [])
    .map((g) => `· ${g.knowledgePointName}：${g.gapDescription}（严重程度：${Math.round(g.severity * 100)}%）`)
    .join("\n");

  const errorLines = (weakPoints?.errorPatterns ?? [])
    .map((e) => `· ${e.type}：${e.description}（已出现 ${e.frequency} 次）`)
    .join("\n");

  const targetLines = gameParams.targetKnowledge
    .map((k) => `- ${k}`)
    .join("\n");

  return `【学生信息】
${student.name}，${student.grade}学生，${student.age}岁，使用${student.textbookVersion}教材。

【学习近况】
${subjectLines}

【需要重点巩固的薄弱环节】
${gapLines || "无明显薄弱环节"}

常见错误模式：
${errorLines || "无明显错误模式"}

【兴趣与偏好】
已检测到的兴趣倾向：${(interests?.detectedSignals ?? []).join("、") || "暂未检测"}
学生自述兴趣：${(interests?.selfReported ?? []).join("、") || "暂未提供"}

【本次游戏目标】
巩固知识点：
${targetLines}
难度：${gameParams.difficulty} | 时长：约${gameParams.duration}分钟
故事主题：${gameParams.themePreference || "校园日常+奇幻冒险"}

【游戏设计要求】
1. 挑战设计重点覆盖上述"薄弱环节"中的知识点，每个薄弱点至少设计 1 个相关场景
2. 对于"常见错误模式"中提到的错误类型，在故事中设计对应的"陷阱选项"
   ——选错的 NPC 反应要自然地指出问题（不能像老师训话）
3. 已掌握的知识点可以作为"热身"挑战出现在前期场景
4. 根据兴趣倾向信号，在剧情中融入相关元素提高吸引力
5. NPC 对话中自然嵌入对知识点的理解和运用
6. 每个场景末尾给出 2-3 个选择分支
7. 最终场景以故事方式总结本局收获，顺便暗示薄弱点的改进方向`;
}
