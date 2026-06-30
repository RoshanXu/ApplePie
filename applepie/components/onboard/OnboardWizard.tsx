"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const GRADE_GROUPS = [
  { label: "小学", options: ["一年级上", "一年级下", "二年级上", "二年级下", "三年级上", "三年级下", "四年级上", "四年级下", "五年级上", "五年级下", "六年级上", "六年级下"] },
  { label: "初中", options: ["初一上", "初一下", "初二上", "初二下", "初三上", "初三下"] },
  { label: "高中", options: ["高一上", "高一下", "高二上", "高二下", "高三上", "高三下"] },
];
const GRADES = GRADE_GROUPS.flatMap((g) => g.options);
const TEXTBOOKS = ["人教版", "北师大版", "苏教版", "沪教版", "浙教版"] as const;
const ALL_SUBJECTS = ["语文", "数学", "英语", "物理", "化学", "生物", "历史", "地理"] as const;
const THEMES = [
  { id: "space", label: "🌌 星际探险", desc: "数理向 · 宇宙科幻" },
  { id: "history", label: "🏛️ 古文明解密", desc: "文史向 · 历史探秘" },
  { id: "ecology", label: "🌿 生态守护", desc: "生物/地理向 · 自然冒险" },
  { id: "random", label: "🎲 随机惊喜", desc: "让 AI 为你挑选" },
] as const;

type Step = 1 | 2 | 3;

export function OnboardWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [grade, setGrade] = useState<string>("");
  const [textbook, setTextbook] = useState<string>("人教版");
  const [nickname, setNickname] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [subjectChapters, setSubjectChapters] = useState<Record<string, string>>({});
  const [theme, setTheme] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const canNext = () => {
    switch (step) {
      case 1: return grade && nickname.trim();
      case 2: return selectedSubjects.length > 0;
      case 3: return theme !== "";
    }
  };

  const handleNext = () => {
    if (step < 3) setStep((s) => (s + 1) as Step);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      // Build onboarding data
      const data = {
        grade,
        textbookVersion: textbook,
        nickname: nickname.trim(),
        subjects: selectedSubjects.map((s) => ({
          subject: s,
          currentChapter: subjectChapters[s] || "",
        })),
        themePreference: theme,
      };

      // TODO: Save to API when auth is ready
      console.log("Onboarding data:", data);

      // Navigate to home
      router.push("/home");
    } finally {
      setSaving(false);
    }
  };

  const toggleSubject = (s: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Progress bar */}
      <div className="px-6 pt-8 pb-4">
        <div className="flex gap-1 mb-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-brand" : "bg-border"
              }`}
            />
          ))}
        </div>
        <p className="text-muted text-xs">
          {step}/3 步
        </p>
      </div>

      {/* Step content */}
      <div className="flex-1 px-6 overflow-y-auto">
        {/* Step 1: Grade + Nickname */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">我是谁？</h2>
              <p className="text-sm text-muted">先介绍一下你自己吧</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">选择年级</label>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {GRADE_GROUPS.map((group) => (
                  <div key={group.label}>
                    <div className="text-xs text-muted mb-1.5">{group.label}</div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {group.options.map((g) => (
                        <button
                          key={g}
                          onClick={() => setGrade(g)}
                          className={`py-2 rounded-lg text-xs font-medium border transition-colors ${
                            grade === g
                              ? "bg-brand text-white border-brand"
                              : "bg-surface border-border text-foreground hover:border-brand"
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">教材版本</label>
              <div className="flex flex-wrap gap-2">
                {TEXTBOOKS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTextbook(t)}
                    className={`py-1.5 px-3 rounded-full text-xs font-medium border transition-colors ${
                      textbook === t
                        ? "bg-brand/10 text-brand border-brand"
                        : "bg-surface border-border text-muted hover:border-brand"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">昵称</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="给自己起个名字吧"
                maxLength={12}
                className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-foreground placeholder:text-muted/60 focus:outline-none focus:border-brand text-sm"
              />
            </div>
          </div>
        )}

        {/* Step 2: Subjects */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">我在学什么？</h2>
              <p className="text-sm text-muted">选一下你的学科和进度</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">学科（多选）</label>
              <div className="grid grid-cols-4 gap-2">
                {ALL_SUBJECTS.map((s) => (
                  <button
                    key={s}
                    onClick={() => toggleSubject(s)}
                    className={`py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                      selectedSubjects.includes(s)
                        ? "bg-brand text-white border-brand"
                        : "bg-surface border-border text-foreground hover:border-brand"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {selectedSubjects.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  当前章节（选填）
                </label>
                <div className="space-y-2">
                  {selectedSubjects.map((s) => (
                    <div key={s} className="flex items-center gap-2">
                      <span className="text-xs font-medium text-foreground w-10">{s}</span>
                      <input
                        type="text"
                        value={subjectChapters[s] || ""}
                        onChange={(e) =>
                          setSubjectChapters((prev) => ({ ...prev, [s]: e.target.value }))
                        }
                        placeholder={`如"第十四章 一次函数"`}
                        className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:border-brand"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Theme */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">选一个主题故事</h2>
              <p className="text-sm text-muted">
                AI 将基于你的学习内容，在这个主题下生成专属游戏
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    theme === t.id
                      ? "border-brand bg-brand/5 shadow-sm"
                      : "border-border bg-surface hover:border-brand/50"
                  }`}
                >
                  <div className="text-base font-semibold text-foreground">{t.label}</div>
                  <div className="text-xs text-muted mt-1">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom action */}
      <div className="px-6 py-4 bg-surface border-t border-border">
        <div className="flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep((s) => (s - 1) as Step)}
              className="px-6 py-3 rounded-xl border border-border text-sm font-medium text-muted hover:text-foreground"
            >
              上一步
            </button>
          )}
          {step < 3 ? (
            <button
              onClick={handleNext}
              disabled={!canNext()}
              className="flex-1 py-3 rounded-xl bg-brand text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              下一步
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canNext() || saving}
              className="flex-1 py-3 rounded-xl bg-brand text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              {saving ? "正在保存..." : "🎮 开始游戏"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
