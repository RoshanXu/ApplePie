"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface AuthGuardProps {
  children: React.ReactNode;
  /** Role required to access the page. If unset, any authenticated user can access. */
  requiredRole?: "student" | "parent";
  /** Fallback to show while checking auth or if not authenticated */
  fallback?: React.ReactNode;
}

/**
 * Client-side authentication wrapper.
 * Checks Supabase session and optionally enforces role-based access.
 * Renders children only when authenticated (and matching role, if specified).
 */
export function AuthGuard({ children, requiredRole, fallback }: AuthGuardProps) {
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthorized">("loading");
  const supabase = createClient();

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setStatus("unauthorized");
        return;
      }

      if (requiredRole) {
        const { data: userRecord } = await supabase
          .from("users")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (userRecord?.role !== requiredRole) {
          setStatus("unauthorized");
          return;
        }
      }

      setStatus("authenticated");
    }

    checkAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      checkAuth();
    });

    return () => subscription.unsubscribe();
  }, [supabase, requiredRole]);

  if (status === "loading") {
    return (
      fallback ?? (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="text-muted text-sm">加载中...</div>
        </div>
      )
    );
  }

  if (status === "unauthorized") {
    return (
      fallback ?? (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4 p-8">
          <div className="text-4xl">🔒</div>
          <h2 className="text-lg font-semibold text-foreground">需要登录</h2>
          <p className="text-sm text-muted text-center">
            请先登录后再访问此页面
          </p>
          <button
            onClick={() => {
              // Redirect to home for login
              window.location.href = "/";
            }}
            className="px-6 py-2 bg-brand text-white rounded-full text-sm font-medium"
          >
            返回首页
          </button>
        </div>
      )
    );
  }

  return <>{children}</>;
}
