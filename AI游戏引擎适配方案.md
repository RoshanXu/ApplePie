# ApplePie × InfiPlot：AI 游戏引擎适配方案

> 在 infiplot 引擎基础上，注入学生教育数据，生成个性化学习互动游戏。

---

## 一、InfiPlot 引擎核心原理（简化版）

### 1.1 一句话理解

```
用户输入（世界设定 + 画风） → 引擎 → 互动图文游戏
                                   ├── 每"幕"一张背景图
                                   ├── 多段对话/旁白（Beat）
                                   └── 分支选项（Choice）→ 下一幕
```

### 1.2 核心数据模型

```
Session（一次完整游戏会话）
├── worldSetting     ← 世界设定（自由文本，核心输入）
├── styleGuide       ← 画风描述
├── playerName       ← 玩家名字
├── storyState       ← 故事主线状态（持续更新）
├── characters[]     ← 已登场角色（含配音/形象）
└── history[]        ← 每幕场景的历史记录
    └── Scene
        ├── scenePrompt   ← 本幕画面描述
        ├── imageUrl      ← 生成的背景图
        ├── beats[]       ← 对话/旁白列表
        │   └── Beat { narration, speaker, line, next }
        └── entryBeatId   ← 入场节拍
```

### 1.3 生成流水线（directScene）

```
┌──────────────────────────────────────────────────────────┐
│ Writer 流式输出（单次 LLM 调用）                          │
│   <plan> → sceneSummary / cast / entry roster ✅          │
│   </plan> 闭合 → 触发下游并行                              │
│   <story> → 连贯散文正文（流式，逐步发客户端）              │
│   <choices> → 分支选项                                    │
├──────────────────────────────────────────────────────────┤
│ Plan 闭合后并行（与 story 流式产出重叠）：                 │
│   ├── CharacterDesigner × N  → 角色形象 + 配音             │
│   ├── Cinematographer       → 分镜构图                    │
│   └── Painter               → 生成背景图                   │
├──────────────────────────────────────────────────────────┤
│ 组装：Scene { imageUrl, beats[], choices, characters }     │
└──────────────────────────────────────────────────────────┘
```

### 1.4 关键：Prompt 上下文搭建

Writer 的 prompt 由 **ContextSegment 注册表** 决定，分稳定区和动态区：

| 区域 | 内容 | 作用 |
|------|------|------|
| **稳定区**（可缓存） | 世界观、画风、故事主轴、角色卡、历史场景 | 保证叙事一致性 |
| **动态区**（每次变化） | 当前故事状态、上一刻内容、转场提示 | 驱动本幕剧情走向 |

**ApplePie 的核心改动点就在这里：把稳定区的"世界观"替换为学生教育上下文。**

---

## 二、InfiPlot 原生输入 → ApplePie 输入映射

### 2.1 输入对照表

| InfiPlot 字段 | 含义 | ApplePie 映射 | 数据来源 |
|--------------|------|--------------|---------|
| `worldSetting` | 故事世界设定 | **学生学习上下文**（年级、科目、近期知识点、薄弱环节、学习目标） | 用户注册信息 + 时间管理数据 + 错题记录 |
| `styleGuide` | 画风 | **固定/半固定**："明亮温暖的日系漫画风，适合12-18岁青少年阅读" | 系统预设，可按学生偏好微调 |
| `playerName` | 玩家名 | 学生姓名/昵称 | 用户注册 |
| `storyState.logline` | 主线钩子 | 本次游戏的学习目标（如"掌握二次函数图像性质"） | 知识点分析 |
| `storyState.genreTags` | 题材标签 | 涉及的学科领域（如"数学·函数 / 物理·力学"） | 知识点关联 |
| `storyState.protagonist` | 主角设定 | 学生能力画像（"你是一名初二学生，数学基础扎实但函数部分薄弱…"） | 学习数据 |

### 2.2 核心改造：worldSetting 的内容结构

infiplot 的 `worldSetting` 是**自由文本**，这正好允许我们把结构化教育数据序列化为一段描述文本送入引擎。MVP 版本不需要改引擎代码，只需要**构建 worldSetting 文本**。

