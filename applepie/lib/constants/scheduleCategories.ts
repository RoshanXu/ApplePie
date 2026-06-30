import type { DimCategory } from "@prisma/client";

// ================================================================
// Sub-category hierarchy for 5-dim classification
// ================================================================

export interface SubCategoryOption {
  value: string;
  label: string;
}

/** Level-2 sub-categories keyed by parent DimCategory. */
export const SUB_CATEGORIES: Record<DimCategory, SubCategoryOption[]> = {
  learn: [
    { value: "校内", label: "校内课程" },
    { value: "校外", label: "校外补习" },
    { value: "自习", label: "自习/作业" },
  ],
  rest: [
    { value: "睡眠", label: "夜间睡眠" },
    { value: "午休", label: "午休/小憩" },
    { value: "放松", label: "放松娱乐" },
  ],
  sport: [
    { value: "体育课", label: "学校体育" },
    { value: "球类", label: "球类运动" },
    { value: "跑步", label: "跑步健身" },
    { value: "其他运动", label: "其他运动" },
  ],
  social: [
    { value: "朋友", label: "朋友聚会" },
    { value: "家庭", label: "家庭互动" },
    { value: "集体", label: "集体活动" },
  ],
  explore: [
    { value: "兴趣班", label: "兴趣特长" },
    { value: "实践", label: "实践活动" },
    { value: "AI游戏", label: "AI游戏" },
  ],
};

/** Level-3 subjects keyed by subCategory value. */
export const SUBJECTS: Record<string, string[]> = {
  "校内": [
    "数学", "语文", "英语", "物理", "化学",
    "历史", "地理", "生物", "政治",
    "音乐", "美术", "信息技术",
  ],
  "校外": [
    "数学补习", "英语补习", "物理补习",
    "化学补习", "语文补习",
  ],
};
