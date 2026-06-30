"use client";

import { useState } from "react";
import type { DimCategory, RepeatType } from "@prisma/client";

// ================================================================
// Constants
// ================================================================
const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"] as const;

const CATEGORIES: { value: DimCategory; label: string; emoji: string; hint: string; color: string }[] = [
  { value: "learn",   label: "学习", emoji: "📚", hint: "校内课程、作业、自习",     color: "border-l-dim-learn bg-dim-learn/5" },
  { value: "rest",    label: "休息", emoji: "😴", hint: "睡眠、午休、放松",         color: "border-l-dim-rest bg-dim-rest/5" },
  { value: "sport",   label: "运动", emoji: "🏃", hint: "体育课、跑步、球类",       color: "border-l-dim-sport bg-dim-sport/5" },
  { value: "social",  label: "社交", emoji: "💬", hint: "朋友聚会、家庭互动",       color: "border-l-dim-social bg-dim-social/5" },
  { value: "explore", label: "探索", emoji: "🔍", hint: "兴趣班、AI游戏、实践活动", color: "border-l-dim-explore bg-dim-explore/5" },
];

interface ScheduleFormData {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  title: string;
  category: DimCategory;
  location: string;
  repeatType: RepeatType;
}

interface ScheduleFormProps {
  /** Initial data for editing (omit for new item) */
  initial?: Partial<ScheduleFormData>;
  /** Called on save */
  onSave: (data: ScheduleFormData) => Promise<void>;
  /** Called on cancel */
  onCancel: () => void;
  /** Called on delete (only for edit mode) */
  onDelete?: () => Promise<void>;
  saving?: boolean;
}

// ================================================================
// Component
// ================================================================
export function ScheduleForm({ initial, onSave, onCancel, onDelete, saving }: ScheduleFormProps) {
  const isEdit = !!initial?.id;
  const now = new Date();

  const [dayOfWeek, setDayOfWeek] = useState(initial?.dayOfWeek ?? now.getDay());
  const [startTime, setStartTime] = useState(initial?.startTime ?? "08:00");
  const [endTime, setEndTime] = useState(initial?.endTime ?? "09:00");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [category, setCategory] = useState<DimCategory>(initial?.category ?? "learn");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [repeatType, setRepeatType] = useState<RepeatType>(initial?.repeatType ?? "weekly");
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = async () => {
    const errs: string[] = [];
    if (!title.trim()) errs.push("请输入日程名称");
    if (!startTime) errs.push("请选择开始时间");
    if (!endTime) errs.push("请选择结束时间");
    if (startTime >= endTime) errs.push("结束时间必须晚于开始时间");

    if (errs.length > 0) {
      setErrors(errs);
      return;
    }

    await onSave({
      id: initial?.id,
      dayOfWeek,
      startTime,
      endTime,
      title: title.trim(),
      category,
      location: location.trim(),
      repeatType,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-overlay" onClick={onCancel}>
      <div
        className="w-full max-w-[430px] bg-background rounded-t-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border px-4 py-3 flex items-center justify-between rounded-t-2xl">
          <button onClick={onCancel} className="text-sm text-muted">取消</button>
          <h2 className="text-sm font-semibold text-foreground">
            {isEdit ? "编辑日程" : "添加日程"}
          </h2>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="text-sm font-medium text-brand disabled:opacity-40"
          >
            {saving ? "保存中..." : "保存"}
          </button>
        </div>

        {/* Form */}
        <div className="p-4 space-y-4">
          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-lg p-3">
              {errors.map((e, i) => (
                <p key={i} className="text-xs text-red-600">{e}</p>
              ))}
            </div>
          )}

          {/* Day of week */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-2">星期</label>
            <div className="flex gap-1">
              {WEEKDAYS.map((day, i) => (
                <button
                  key={i}
                  onClick={() => setDayOfWeek(i)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                    dayOfWeek === i
                      ? "bg-brand text-white"
                      : "bg-surface border border-border text-muted hover:border-brand/50"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Time */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-foreground mb-1">开始时间</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-brand"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-foreground mb-1">结束时间</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-brand"
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">日程名称</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="如：数学课、篮球班、午休"
              maxLength={30}
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-brand"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-2">五维分类</label>
            <div className="space-y-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border-l-2 text-left transition-colors ${
                    category === cat.value
                      ? `${cat.color} border-l-brand font-medium`
                      : "bg-surface border border-border border-l-2 border-l-transparent hover:bg-muted/5"
                  }`}
                >
                  <span className="text-base">{cat.emoji}</span>
                  <div className="flex-1">
                    <div className="text-sm text-foreground">{cat.label}</div>
                    <div className="text-[10px] text-muted">{cat.hint}</div>
                  </div>
                  {category === cat.value && (
                    <span className="text-brand text-xs">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">地点（选填）</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="如：教学楼A301、少年宫"
              maxLength={50}
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-brand"
            />
          </div>

          {/* Repeat */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-2">重复</label>
            <div className="flex gap-2">
              <button
                onClick={() => setRepeatType("weekly")}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                  repeatType === "weekly"
                    ? "bg-brand text-white"
                    : "bg-surface border border-border text-muted"
                }`}
              >
                每周重复
              </button>
              <button
                onClick={() => setRepeatType("once")}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                  repeatType === "once"
                    ? "bg-brand text-white"
                    : "bg-surface border border-border text-muted"
                }`}
              >
                仅此一次
              </button>
            </div>
          </div>

          {/* Delete (edit mode) */}
          {isEdit && onDelete && (
            <button
              onClick={onDelete}
              className="w-full py-2.5 text-sm text-red-500 font-medium border border-red-200 rounded-lg hover:bg-red-50"
            >
              删除此日程
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
