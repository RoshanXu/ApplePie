"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { ScheduleForm } from "@/components/schedule/ScheduleForm";
import type { DimCategory, RepeatType } from "@prisma/client";

// ================================================================
// Types
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
    } finally {
      setSaving(false);
    }
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

      {/* Weekly calendar */}
      <div className="px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground mb-3">
          {loading ? "加载中..." : "本周课表"}
        </h3>
        <div className="space-y-2">
          {WEEKDAYS.map((day, idx) => {
            const dayItems = grouped.get(idx) ?? [];
            return (
              <div key={day} className="flex gap-2">
                {/* Day label */}
                <div className={`w-10 pt-1 text-xs font-medium shrink-0 text-right ${
                  idx === new Date().getDay() ? "text-brand" : "text-muted"
                }`}>
                  {day}
                  {idx === new Date().getDay() && (
                    <span className="block text-[9px] text-brand">今天</span>
                  )}
                </div>
                {/* Items */}
                <div className="flex-1 space-y-1">
                  {dayItems.length > 0 ? (
                    dayItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => { setEditItem(item); setShowForm(true); }}
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
                          <div className="text-[9px] text-muted/60 mt-0.5">📍 {item.location}</div>
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

      {/* Add button */}
      <button
        onClick={() => { setEditItem(null); setShowForm(true); }}
        className="fixed bottom-16 right-4 w-12 h-12 rounded-full bg-brand text-white text-xl shadow-lg flex items-center justify-center hover:bg-brand-dark active:scale-95 transition-all z-30"
      >
        +
      </button>

      {/* Form modal */}
      {showForm && (
        <ScheduleForm
          initial={editItem ? {
            id: editItem.id,
            dayOfWeek: editItem.dayOfWeek,
            startTime: editItem.startTime,
            endTime: editItem.endTime,
            title: editItem.title,
            category: editItem.category,
            location: editItem.location ?? "",
            repeatType: editItem.repeatType,
          } : undefined}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditItem(null); }}
          onDelete={editItem ? handleDelete : undefined}
          saving={saving}
        />
      )}
    </div>
  );
}
