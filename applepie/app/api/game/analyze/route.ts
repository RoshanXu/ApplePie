import { NextResponse } from "next/server";
import { mockAnalyzeGameSession } from "@applepie/game/resultAnalyzer";

/**
 * POST /api/game/analyze
 * Analyzes a completed game session to extract learning signals.
 * MVP: returns mock analysis (real LLM analysis requires TEXT_API_KEY).
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    // If we have a real session, we'd call analyzeGameSession(session, targets)
    // For MVP, return mock analysis that demonstrates the data shape
    const result = mockAnalyzeGameSession();

    return NextResponse.json({ result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
