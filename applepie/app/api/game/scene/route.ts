import { NextResponse } from "next/server";
import { requestScene } from "@infiplot/engine";
import { loadEngineConfig } from "@/lib/config";
import type { SceneRequest, SceneStreamEvent, SceneResponse } from "@infiplot/types";

function formatSSE(event: SceneStreamEvent | { type: string; [k: string]: unknown }): string {
  return `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
}

export const runtime = "nodejs";

/**
 * POST /api/game/scene
 * Advances the game to the next scene. Client carries the full Session.
 */
export async function POST(req: Request) {
  let body: SceneRequest;
  try {
    body = (await req.json()) as SceneRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.session) {
    return NextResponse.json({ error: "session is required" }, { status: 400 });
  }

  try {
    const engineConfig = loadEngineConfig();
    const acceptsSSE = req.headers.get("accept")?.includes("text/event-stream");

    if (!acceptsSSE) {
      const result = await requestScene(engineConfig, body);
      return NextResponse.json(result);
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const result = await requestScene(engineConfig, body, (event) => {
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
