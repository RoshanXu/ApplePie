import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import type { DimCategory, RepeatType } from "@prisma/client";

// ================================================================
// GET /api/schedule/items — list schedules
// Query: ?studentId=xxx&weekStart=2026-06-30 (optional filters)
// ================================================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    // TODO: get studentId from auth session, not query param
    const where: Record<string, unknown> = {};
    if (studentId) where.studentId = studentId;

    const items = await prisma.schedule.findMany({
      where,
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    return NextResponse.json({ items });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ================================================================
// POST /api/schedule/items — create a schedule item
// ================================================================
const VALID_CATEGORIES = ["learn", "rest", "sport", "social", "explore"] as const;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate required fields
    const errors: string[] = [];
    if (!body.title?.trim()) errors.push("title is required");
    if (typeof body.dayOfWeek !== "number" || body.dayOfWeek < 0 || body.dayOfWeek > 6) {
      errors.push("dayOfWeek must be 0-6 (Sun-Sat)");
    }
    if (!body.startTime?.match(/^\d{2}:\d{2}$/)) errors.push("startTime must be HH:mm");
    if (!body.endTime?.match(/^\d{2}:\d{2}$/)) errors.push("endTime must be HH:mm");
    if (!VALID_CATEGORIES.includes(body.category)) {
      errors.push(`category must be one of: ${VALID_CATEGORIES.join(", ")}`);
    }
    if (errors.length > 0) {
      return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
    }

    const item = await prisma.schedule.create({
      data: {
        studentId: body.studentId ?? "00000000-0000-0000-0000-000000000001", // TODO: from auth
        dayOfWeek: body.dayOfWeek,
        startTime: body.startTime,
        endTime: body.endTime,
        title: body.title.trim(),
        category: body.category as DimCategory,
        subCategory: body.subCategory?.trim() || null,
        subject: body.subject?.trim() || null,
        location: body.location?.trim() ?? null,
        repeatType: (body.repeatType as RepeatType) ?? "weekly",
        source: body.source ?? "manual",
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ================================================================
// PUT /api/schedule/items — update a schedule item (id in body)
// ================================================================
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (body.title?.trim()) updateData.title = body.title.trim();
    if (typeof body.dayOfWeek === "number") updateData.dayOfWeek = body.dayOfWeek;
    if (body.startTime) updateData.startTime = body.startTime;
    if (body.endTime) updateData.endTime = body.endTime;
    if (body.category && VALID_CATEGORIES.includes(body.category)) updateData.category = body.category;
    if (body.location !== undefined) updateData.location = body.location?.trim() ?? null;
    if (body.subCategory !== undefined) updateData.subCategory = body.subCategory?.trim() || null;
    if (body.subject !== undefined) updateData.subject = body.subject?.trim() || null;
    if (body.completed !== undefined) updateData.completed = body.completed;
    if (body.repeatType) updateData.repeatType = body.repeatType;

    const item = await prisma.schedule.update({
      where: { id: body.id },
      data: updateData,
    });

    return NextResponse.json({ item });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
