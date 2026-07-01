"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [role, setRole] = useState<"student" | "parent">("student");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("密码至少 6 位");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password, nickname, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "注册失败");
        return;
      }

      if (data.user.role === "student") {
        router.push("/home");
      } else {
        router.push("/parent/report");
      }
      router.refresh();
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-2">创建账号</h1>
        <p className="text-sm text-muted text-center mb-8">加入 ApplePie，开启成长之旅</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Role selector */}
          <div>
            <label className="block text-sm font-medium mb-2">我是</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setRole("student")}
                className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                  role === "student"
                    ? "border-brand bg-brand/10 text-brand"
                    : "border-border text-muted"
                }`}
              >
                🎒 学生
              </button>
              <button
                type="button"
                onClick={() => setRole("parent")}
                className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                  role === "parent"
                    ? "border-brand bg-brand/10 text-brand"
                    : "border-border text-muted"
                }`}
              >
                👨‍👩‍👧 家长
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="nickname">
              昵称
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground text-base focus:outline-none focus:ring-2 focus:ring-brand"
              placeholder="你的昵称"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="phone">
              手机号
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground text-base focus:outline-none focus:ring-2 focus:ring-brand"
              placeholder="输入手机号"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="password">
              密码
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground text-base focus:outline-none focus:ring-2 focus:ring-brand"
              placeholder="至少 6 位密码"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-brand text-white font-semibold text-base disabled:opacity-50"
          >
            {loading ? "注册中..." : "注册"}
          </button>
        </form>

        <p className="text-sm text-muted text-center mt-6">
          已有账号？{" "}
          <button
            onClick={() => router.push("/auth/login")}
            className="text-brand font-medium"
          >
            登录
          </button>
        </p>
      </div>
    </div>
  );
}
