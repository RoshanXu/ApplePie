"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";

// ================================================================
// Grade options (小学 → 初中 → 高中)
// ================================================================
const GRADES = [
  { label: "小学", options: ["一年级上", "一年级下", "二年级上", "二年级下", "三年级上", "三年级下", "四年级上", "四年级下", "五年级上", "五年级下", "六年级上", "六年级下"] },
  { label: "初中", options: ["初一上", "初一下", "初二上", "初二下", "初三上", "初三下"] },
  { label: "高中", options: ["高一上", "高一下", "高二上", "高二下", "高三上", "高三下"] },
];

interface ProfileData {
  nickname: string;
  grade: string;
  textbookVersion: string;
}

// ================================================================
// Page
// ================================================================
export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editGrade, setEditGrade] = useState("");
  const [editTextbook, setEditTextbook] = useState<"人教版" | "北师大版" | "苏教版" | "沪教版" | "浙教版">("人教版");

  // Load profile
  useEffect(() => {
    fetch("/api/student/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.profile) {
          setProfile({
            nickname: data.profile.user?.nickname ?? "同学",
            grade: data.profile.grade ?? "初二上",
            textbookVersion: data.profile.textbookVersion ?? "人教版",
          });
        }
      })
      .catch(() => {
        setProfile({ nickname: "测试同学", grade: "初二上", textbookVersion: "人教版" });
      })
      .finally(() => setLoading(false));
  }, []);

  // Enter edit mode
  const startEdit = () => {
    if (!profile) return;
    setEditName(profile.nickname);
    setEditGrade(profile.grade);
    setEditTextbook((profile.textbookVersion as typeof editTextbook) ?? "人教版");
    setEditing(true);
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditing(false);
  };

  // Save profile
  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/student/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: editName.trim(),
          grade: editGrade,
          textbookVersion: editTextbook,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      const data = await res.json();
      if (data.profile) {
        setProfile({
          nickname: data.profile.user?.nickname ?? editName,
          grade: data.profile.grade ?? editGrade,
          textbookVersion: data.profile.textbookVersion ?? editTextbook,
        });
      }
      setEditing(false);
    } catch {
      // Keep edit mode on error
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="我的" />
        <div className="p-4 text-center text-sm text-muted animate-pulse">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="我的" />

      <div className="p-4 space-y-4">
        {/* Student info — editable */}
        <div className="bg-surface rounded-xl p-4 border border-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-brand/20 flex items-center justify-center text-xl shrink-0">
              🧑‍🎓
            </div>

            {editing ? (
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  maxLength={10}
                  placeholder="你的名字"
                  className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-brand"
                />
                <select
                  value={editGrade}
                  onChange={(e) => setEditGrade(e.target.value)}
                  className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-brand appearance-none"
                >
                  {GRADES.map((group) => (
                    <optgroup key={group.label} label={group.label}>
                      {group.options.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <select
                  value={editTextbook}
                  onChange={(e) => setEditTextbook(e.target.value as typeof editTextbook)}
                  className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-brand appearance-none"
                >
                  <option value="人教版">人教版</option>
                  <option value="北师大版">北师大版</option>
                  <option value="苏教版">苏教版</option>
                  <option value="沪教版">沪教版</option>
                  <option value="浙教版">浙教版</option>
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={saveProfile}
                    disabled={saving || !editName.trim()}
                    className="flex-1 py-1.5 bg-brand text-white rounded-lg text-xs font-medium disabled:opacity-40"
                  >
                    {saving ? "保存中..." : "保存"}
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="flex-1 py-1.5 bg-surface border border-border rounded-lg text-xs text-muted"
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1">
                <div className="text-sm font-semibold text-foreground">
                  {profile?.nickname ?? "同学"}
                </div>
                <div className="text-xs text-muted">
                  {profile?.grade ?? ""} · {profile?.textbookVersion ?? ""}
                </div>
              </div>
            )}

            {!editing && (
              <button
                onClick={startEdit}
                className="text-xs text-brand font-medium shrink-0"
              >
                编辑
              </button>
            )}
          </div>
        </div>

        {/* Ability summary */}
        <div className="bg-surface rounded-xl p-4 border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-3">知识点掌握</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted">数学 · 一次函数</span>
              <span className="text-dim-learn font-medium">60%</span>
            </div>
            <div className="h-1.5 bg-border rounded-full overflow-hidden">
              <div className="h-full bg-dim-learn rounded-full" style={{ width: "60%" }} />
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted">物理 · 透镜成像</span>
              <span className="text-dim-learn font-medium">70%</span>
            </div>
            <div className="h-1.5 bg-border rounded-full overflow-hidden">
              <div className="h-full bg-dim-learn rounded-full" style={{ width: "70%" }} />
            </div>
          </div>
        </div>

        {/* Interest signals */}
        <div className="bg-surface rounded-xl p-4 border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-3">兴趣倾向</h3>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-dim-explore/10 text-dim-explore rounded-full text-xs font-medium">
              逻辑推理
            </span>
            <span className="px-3 py-1 bg-dim-explore/10 text-dim-explore rounded-full text-xs font-medium">
              太空探索
            </span>
            <span className="px-3 py-1 bg-muted/10 text-muted rounded-full text-xs">
              动手制作
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
