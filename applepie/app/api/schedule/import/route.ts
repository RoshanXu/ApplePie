import { NextResponse } from "next/server";
import { loadEngineConfig } from "@/lib/config";
import { mimoTranscribe } from "@/lib/ai-client/asr";
import { analyzeImageDataUrl } from "@/lib/ai-client/vision";
import { chat } from "@infiplot/ai-client";

// ================================================================
// POST /api/schedule/import
// AI 课表导入：图片/PDF OCR → 结构化  OR  语音 → ASR → 结构化
// ================================================================
// OCR 链路: 图片 → 豆包 Seed 2.0 Vision → DeepSeek 结构化 → 课表 JSON
// ASR 链路: 语音 → 小米 MiMo ASR → DeepSeek 结构化 → 日程 JSON
// ================================================================

interface ImportResult {
  items: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    title: string;
    category: string;
    location?: string;
  }[];
  raw?: string;
}

async function structureSchedule(raw: string): Promise<ImportResult> {
  const config = loadEngineConfig();

  const prompt = `你是一个课表解析助手。请将以下文本提取为结构化的日程列表。

文本内容：
${raw}

请返回一个 JSON 对象，格式如下：
{
  "items": [
    {
      "dayOfWeek": 1,
      "startTime": "08:00",
      "endTime": "09:00",
      "title": "数学课",
      "category": "learn",
      "location": "教室A301"
    }
  ]
}

规则：
- dayOfWeek: 0=周日, 1=周一, 2=周二, ..., 6=周六
- startTime/endTime: HH:mm 格式
- category: learn(学习)/rest(休息)/sport(运动)/social(社交)/explore(探索)
- location: 可选，没有则省略
- 只返回 JSON，不要有其他文字`;

  const response = await chat(config.text, [
    { role: "user", content: prompt },
  ]);

  // Parse JSON from response
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Failed to parse structured response");

  return JSON.parse(jsonMatch[0]) as ImportResult;
}

export async function POST(req: Request) {
  try {
    const config = loadEngineConfig();
    const body = await req.json();

    // ── Image/PDF OCR path ──
    if (body.image) {
      // body.image = base64 data URL or URL of the image
      const visionPrompt = `请仔细识别这张课程表图片中的所有内容。

如果是表格形式的课程表，请提取出：
- 每天（周一至周日）的课程安排
- 每节课的课程名称、时间（开始和结束时间）、地点（如有）
- 午休、自习等非课程安排

请以文本形式输出完整的时间表，格式如：
周一：
  08:00-08:45 语文 教室A301
  09:00-09:45 数学
  ...

只需要输出提取的文字内容，不要添加解释。`;

      const visionResponse = await analyzeImageDataUrl(
        config.vision,
        body.image,
        visionPrompt,
      );

      const result = await structureSchedule(visionResponse);
      return NextResponse.json({ result, source: "ocr" });
    }

    // ── Audio ASR path ──
    if (body.audio) {
      // body.audio = URL to audio file (https://...)  or base64 data URI
      if (!config.tts) {
        return NextResponse.json(
          { error: "TTS/ASR not configured. Please set TTS_BASE_URL, TTS_API_KEY, TTS_SPEECH_MODEL." },
          { status: 400 }
        );
      }

      const { text } = await mimoTranscribe(config.tts, body.audio);

      const result = await structureSchedule(text);
      return NextResponse.json({ result, source: "asr", transcribed: text });
    }

    return NextResponse.json(
      { error: "Please provide either 'image' (base64/URL) or 'audio' (URL) in request body." },
      { status: 400 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
