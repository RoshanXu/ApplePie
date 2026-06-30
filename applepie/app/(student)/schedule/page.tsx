"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { ScheduleForm } from "@/components/schedule/ScheduleForm";
import type { DimCategory, RepeatType } from "@prisma/client";

// ================================================================
// Date helpers (plain JS Date, no external libs)
// ================================================================

/** Return Monday 00:00 of the week containing `d` (Mon-based week). */
function getMonday(d: Date): Date {
  const dow = d.getDay(); // 0=Sun..6=Sat
  const offset = dow === 0 ? 6 : dow - 1;
  const m = new Date(d);
  m.setDate(m.getDate() - offset);
  m.setHours(0, 0, 0, 0);
  return m;
}

/** Return 7 dates [Mon..Sun] starting from a Monday. */
function getWeekDates(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d;
  });
}

/** Format as "M/D" e.g. "6/30". */
function formatMD(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/** Check if two Dates fall on the same calendar day. */
function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Is `d` today? */
function isToday(d: Date): boolean {
  return isSameDay(d, new Date());
}

/** Build a 6×7 month grid (Mon..Sun) with padding days from adjacent months. */
function getMonthGrid(year: number, month: number): Date[][] {
  const firstDay = new Date(year, month, 1);
  let startDow = firstDay.getDay();
  if (startDow === 0) startDow = 7; // treat Sun as 7 for Mon-based calc
  const padBefore = startDow - 1;

  const grid: Date[][] = [];
  let week: Date[] = [];

  // Prev-month padding
  const prevLast = new Date(year, month, 0).getDate();
  for (let i = padBefore - 1; i >= 0; i--) {
    week.push(new Date(year, month - 1, prevLast - i));
  }

  // Current month days
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(new Date(year, month, d));
    if (week.length === 7) {
      grid.push(week);
      week = [];
    }
  }

  // Next-month padding
  let nextD = 1;
  while (week.length > 0 && week.length < 7) {
    week.push(new Date(year, month + 1, nextD++));
  }
  if (week.length > 0) grid.push(week);

  // Ensure exactly 6 rows
  while (grid.length < 6) {
    const w: Date[] = [];
    for (let i = 0; i < 7; i++) w.push(new Date(year, month + 1, nextD++));
    grid.push(w);
  }

  return grid;
}

// ================================================================
// Types & constants
// ================================================================

interface ScheduleItem {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  title: string;
  category: DimCategory;
  subCategory: string | null;
  subject: string | null;
  completed: boolean;
  location: string | null;
  repeatType: RepeatType;
}

const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"] as const;
const MON_HEADERS = ["一", "二", "三", "四", "五", "六", "日"] as const;

const CAT_META: Record<string, { color: string; dot: string }> = {
  learn:   { color: "border-l-dim-learn",   dot: "bg-dim-learn" },
  rest:    { color: "border-l-dim-rest",    dot: "bg-dim-rest" },
  sport:   { color: "border-l-dim-sport",   dot: "bg-dim-sport" },
  social:  { color: "border-l-dim-social",  dot: "bg-dim-social" },
  explore: { color: "border-l-dim-explore", dot: "bg-dim-explore" },
};

// ================================================================
// Mock seed data for first-time use
// ================================================================

// ================================================================
// Page
// ================================================================

