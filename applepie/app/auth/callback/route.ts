import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Supabase Auth callback handler.
 * Handles OTP (magic link) and OAuth redirects after authentication.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // 'next' param for redirect after auth
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Validate redirect URL (only same-origin)
      const safeNext = next.startsWith("/") ? next : "/";
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  // Auth error — redirect to home with error flag
  return NextResponse.redirect(`${origin}/?auth_error=1`);
}
