import { NextResponse } from "next/server";
import { buildGameConfig } from "@applepie/game/configBuilder";

/**
 * GET /api/game/config
 * Returns the suggested game configuration for a student.
 * Query params: theme, difficulty, duration
 */
export async function GET() {
  try {
    // TODO: Get studentId from auth session
    const config = await buildGameConfig("mock-student-id", {
      theme: "space",
      difficulty: "normal",
      duration: 20,
    });
    return NextResponse.json({ config });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
