"use client";

import { useEffect, useState, useCallback } from "react";

interface User {
  id: string;
  nickname: string;
  role: string;
}

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: "student" | "parent";
  fallback?: React.ReactNode;
}

/**
 * Client-side auth guard. Fetches current user from /api/auth/me
 * and optionally enforces role-based access.
 */
export function AuthGuard({ children, requiredRole, fallback }: AuthGuardProps) {
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthorized">("loading");
  const [user, setUser] = useState<User | null>(null);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        setStatus("unauthorized");
        return;
      }
      const data = await res.json();
      if (requiredRole && data.user.role !== requiredRole) {
        setStatus("unauthorized");
        return;
      }
      setUser(data.user);
      setStatus("authenticated");
    } catch {
      setStatus("unauthorized");
    }
  }, [requiredRole]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

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
          <p className="text-sm text-muted text-center">请先登录后再访问此页面</p>
          <button
            onClick={() => {
              window.location.href = "/auth/login";
            }}
            className="px-6 py-2 bg-brand text-white rounded-full text-sm font-medium"
          >
            前往登录
          </button>
        </div>
      )
    );
  }

  return <>{children}</>;
}

/** Hook to get current user and logout function */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) setUser(data.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.location.href = "/auth/login";
  };

  return { user, loading, logout };
}
