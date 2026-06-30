"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";

interface TimeDist {
  pct: number;
  hours: number;
  status: string;
}

interface ReportData {
  weekStart: string;
  weekEnd: string;
  studentName: string;
  grade: string;
  timeDistribution: Record<string, TimeDist>;
  gameSummary: {
    totalGames: number;
    completedGames: number;
    totalScenes: number;
    highlights: string[];
  };
  abilityChanges: {
    improvedKnowledge: string[];
    newInterests: string[];
  };
  highlights: string[];
}

const DIM_META: Record<string, { label: string; emoji: string; color: string }> = {
  learn: { label: "学习", emoji: "📚", color: "bg-dim-learn" },
  rest: { label: "休息", emoji: "😴", color: "bg-dim-rest" },
  sport: { label: "运动", emoji: "🏃", color: "bg-dim-sport" },
  social: { label: "社交", emoji: "💬", color: "bg-dim-social" },
  explore: { label: "探索", emoji: "🔍", color: "bg-dim-explore" },
};

const DIM_ORDER = ["rest", "learn", "sport", "social", "explore"];

export default function ParentReport() {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch from API (uses mock data for now)
    fetch("/api/parent/report")
      .then((r) => r.json())
      .then((data) => setReport(data.report))
      .catch(() => {
        // Fallback to mock data directly
        setReport({
          weekStart: "2026-06-23",
          weekEnd: "2026-06-29",
          studentName: "测试同学",
          grade: "初二上",
          timeDistribution: {
            learn: { pct: 42, hours: 7.5, status: "✓ 正常" },
            rest: { pct: 38, hours: 9, status: "✓ 正常" },
            sport: { pct: 7, hours: 1, status: "⚠️ 可调整" },
            social: { pct: 2, hours: 0.5, status: "❌ 需关注" },
            explore: { pct: 8, hours: 1.5, status: "✓ 正常" },
          },
          gameSummary: {
            totalGames: 3,
            completedGames: 2,
            totalScenes: 8,
            highlights: [
              "在星际探险游戏中展现了出色的逻辑推理能力",
              "一次函数章节有明显进步",
            ],
          },
          abilityChanges: {
            improvedKnowledge: ["一次函数的图像与性质"],
            newInterests: ["太空探索", "逻辑推理"],
          },
          highlights: [
            "🎮 本周完成了 2 局 AI 游戏",
            "📚 数学一次函数章节有明显进步",
            "❌ 社交时间严重不足，建议增加同伴互动",
          ],
        });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted text-sm animate-pulse">加载中...</div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted text-sm">暂无数据</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="成长周报" />
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="bg-gradient-to-br from-brand to-brand-dark rounded-2xl p-5 text-white">
          <div className="text-xs text-white/70">
            {report.weekStart} ~ {report.weekEnd}
          </div>
          <h2 className="text-lg font-bold mt-1">
            {report.studentName} · {report.grade}
          </h2>
        </div>

        {/* Time distribution */}
        <div className="bg-surface rounded-xl p-4 border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-3">本周时间分布</h3>
          <div className="space-y-2">
            {DIM_ORDER.filter((k) => report.timeDistribution[k]).map((key) => {
              const d = report.timeDistribution[key];
              const meta = DIM_META[key];
              return (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-sm w-8">{meta.emoji}</span>
                  <span className="text-xs text-foreground w-8">{meta.label}</span>
                  <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                    <div
                      className={`h-full ${meta.color} rounded-full`}
                      style={{ width: `${d.pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-foreground font-medium w-8 text-right">
                    {d.pct}%
                  </span>
                  <span className="text-xs text-muted w-14 text-right">
                    {d.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Game highlights */}
        <div className="bg-surface rounded-xl p-4 border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            🎮 游戏表现
          </h3>
          <div className="flex gap-4 mb-3">
            <div className="bg-brand/5 rounded-lg px-3 py-2 text-center">
              <div className="text-lg font-bold text-brand">{report.gameSummary.completedGames}</div>
              <div className="text-[10px] text-muted">完成局数</div>
            </div>
            <div className="bg-dim-explore/10 rounded-lg px-3 py-2 text-center">
              <div className="text-lg font-bold text-dim-explore">{report.gameSummary.totalScenes}</div>
              <div className="text-[10px] text-muted">场景数</div>
            </div>
          </div>
          <div className="space-y-1">
            {report.gameSummary.highlights.map((h, i) => (
              <p key={i} className="text-xs text-muted">✨ {h}</p>
            ))}
          </div>
        </div>

        {/* Ability changes */}
        <div className="bg-surface rounded-xl p-4 border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-3">📈 能力变化</h3>
          <div className="space-y-2">
            {report.abilityChanges.improvedKnowledge.length > 0 && (
              <div>
                <div className="text-xs text-muted mb-1">进步知识点</div>
                <div className="flex flex-wrap gap-1">
                  {report.abilityChanges.improvedKnowledge.map((k) => (
                    <span key={k} className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs">
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {report.abilityChanges.newInterests.length > 0 && (
              <div>
                <div className="text-xs text-muted mb-1">新发现兴趣</div>
                <div className="flex flex-wrap gap-1">
                  {report.abilityChanges.newInterests.map((i) => (
                    <span key={i} className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs">
                      {i}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Highlights */}
        <div className="bg-surface rounded-xl p-4 border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-3">💡 本周要点</h3>
          <ul className="space-y-1.5">
            {report.highlights.map((h, i) => (
              <li key={i} className="text-sm text-muted">{h}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