```
┌─────────────────────────────────────────────────────────┐
│              ApplePie 的 worldSetting 构成                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  【学习背景】（必填）                                     │
│  · 年级、年龄、使用教材版本                                │
│  · 本学期主要学科及当前进度                                │
│                                                         │
│  【近期学习重点】（必填）                                  │
│  · 最近 2 周学习的知识点清单                               │
│  · 每个知识点的掌握程度（已掌握 / 一般 / 薄弱）              │
│                                                         │
│  【常错/薄弱环节】（必填）                                 │
│  · 高频错题类型及错误模式                                  │
│  · 薄弱知识点的具体表现（如"二次函数配方总是符号搞错"）       │
│                                                         │
│  【兴趣与特长信号】（可选，有则填）                          │
│  · 之前在 AI 游戏中表现出的兴趣倾向                         │
│  · 学生自己表达过的兴趣/爱好                               │
│                                                         │
│  【本次游戏目标】（必填）                                  │
│  · 本次游戏要重点巩固的知识点                               │
│  · 期望的难度级别                                         │
│  · 游戏时长（15/20/25 分钟）                               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 三、游戏生成前需要的配置数据

### 3.1 数据模型定义

MVP 阶段，定义一个 `GameConfig` 结构体，作为游戏生成的输入：

```typescript
// ApplePie 游戏配置 —— 替代 infiplot 的 worldSetting + 附加参数
interface ApplePieGameConfig {
  // ===== 学生基础信息 =====
  student: {
    name: string;           // 昵称，游戏中 NPC 称呼
    grade: string;          // 年级，如"初二上"
    age: number;            // 年龄
    textbookVersion: string; // 教材版本，如"人教版"
  };

  // ===== 学习近况 =====
  recentLearning: {
    subjects: SubjectProgress[];  // 各科进度
    recentTopics: KnowledgePoint[]; // 近2周知识点
  };

  // ===== 薄弱环节 =====
  weakPoints: {
    knowledgeGaps: KnowledgeGap[];  // 薄弱知识点
    errorPatterns: ErrorPattern[];   // 常错模式
  };

  // ===== 兴趣与偏好 =====
  interests: {
    detectedSignals: string[];  // AI 检测到的兴趣倾向
    selfReported: string[];     // 学生自述兴趣
    preferredStyle: string;     // 偏好的游戏风格/主题
  };

  // ===== 本次游戏参数 =====
  gameParams: {
    targetKnowledge: string[];   // 本次巩固的知识点 ID
    difficulty: "easy" | "normal" | "hard";
    duration: 15 | 20 | 25;     // 预期时长（分钟）
    themePreference?: string;    // 学生选的主题（如"星际探险"）
  };
}
```

### 3.2 子类型定义

```typescript
interface SubjectProgress {
  subject: string;          // 学科名
  currentChapter: string;   // 当前章节
  textbookUnit: string;     // 教材单元
  masteryLevel: number;     // 整体掌握度 0-1
}

interface KnowledgePoint {
  id: string;
  name: string;             // 如"二次函数的图像"
  subject: string;          // 所属学科
  mastery: "mastered" | "familiar" | "weak" | "new";
  lastPracticed: Date;
}

interface KnowledgeGap {
  knowledgePointId: string;
  knowledgePointName: string;
  gapDescription: string;   // 如"配方时符号经常搞反"
  severity: number;         // 严重程度 0-1
  relatedErrorIds: string[];
}

interface ErrorPattern {
  id: string;
  type: string;             // 如"符号错误"、"概念混淆"、"计算粗心"
  description: string;      // 具体表现
  frequency: number;        // 出现频次
  knowledgePointIds: string[];
}
```

### 3.3 数据来源

MVP 阶段，这些数据的采集方式：

| 数据 | MVP 获取方式 | 后续版本 |
|------|-------------|---------|
| 年级、教材版本 | 注册时填写 | 不变 |
| 学科进度 | 手动选择/课表 OCR 导入 | 与学校系统对接 |
| 近期知识点 | 手动打标签/课表推断 | 自动从课表+作业提取 |
| 薄弱环节 | **AI 游戏第一局前：无数据 → 使用默认"新手探测"模式** | 从历史游戏数据自动分析 |
| 兴趣倾向 | 无数据 → 第一局使用通用主题 | 历史游戏选择偏好分析 |
| 游戏目标知识点 | 学生/家长手动选择，或系统根据薄弱点推荐 | 系统自动推荐 |

---

## 四、MVP 阶段的配置流程

### 4.1 最小可行配置（首次游戏，无历史数据）

学生首次使用时，没有错题数据、没有兴趣数据。此时使用 **"探测模式"**：

```
【探测模式 WorldSetting 生成规则】