export default function SchedulePage() {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<ScheduleItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Calendar state
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [currentMonth, setCurrentMonth] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [prefillDayOfWeek, setPrefillDayOfWeek] = useState<number | undefined>(undefined);
  const [dayListDate, setDayListDate] = useState<Date | null>(null);

  // Derived date values
  const today = useMemo(() => new Date(), []);
  const monday = useMemo(() => getMonday(today), [today]);
  const weekDates = useMemo(() => getWeekDates(monday), [monday]);
  const monthGrid = useMemo(
    () => getMonthGrid(currentMonth.getFullYear(), currentMonth.getMonth()),
    [currentMonth]
  );

  // Month navigation
  const goPrevMonth = () =>
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const goNextMonth = () =>
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  // Load items from API
  const loadItems = useCallback(async () => {
    try {
      const res = await fetch("/api/schedule/items");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setItems(data.items ?? []);
    } catch {
      // API unavailable — empty state
      setItems([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadItems(); }, [loadItems]);

  // Save (create or update)
  const handleSave = async (data: {
    id?: string; dayOfWeek: number; startTime: string; endTime: string;
    title: string; category: DimCategory; subCategory?: string; subject?: string;
    location: string; repeatType: RepeatType;
  }) => {
    setSaving(true);
    try {
      if (data.id) {
        // Update
        const res = await fetch("/api/schedule/items", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to update");
        const json = await res.json();
        setItems((prev) => prev.map((i) => (i.id === data.id ? json.item : i)));
      } else {
        // Create
        const res = await fetch("/api/schedule/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to create");
        const json = await res.json();
        setItems((prev) => [...prev, json.item]);
      }
      setShowForm(false);
      setEditItem(null);
      setPrefillDayOfWeek(undefined);
    } finally {
      setSaving(false);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!editItem) return;
    setSaving(true);
    try {
      await fetch(`/api/schedule/items/${editItem.id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((i) => i.id !== editItem.id));
      setShowForm(false);
      setEditItem(null);
      setPrefillDayOfWeek(undefined);
    } finally {
      setSaving(false);
    }
  };

  // Toggle completed
  const toggleCompleted = async (item: ScheduleItem) => {
    try {
      const res = await fetch("/api/schedule/items", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, completed: !item.completed }),
      });
      if (!res.ok) throw new Error("Failed to toggle");
      const json = await res.json();
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? json.item : i))
      );
    } catch {
      // silently ignore
    }
  };

  // Close form
  const handleCancel = () => {
    setShowForm(false);
    setEditItem(null);
    setPrefillDayOfWeek(undefined);
  };

  // Group items by day
  const grouped = new Map<number, ScheduleItem[]>();
  for (const item of items) {
    const day = grouped.get(item.dayOfWeek) ?? [];
    day.push(item);
    grouped.set(item.dayOfWeek, day);
  }

  // Count items per category for the summary bar
  const catCount = items.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Form initial data
  const formInitial = editItem
    ? {
        id: editItem.id,
        dayOfWeek: editItem.dayOfWeek,
        startTime: editItem.startTime,
        endTime: editItem.endTime,
        title: editItem.title,
        category: editItem.category,
        subCategory: editItem.subCategory ?? "",
        subject: editItem.subject ?? "",
        location: editItem.location ?? "",
        repeatType: editItem.repeatType,
      }
    : prefillDayOfWeek !== undefined
      ? { dayOfWeek: prefillDayOfWeek }
      : undefined;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="时间管理"
        rightAction={
          <Link href="/schedule/health" className="text-xs text-brand font-medium">
            健康度 →
          </Link>
        }
      />

      {/* Empty state for new users */}
      {!loading && items.length === 0 && (
        <div className="px-4 py-12 text-center">
          <div className="text-5xl mb-4">📅</div>
          <p className="text-sm text-foreground font-medium mb-1">还没有日程</p>
          <p className="text-xs text-muted mb-4">点击下方 + 按钮添加你的第一个日程</p>
        </div>
      )}

      {/* Category summary bar */}
      {items.length > 0 && (
        <div className="px-4 pt-3">
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {Object.entries(catCount).map(([cat, count]) => {
              const meta = CAT_META[cat];
              return (
                <div
                  key={cat}
                  className="flex items-center gap-1 px-2 py-0.5 bg-surface border border-border rounded-full text-[10px] text-muted shrink-0"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${meta?.dot}`} />
                  {count}项
                </div>
              );
            })}
            <div className="flex items-center gap-1 px-2 py-0.5 bg-surface border border-border rounded-full text-[10px] text-muted shrink-0">
              共 {items.length} 项
            </div>
          </div>
        </div>
      )}

      {/* View toggle */}
      <div className="px-4 pt-3">
        <div className="flex bg-surface border border-border rounded-lg p-0.5">
          <button
            onClick={() => setViewMode("week")}
            className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${
              viewMode === "week" ? "bg-brand text-white" : "text-muted"
            }`}
          >
            周
          </button>
          <button
            onClick={() => setViewMode("month")}
            className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${
              viewMode === "month" ? "bg-brand text-white" : "text-muted"
            }`}
          >
            月
          </button>
        </div>
      </div>

      {/* ================================================================ */}
      {/* Week View */}
      {/* ================================================================ */}
      {viewMode === "week" && (
        <div className="px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            {loading ? "加载中..." : "本周课表"}
          </h3>
          <div className="space-y-2">
            {weekDates.map((date) => {
              const dow = date.getDay();
              const dayItems = grouped.get(dow) ?? [];
              const dayName = WEEKDAYS[dow];
              const dateStr = formatMD(date);
              const todayFlag = isToday(date);

              return (
                <div key={date.toISOString()} className="flex gap-2">
                  {/* Day label */}
                  <div
                    className={`w-10 pt-1 text-xs font-medium shrink-0 text-right ${
                      todayFlag ? "text-brand" : "text-muted"
                    }`}
                  >
                    {dayName}
                    <span className="block text-[9px] text-muted/70">{dateStr}</span>
                    {todayFlag && (
                      <span className="block text-[9px] text-brand">今天</span>
                    )}
                  </div>
                  {/* Items */}
                  <div className="flex-1 space-y-1">
                    {dayItems.length > 0 ? (
                      dayItems.map((item) => (
                        <div
                          key={item.id}
                          className={`w-full bg-surface border border-border rounded-lg pl-2 pr-3 py-1.5 border-l-2 flex items-center gap-2 ${
                            CAT_META[item.category]?.color ?? ""
                          } ${item.completed ? "opacity-50" : ""}`}
                        >
                          {/* Completion toggle */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCompleted(item);
                            }}
                            className="shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors"
                            style={{
                              borderColor: item.completed ? "#7CB342" : "#C0C0C0",
                              backgroundColor: item.completed ? "#7CB342" : "transparent",
                            }}
                          >
                            {item.completed && (
                              <span className="text-white text-[10px] leading-none">✓</span>
                            )}
                          </button>
                          {/* Content — tap to edit */}
                          <button
                            onClick={() => {
                              setEditItem(item);
                              setShowForm(true);
                            }}
                            className="flex-1 text-left bg-transparent border-none p-0"
                          >
                            <div className="flex justify-between items-center">
                              <span className={`text-xs ${item.completed ? "text-muted line-through" : "text-foreground"}`}>
                                {item.title}
                              </span>
                              <span className="text-[10px] text-muted">
                                {item.startTime.slice(0, 5)}-{item.endTime.slice(0, 5)}
                              </span>
                            </div>
                            {item.location && (
                              <div className="text-[9px] text-muted/60 mt-0.5">
                                📍 {item.location}
                              </div>
                            )}
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-[10px] text-muted/25 py-1">—</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* Month View */}
      {/* ================================================================ */}
      {viewMode === "month" && (
        <div className="px-2 py-3">
          {/* Month navigation */}
          <div className="flex items-center justify-between px-2 mb-3">
            <button
              onClick={goPrevMonth}
              className="w-8 h-8 flex items-center justify-center text-muted hover:text-foreground text-lg"
            >
              ‹
            </button>
            <span className="text-sm font-semibold text-foreground">
              {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
            </span>
            <button
              onClick={goNextMonth}
              className="w-8 h-8 flex items-center justify-center text-muted hover:text-foreground text-lg"
            >
              ›
            </button>
          </div>

          {/* Day-of-week header */}
          <div className="grid grid-cols-7 mb-1">
            {MON_HEADERS.map((h) => (
              <div
                key={h}
                className="text-center text-[10px] text-muted py-1.5"
              >
                {h}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          {monthGrid.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7">
              {week.map((date) => {
                const cellItems = items.filter((i) => i.dayOfWeek === date.getDay());
                const inCurrentMonth = date.getMonth() === currentMonth.getMonth();
                const todayFlag = isToday(date);
                const maxDots = 3;

                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => {
                      if (cellItems.length > 0) {
                        setDayListDate(date);
                      } else {
                        setEditItem(null);
                        setPrefillDayOfWeek(date.getDay());
                        setShowForm(true);
                      }
                    }}
                    className={`aspect-square rounded-md p-0.5 flex flex-col items-center justify-start pt-1 text-[11px] transition-colors ${
                      todayFlag
                        ? "bg-brand/10 ring-1 ring-brand"
                        : "hover:bg-muted/5"
                    }`}
                  >
                    <span
                      className={`text-[11px] leading-tight ${
                        todayFlag
                          ? "font-bold text-brand"
                          : inCurrentMonth
                            ? "text-foreground"
                            : "text-muted/25"
                      }`}
                    >
                      {date.getDate()}
                    </span>
                    {/* Dots */}
                    <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                      {cellItems.slice(0, maxDots).map((item) => (
                        <span
                          key={item.id}
                          className={`w-1.5 h-1.5 rounded-full ${CAT_META[item.category]?.dot}`}
                        />
                      ))}
                      {cellItems.length > maxDots && (
                        <span className="text-[8px] text-muted leading-none">
                          +{cellItems.length - maxDots}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Day Schedule List overlay (month view day tap) */}
      {dayListDate && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-overlay"
          onClick={() => setDayListDate(null)}
        >
          <div
            className="w-full max-w-[430px] bg-background rounded-t-2xl max-h-[60vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-background border-b border-border px-4 py-3 flex items-center justify-between rounded-t-2xl">
              <h3 className="text-sm font-semibold text-foreground">
                {WEEKDAYS[dayListDate.getDay()]} {formatMD(dayListDate)}
              </h3>
              <button onClick={() => setDayListDate(null)} className="text-muted text-sm">
                ✕
              </button>
            </div>

            {/* Items */}
            <div className="p-4 space-y-2">
              {(items.filter((i) => i.dayOfWeek === dayListDate.getDay())).length > 0 ? (
                items
                  .filter((i) => i.dayOfWeek === dayListDate.getDay())
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setDayListDate(null);
                        setEditItem(item);
                        setShowForm(true);
                      }}
                      className={`w-full bg-surface border border-border rounded-lg pl-2 pr-3 py-2 border-l-2 text-left hover:bg-muted/5 transition-colors flex items-center gap-2 ${
                        CAT_META[item.category]?.color ?? ""
                      } ${item.completed ? "opacity-50" : ""}`}
                    >
                      {/* Mini completion circle */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCompleted(item);
                        }}
                        className="shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center"
                        style={{
                          borderColor: item.completed ? "#7CB342" : "#C0C0C0",
                          backgroundColor: item.completed ? "#7CB342" : "transparent",
                        }}
                      >
                        {item.completed && (
                          <span className="text-white text-[8px] leading-none">✓</span>
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <span className={`text-xs truncate ${item.completed ? "text-muted line-through" : "text-foreground"}`}>
                            {item.title}
                          </span>
                          <span className="text-[10px] text-muted shrink-0 ml-2">
                            {item.startTime.slice(0, 5)}-{item.endTime.slice(0, 5)}
                          </span>
                        </div>
                        {item.location && (
                          <div className="text-[9px] text-muted/60 mt-0.5">📍 {item.location}</div>
                        )}
                      </div>
                    </button>
                  ))
              ) : (
                <p className="text-xs text-muted text-center py-4">暂无日程</p>
              )}

              {/* Add button */}
              <button
                onClick={() => {
                  setDayListDate(null);
                  setEditItem(null);
                  setPrefillDayOfWeek(dayListDate.getDay());
                  setShowForm(true);
                }}
                className="w-full py-2.5 border border-dashed border-brand/40 rounded-lg text-xs text-brand font-medium hover:bg-brand/5 transition-colors"
              >
                + 添加日程
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add button */}
      <button
        onClick={() => {
          setEditItem(null);
          setPrefillDayOfWeek(undefined);
          setShowForm(true);
        }}
        className="fixed bottom-16 right-4 w-12 h-12 rounded-full bg-brand text-white text-xl shadow-lg flex items-center justify-center hover:bg-brand-dark active:scale-95 transition-all z-30"
      >
        +
      </button>

      {/* Form modal */}
      {showForm && (
        <ScheduleForm
          initial={formInitial}
          onSave={handleSave}
          onCancel={handleCancel}
          onDelete={editItem ? handleDelete : undefined}
          saving={saving}
        />
      )}
    </div>
  );
}
