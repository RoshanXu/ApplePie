import { NextResponse } from "next/server";
import { getSession } from "./jwt";
import { prisma } from "@/lib/db/prisma";

/**
 * Require authenticated user. Returns user info on success,
 * or a 401 NextResponse if not authenticated.
 */
export async function requireUser(): Promise<
  { userId: string; role: string } | NextResponse
> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return { userId: session.sub, role: session.role };
}

/**
 * Require student role. Returns 403 if user is not a student.
 */
export async function requireStudent(): Promise<
  { userId: string } | NextResponse
> {
  const result = await requireUser();
  if (result instanceof NextResponse) return result;
  if (result.role !== "student") {
    return NextResponse.json(
      { error: "Forbidden: student only" },
      { status: 403 }
    );
  }
  return { userId: result.userId };
}

/**
 * Require parent role. Returns 403 if user is not a parent.
 */
export async function requireParent(): Promise<
  { userId: string } | NextResponse
> {
  const result = await requireUser();
  if (result instanceof NextResponse) return result;
  if (result.role !== "parent") {
    return NextResponse.json(
      { error: "Forbidden: parent only" },
      { status: 403 }
    );
  }
  return { userId: result.userId };
}
