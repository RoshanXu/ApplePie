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

const SEED_SCHEDULES: Omit<ScheduleItem, "id">[] = [
  { dayOfWeek: 1, startTime: "08:00", endTime: "08:45", title: "语文", category: "learn", location: null, repeatType: "weekly" },
  { dayOfWeek: 1, startTime: "09:00", endTime: "09:45", title: "数学", category: "learn", location: null, repeatType: "weekly" },
  { dayOfWeek: 1, startTime: "10:00", endTime: "10:45", title: "英语", category: "learn", location: null, repeatType: "weekly" },
  { dayOfWeek: 1, startTime: "11:00", endTime: "11:45", title: "物理", category: "learn", location: "实验室B", repeatType: "weekly" },
  { dayOfWeek: 1, startTime: "12:00", endTime: "13:00", title: "午休", category: "rest", location: null, repeatType: "weekly" },
  { dayOfWeek: 1, startTime: "15:30", endTime: "16:30", title: "体育课", category: "sport", location: "操场", repeatType: "weekly" },
  { dayOfWeek: 1, startTime: "17:00", endTime: "18:30", title: "自习/作业", category: "learn", location: null, repeatType: "weekly" },
  { dayOfWeek: 1, startTime: "19:30", endTime: "20:30", title: "围棋兴趣", category: "explore", location: "少年宫", repeatType: "weekly" },
  { dayOfWeek: 2, startTime: "15:30", endTime: "16:30", title: "篮球班", category: "sport", location: "体育馆", repeatType: "weekly" },
  { dayOfWeek: 3, startTime: "18:30", endTime: "19:30", title: "朋友聚餐", category: "social", location: null, repeatType: "weekly" },
  { dayOfWeek: 4, startTime: "17:00", endTime: "18:30", title: "物理实验", category: "explore", location: "实验室A", repeatType: "weekly" },
  { dayOfWeek: 5, startTime: "19:00", endTime: "20:30", title: "篮球班", category: "sport", location: "体育馆", repeatType: "weekly" },
  { dayOfWeek: 3, startTime: "08:00", endTime: "08:45", title: "历史", category: "learn", location: null, repeatType: "weekly" },
  { dayOfWeek: 3, startTime: "10:00", endTime: "10:45", title: "地理", category: "learn", location: null, repeatType: "weekly" },
];

// ================================================================
// Page
// ================================================================

export default function SchedulePage() {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<ScheduleItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [seeded, setSeeded] = useState(false);

  // Calendar state
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [currentMonth, setCurrentMonth] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [prefillDayOfWeek, setPrefillDayOfWeek] = useState<number | undefined>(undefined);

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

  // Load items from API (or seed)
  const loadItems = useCallback(async () => {
    try {
      const res = await fetch("/api/schedule/items");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      if (data.items?.length > 0) {
        setItems(data.items);
        return;
      }
    } catch {
      // API unavailable — use local state
    }
    // Seed if empty and not yet seeded
    if (!seeded) {
      await seedData();
      setSeeded(true);
    }
  }, [seeded]);

  // Seed demo data through API
  const seedData = async () => {
    const created: ScheduleItem[] = [];
    for (const item of SEED_SCHEDULES) {
      try {
        const res = await fetch("/api/schedule/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });
        if (res.ok) {
          const data = await res.json();
          created.push(data.item);
        }
      } catch {
        // Skip failed seeds
      }
    }
    if (created.length > 0) setItems(created);
  };

  useEffect(() => { loadItems(); }, [loadItems]);

  // Save (create or update)
  const handleSave = async (data: {
    id?: string; dayOfWeek: number; startTime: string; endTime: string;
    title: string; category: DimCategory; location: string; repeatType: RepeatType;
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
                        <button
                          key={item.id}
                          onClick={() => {
                            setEditItem(item);
                            setShowForm(true);
                          }}
                          className={`w-full bg-surface border border-border rounded-lg pl-2 pr-3 py-1.5 border-l-2 text-left hover:bg-muted/5 transition-colors ${
                            CAT_META[item.category]?.color ?? ""
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-foreground">{item.title}</span>
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
                      setEditItem(null);
                      setPrefillDayOfWeek(date.getDay());
                      setShowForm(true);
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
