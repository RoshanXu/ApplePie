import { NextResponse } from "next/server";
import { startSession } from "@infiplot/engine";
import { loadEngineConfig } from "@/lib/config";
import { buildGameConfig, type ApplePieGameConfig } from "@applepie/game/configBuilder";
import { buildProbeModeWorldSetting, buildPrecisionModeWorldSetting } from "@applepie/game/templates";
import type { SceneStreamEvent, StartRequest, StartResponse } from "@infiplot/types";

function formatSSE(event: SceneStreamEvent | { type: string; [k: string]: unknown }): string {
  return `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
}

export const runtime = "nodejs";

interface GameStartBody {
  theme?: string;
  difficulty?: "easy" | "normal" | "hard";
  duration?: 15 | 20 | 25;
}

/**
 * POST /api/game/start
 * Builds worldSetting from student data, calls infiplot engine, streams SSE.
 */
export async function POST(req: Request) {
  let body: GameStartBody;
  try {
    body = (await req.json()) as GameStartBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    // 1. Build game config from student data
    const config = await buildGameConfig("00000000-0000-0000-0000-000000000001", {
      theme: body.theme ?? "space",
      difficulty: body.difficulty ?? "normal",
      duration: body.duration ?? 20,
    });

    // 2. Determine mode and build worldSetting
    const hasHistory = false; // TODO: check game_sessions count
    const worldSetting = hasHistory
      ? buildPrecisionModeWorldSetting(config)
      : buildProbeModeWorldSetting(config);

    // 3. Build engine request
    const startRequest: StartRequest = {
      worldSetting,
      styleGuide: "明亮温暖的日系漫画风，适合12-18岁青少年阅读",
      playerName: config.student.name,
      language: "zh-CN",
      orientation: "portrait",
    };

    // 4. Load engine config and start session
    const engineConfig = loadEngineConfig();

    const acceptsSSE = req.headers.get("accept")?.includes("text/event-stream");

    if (!acceptsSSE) {
      // JSON mode — wait for full result
      const result = await startSession(engineConfig, startRequest);
      return NextResponse.json(result);
    }

    // SSE mode — stream events to client
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const result = await startSession(engineConfig, startRequest, (event) => {
            controller.enqueue(encoder.encode(formatSSE(event)));
          });
          controller.enqueue(
            encoder.encode(formatSSE({ type: "done", response: result }))
          );
          controller.close();
        } catch (err) {
          const message = err instanceof Error ? err.message : "Unknown error";
          controller.enqueue(encoder.encode(formatSSE({ type: "error", message })));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
