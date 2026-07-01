"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function StudentHome() {
  const [nickname, setNickname] = useState("同学");
  const [grade, setGrade] = useState("");

  useEffect(() => {
    fetch("/api/student/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.profile) {
          setNickname(data.profile.user?.nickname ?? "同学");
          setGrade(data.profile.grade ?? "");
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="p-4 space-y-4">
      {/* Welcome */}
      <div className="bg-gradient-to-br from-brand to-brand-dark rounded-2xl p-5 text-white">
        <h1 className="text-lg font-bold">你好，{nickname}同学 👋</h1>
        <p className="text-sm text-white/80 mt-1">
          {grade ? `${grade} · ` : ""}今天想要探索什么？
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/schedule"
          className="bg-surface rounded-xl p-4 border border-border hover:border-brand/50 transition-colors"
        >
          <div className="text-2xl">📅</div>
          <div className="text-sm font-semibold text-foreground mt-2">时间管理</div>
          <div className="text-xs text-muted mt-1">查看今日课表</div>
        </Link>
        <Link
          href="/game"
          className="bg-surface rounded-xl p-4 border border-border hover:border-brand/50 transition-colors"
        >
          <div className="text-2xl">🎮</div>
          <div className="text-sm font-semibold text-foreground mt-2">AI 游戏</div>
          <div className="text-xs text-muted mt-1">边玩边学</div>
        </Link>
        <Link
          href="/schedule/health"
          className="bg-surface rounded-xl p-4 border border-border hover:border-brand/50 transition-colors"
        >
          <div className="text-2xl">📊</div>
          <div className="text-sm font-semibold text-foreground mt-2">五维健康</div>
          <div className="text-xs text-muted mt-1">看看时间分配</div>
        </Link>
        <Link
          href="/profile"
          className="bg-surface rounded-xl p-4 border border-border hover:border-brand/50 transition-colors"
        >
          <div className="text-2xl">👤</div>
          <div className="text-sm font-semibold text-foreground mt-2">能力画像</div>
          <div className="text-xs text-muted mt-1">我的成长轨迹</div>
        </Link>
      </div>
    </div>
  );
}