1. 必填：年级 + 教材版本（注册时收集）
2. 必填：当前在学的学科 + 章节（首次使用时引导填写，3 步向导）
3. 目标知识点：从当前章节自动抽取（如"初二上数学·一次函数"）
4. 薄弱点：无 → 游戏中使用"广度覆盖"策略，覆盖章节内多个知识点
5. 兴趣：无 → 使用默认通用主题（"校园日常+奇幻冒险"）
6. 难度：默认 "normal"
7. 时长：默认 20 分钟
```

### 4.2 首次使用 3 步引导（代替 infiplot 的 CustomForm）

```
┌─────────────────────────────────────────────┐
│  Step 1: 我是谁                              │
│  · 选择年级：[初一 / 初二 / 初三 / 高一 …]     │
│  · 教材版本：[人教版 / 北师大版 / 苏教版 …]    │
│  · 昵称：___________                         │
├─────────────────────────────────────────────┤
│  Step 2: 我在学什么                           │
│  · 勾选学科：[语文][数学][英语][物理]…         │
│  · 当前章节（按学科分开）：                    │
│    数学：第___章 ______（如"第十四章 一次函数"） │
│    物理：第___章 ______                       │
├─────────────────────────────────────────────┤
│  Step 3: 选一个主题故事                       │
│  · 🌌 星际探险（数理向）                       │
│  · 🏛️ 古文明解密（文史向）                      │
│  · 🌿 生态守护（生物/地理向）                   │
│  · 🎲 随机推荐                                │
│                                             │
│  [开始游戏]                                   │
└─────────────────────────────────────────────┘
```

### 4.3 有历史数据时的配置（常规游戏）

学生有过至少一局游戏后，配置更精准：

```
常规游戏 WorldSetting = 
    学生基础信息（不变）
  + 最新学习近况（从时间管理数据自动提取）
  + 薄弱知识点（从历史游戏结果自动分析）
  + 常错模式（从错题记录自动归纳）
  + 本次目标（系统推荐，用户可调整）
  + 兴趣倾向（从游戏中选择偏好计算）
```

**进入游戏流程简化为：**
```
首页 → 点击"开始 AI 游戏" → 系统自动生成配置摘要 → 用户确认/调整 → 开始
```

---

## 五、WorldSetting 文本生成模板

### 5.1 探测模式模板（无历史数据）

```
【学生信息】
{{studentName}}，{{grade}}学生，{{age}}岁，使用{{textbookVersion}}教材。

