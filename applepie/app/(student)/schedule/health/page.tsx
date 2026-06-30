"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import type { FiveDimReport, DimensionAssessment } from "@applepie/schedule/fiveDim";
import Link from "next/link";

// ================================================================
// Helpers
// ================================================================
const DIM_COLORS: Record<string, { bg: string; text: string }> = {
  learn:   { bg: "bg-dim-learn",   text: "text-dim-learn" },
  rest:    { bg: "bg-dim-rest",    text: "text-dim-rest" },
  sport:   { bg: "bg-dim-sport",   text: "text-dim-sport" },
  social:  { bg: "bg-dim-social",  text: "text-dim-social" },
  explore: { bg: "bg-dim-explore", text: "text-dim-explore" },
};

function getStatusClass(severity: string): string {
  if (severity === "critical") return "text-red-600";
  if (severity === "warning") return "text-yellow-600";
  return "text-green-600";
}

function getStatusLabel(status: string, severity: string): string {
  const icon = severity === "critical" ? "❌ " : severity === "warning" ? "⚠️ " : "";
  const label = status === "below" ? "偏低" : status === "above" ? "偏高" : "正常";
  return `${icon}${label}`;
}

// ================================================================
// Component
// ================================================================
export default function HealthPage() {
  const [report, setReport] = useState<FiveDimReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/schedule/health?grade=初二上")
      .then((r) => r.json())
      .then((data) => {
        if (data.report) {
          setReport(data.report);
        } else if (data.message) {
          setError(data.message);
        }
      })
      .catch(() => setError("加载失败，请确保已添加课表数据"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted text-sm animate-pulse">正在分析...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="五维健康度" backHref="/schedule" />
        <div className="p-4">
          <div className="bg-surface rounded-xl border border-border p-6 text-center">
            <div className="text-4xl mb-3">📊</div>
            <p className="text-sm text-muted mb-4">{error}</p>
            <Link
              href="/schedule"
              className="inline-block px-5 py-2.5 bg-brand text-white rounded-full text-sm font-medium"
            >
              去添加课表
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!report) return null;

  const modeLabel = report.mode === "school" ? "上学期间" : "假期";
  const stageLabel = report.stage === "primary" ? "小学" : report.stage === "junior" ? "初中" : "高中";

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="五维健康度" backHref="/schedule" />

      {/* Summary banner */}
      <div className="px-4 pt-4">
        <div className="bg-gradient-to-r from-brand to-brand-dark rounded-xl p-4 text-white">
          <div className="text-xs text-white/70">
            {modeLabel} · {stageLabel}阶段 · 共 {Math.round(report.totalTrackedHours)}h 追踪时间
          </div>
          <div className="text-sm font-medium mt-1">{report.summary[0]}</div>
        </div>
      </div>

      {/* Dimensions */}
      <div className="p-4 space-y-3">
        {report.dimensions.map((dim) => (
          <DimensionCard key={dim.category} dim={dim} />
        ))}
      </div>

      {/* Priorities */}
      {report.priorities.length > 0 && (
        <div className="px-4 pb-4">
          <div className="bg-red-50 border border-red-100 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-red-800 mb-2">⚠️ 优先关注</h3>
            <ul className="space-y-1">
              {report.priorities.map((p, i) => (
                <li key={i} className="text-xs text-red-700">{p}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Overall summary */}
      {report.summary.length > 1 && (
        <div className="px-4 pb-6">
          <div className="bg-surface rounded-xl p-4 border border-border">
            <h3 className="text-sm font-semibold text-foreground mb-2">📝 综合建议</h3>
            {report.summary.slice(1).map((s, i) => (
              <p key={i} className="text-xs text-muted leading-relaxed">{s}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ================================================================
// Dimension Card
// ================================================================
function DimensionCard({ dim }: { dim: DimensionAssessment }) {
  const colors = DIM_COLORS[dim.category] ?? { bg: "bg-gray-400", text: "text-gray-600" };
  const actualPct = Math.round(dim.actualRatio * 100);
  const minPct = Math.round(dim.targetMinRatio * 100);
  const maxPct = Math.round(dim.targetMaxRatio * 100);

  return (
    <div className="bg-surface rounded-xl p-4 border border-border">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-base">{dim.emoji}</span>
          <span className="text-sm font-semibold text-foreground">{dim.label}</span>
          {dim.isHardBottom && (
            <span className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-[10px] font-medium">
              铁底
            </span>
          )}
        </div>
        <span className={`text-xs font-medium ${getStatusClass(dim.severity)}`}>
          {getStatusLabel(dim.status, dim.severity)}
        </span>
      </div>

      {/* Bar */}
      <div className="relative h-3 bg-border rounded-full overflow-hidden mb-1">
        <div
          className={`absolute top-0 left-0 h-full ${colors.bg} rounded-full transition-all z-10`}
          style={{ width: `${Math.min(actualPct, 100)}%` }}
        />
        <div
          className="absolute top-0 h-full bg-foreground/10 border-l-2 border-r-2 border-foreground/20 z-0"
          style={{
            left: `${minPct}%`,
            width: `${maxPct - minPct}%`,
          }}
        />
      </div>

      {/* Labels */}
      <div className="flex justify-between text-[10px] text-muted">
        <span>{actualPct}%（{dim.actualHours.toFixed(1)}h）</span>
        <span>推荐 {minPct}-{maxPct}%（{dim.targetMinHours}-{dim.targetMaxHours}h）</span>
      </div>

      {/* Advice */}
      {dim.status !== "normal" && (
        <p className="mt-2 text-xs text-muted leading-relaxed bg-muted/5 rounded-lg p-2">
          {dim.advice}
        </p>
      )}
    </div>
  );
}
