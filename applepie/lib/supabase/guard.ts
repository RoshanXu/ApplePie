import { NextResponse } from "next/server";
import { createClient } from "./server";

/**
 * Require authenticated user. Returns user ID on success,
 * or a 401 NextResponse if not authenticated.
 */
export async function requireUser(): Promise<
  { userId: string; role: string } | NextResponse
> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get role from public.users
  const { data: userRecord } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  return {
    userId: user.id,
    role: userRecord?.role ?? "student",
  };
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
    return NextResponse.json({ error: "Forbidden: student only" }, { status: 403 });
  }
  return { userId: result.userId };
}