【当前学习内容】
{{#each subjects}}
{{subject}}：正在学习{{currentChapter}}（{{textbookUnit}}）。
{{/each}}

【本次游戏设置】
这是一次知识探测游戏。请围绕以下知识点设计故事中的挑战和谜题：
{{#each gameParams.targetKnowledge}}
- {{this}}
{{/each}}

难度级别：{{gameParams.difficulty}}
预计时长：约{{gameParams.duration}}分钟

【故事主题】
{{gameParams.themePreference}}

【游戏设计要求】
1. 故事中的挑战/谜题/任务必须天然地用到上述知识点，不能让玩家觉得"在做题"
2. 知识点要融入剧情——比如解一个密码用到函数、和NPC对话时用到文言文理解
3. 如果玩家选择了某个解法路径，请记录这个选择反映出的思维方式倾向
4. 每个知识点至少出现一次，让玩家有机会展示掌握程度
5. NPC 性格鲜明，对话生动，让学生愿意互动
6. 每个场景末尾给出 2-3 个选择分支，引导剧情向不同方向展开
7. 最终场景给出本次游戏中玩家的表现总结（以剧情方式呈现，不是成绩单）
```

### 5.2 精准模式模板（有历史数据）

```
【学生信息】
{{studentName}}，{{grade}}学生，{{age}}岁，使用{{textbookVersion}}教材。

【学习近况】
{{#each recentLearning.subjects}}
{{subject}}：{{currentChapter}}（整体掌握度：{{masteryLevel}}）
{{/each}}

近期知识点掌握情况：
{{#each recentTopics}}
· {{name}} — {{mastery}}
{{/each}}

【需要重点巩固的薄弱环节】
{{#each weakPoints.knowledgeGaps}}
· {{knowledgePointName}}：{{gapDescription}}（严重程度：{{severity}}）
{{/each}}

常见错误模式：
{{#each weakPoints.errorPatterns}}
· {{type}}：{{description}}（已出现 {{frequency}} 次）
{{/each}}

【兴趣与偏好】
已检测到的兴趣倾向：{{interests.detectedSignals}}
学生自述兴趣：{{interests.selfReported}}

【本次游戏目标】
巩固知识点：{{gameParams.targetKnowledge}}
难度：{{gameParams.difficulty}} | 时长：约{{gameParams.duration}}分钟
故事主题：{{gameParams.themePreference}}

【游戏设计要求】
1. 挑战设计重点覆盖上述"薄弱环节"中的知识点，每个薄弱点至少设计 1 个相关场景
2. 对于"常见错误模式"中提到的错误类型，在故事中设计对应的"陷阱选项"
   ——选错的 NPC 反应要自然地指出问题（不能像老师训话）
3. 已掌握的知识点可以作为"热身"挑战出现在前期场景
4. 根据兴趣倾向信号，在剧情中融入相关元素提高吸引力
5. NPC 对话中自然嵌入对知识点的理解和运用
6. 每个场景末尾给出 2-3 个选择分支
7. 最终场景以故事方式总结本局收获，顺便暗示薄弱点的改进方向
```

---

## 六、与 InfiPlot 引擎的集成方式

### 6.1 MVP 集成策略：不改引擎，换输入

```
┌────────────────────────────────────────────────────┐
│ ApplePie 后端                                       │
│                                                    │
│  1. GameConfigBuilder                               │
│     收集学生数据 → 构建 worldSetting 文本              │
│                                                    │
│  2. POST /api/game/start                           │
│     ├── 构建 StartRequest                             │
│     │   worldSetting = 生成的教育文本                  │
│     │   styleGuide = "明亮温暖的日系漫画风"             │
│     │   playerName = 学生昵称                         │
│     │   language = "zh-CN"                           │
│     └── → 调用 infiplot startSession()               │
│                                                    │
│  3. POST /api/game/scene                            │
│     └── → 调用 infiplot requestScene()               │
│                                                    │
│  4. GameResultAnalyzer                              │
│     游戏结束后分析 Session 中的选择路径 → 提取          │
│     知识点掌握信号 + 兴趣倾向信号                       │
│                                                    │
└────────────────────────────────────────────────────┘
```

### 6.2 关键：不改代码，只改 Prompt 注入

infiplot 的 `ContextProvider` 是基于注册表模式（`ContextSegment[]`），可以通过**追加新的 Segment** 来注入教育上下文，**完全不需要修改引擎核心代码**：

```typescript
// ApplePie 新增的 ContextSegment —— 注入学习上下文
const applePieContext: ContextSegment = {
  id: "applepie-learning-context",
  zone: "stable",           // 放在稳定区，可缓存
  order: 50,                // 排在 worldAndStyle(100) 之前
  render: (session) => {
    // session.worldSetting 已经是我们的教育文本了
    // 这里可以追加额外的结构化的提示
    return [
      "【ApplePie 教育游戏指令】",
      "你是一位教育游戏编剧。你的任务是创作一个互动故事，",
      "故事中的挑战和谜题需要自然地融入知识点。",
      "以下是该学生的教育上下文：",
      "",
      session.worldSetting,
    ];
  },
};
```

**更好的方式**：直接把教育上下文写入 `worldSetting`，不改任何 Segment。这样开发量最小，MVP 阶段直接可用。

### 6.3 MVP 不改引擎架构的原因

| 组件 | 是否改动 | 说明 |
|------|---------|------|
| `director.ts` | ❌ 不改 | 核心流水线完全不变 |
| `orchestrator.ts` | ❌ 不改 | `startSession()` / `requestScene()` 直接调用 |
| `agents/writer.ts` | ❌ 不改 | 只靠 prompt 驱动 |
| `agents/characterDesigner.ts` | ❌ 不改 | 角色设计按原逻辑（教育场景下角色 = 同学/老师/向导） |
| `prompts/builder.ts` | ❌ 不改 | 不追加 Segment，靠 worldSetting 内容驱动 |
| `context/index.ts` | ❌ 不改 | 同上 |
| `types/index.ts` | ❌ 不改 | Session 结构不变 |
| **API 路由** | ✅ 新增 | `/api/game/start`、`/api/game/scene`，封装配置构建逻辑 |
| **GameConfigBuilder** | ✅ 新增 | 收集学生数据 → 构建 worldSetting 文本 |
| **GameResultAnalyzer** | ✅ 新增 | 游戏结束后分析 Beat 选择路径 |
| **前端页面** | ✅ 新增 | 3 步引导页 + 游戏页（复用 infiplot PlayCanvas） |

---

## 七、游戏结束后的数据回收

### 7.1 从游戏 Session 中提取学习信号

游戏结束后，Session 中包含了完整的选择路径。通过分析可以提取：

```typescript
interface GameResult {
  // 知识点维度
  knowledgePointPerformance: {
    knowledgePointId: string;
    knowledgePointName: string;
    appearedInScenes: number;     // 出现在几个场景
    correctResponses: number;     // 正确应对次数
    incorrectResponses: number;   // 错误应对次数
    masterySignal: number;        // 推算掌握度 -1~1
  }[];

  // 兴趣维度
  interestSignals: {
    category: string;             // 如"动手制作"、"逻辑推理"、"艺术表达"
    strength: number;             // 信号强度 0-1
    evidenceBeats: string[];      // 哪些选择体现了这个信号
  }[];

  // 思维倾向
  thinkingStyle: {
    prefersExploration: boolean;   // 倾向探索而非直奔目标
    prefersLogic: boolean;         // 倾向逻辑推理解法
    prefersCollaboration: boolean; // 倾向找 NPC 帮忙
    responseSpeed: number;         // 平均响应速度
  };

  // 总体
  totalScenes: number;
  totalChoices: number;
  duration: number;              // 实际游戏时长
}
```

### 7.2 信号提取方式

MVP 阶段，游戏结果分析使用**独立的 LLM 调用**：

```
输入：完整的 Session（所有 Scene + Beat + 选择路径）
Prompt："分析该学生在本次教育游戏中的表现：
        1. 哪些知识点掌握较好？哪些薄弱？
        2. 学生的选择路径体现了什么思维偏好？
        3. 有没有表现出对特定领域的兴趣？
        输出 JSON。"
输出：GameResult JSON → 存入学生能力画像
```

---

## 八、MVP 开发任务拆解

| 序号 | 任务 | 依赖 | 预估工时 |
|------|------|------|---------|
| 1 | **infiplot 引擎部署**：搭好 Next.js 项目，配好 AI 模型（text/vision/image），跑通原生 /api/start + /api/scene | - | 2 天 |
| 2 | **学生数据模型设计**：定义数据库表（学生基础信息、知识点库、游戏记录、能力画像） | - | 0.5 天 |
| 3 | **GameConfigBuilder**：实现"学生数据 → worldSetting 文本"的生成逻辑（模板引擎） | 2 | 1 天 |
| 4 | **3 步引导页面**：首次使用的年级/教材/学科/章节/主题选择 UI | 2 | 1.5 天 |
| 5 | **/api/game/start + /api/game/scene 路由**：封装配置构建 + 调用 infiplot engine | 1, 3 | 1 天 |
| 6 | **游戏页面**：复用 infiplot PlayCanvas，接入 ApplePie 路由 | 1, 5 | 1 天 |
| 7 | **GameResultAnalyzer**：游戏结束后 LLM 分析 Session → 提取学习信号 | 1 | 1 天 |
| 8 | **能力画像入库 + 成长周报**：将 GameResult 存入数据库，家长周报展示 | 7, 学生账号 | 1.5 天 |
| 9 | **联调测试**：端到端"引导→配置→游戏→分析→周报" | 全部 | 1 天 |

**MVP 总预估：约 10.5 天（≈ 2 周）**

---

## 九、关键设计决策总结

| 决策 | 结论 | 理由 |
|------|------|------|
| 改引擎还是改输入？ | **只改输入** | infiplot 架构解耦好，worldSetting 是自由文本，直接替换内容即可 |
| Prompt 放在哪？ | **放在 worldSetting 文本内** | 不改 ContextSegment，减少侵入 |
| 首次无数据怎么办？ | **探测模式** | 3 步引导收集最低限度的信息，游戏覆盖广度而非精度 |
| 游戏结果怎么提取？ | **独立 LLM 调用** | 不侵入引擎流水线，异步分析 Session |
| 画风怎么选？ | **固定青少年漫画风** | MVP 不需要画风选择，降低复杂度 |
| TTS 语音？ | **MVP 不做** | 文本展示即可，语音后续迭代 |

---

> **文档版本：** V1.0 | **创建日期：** 2026-06-29 | **依赖：** infiplot 引擎源码（已 clone 到本地）
