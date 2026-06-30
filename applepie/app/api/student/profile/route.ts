import { NextResponse } from "next/server";
import { getStudentProfile, updateStudentProfile } from "@/lib/db/student";

const MOCK_USER_ID = "00000000-0000-0000-0000-000000000001";

/**
 * GET /api/student/profile
 * Returns the student profile with user info.
 */
export async function GET() {
  try {
    const profile = await getStudentProfile(MOCK_USER_ID);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
    return NextResponse.json({ profile });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PUT /api/student/profile
 * Updates nickname, grade, and/or textbook version.
 */
export async function PUT(req: Request) {
  try {
    const body = await req.json();

    const profile = await updateStudentProfile(MOCK_USER_ID, {
      nickname: body.nickname?.trim(),
      grade: body.grade?.trim(),
      textbookVersion: body.textbookVersion?.trim(),
    });

    return NextResponse.json({ profile });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
