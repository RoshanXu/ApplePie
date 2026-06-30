import { NextResponse } from "next/server";

/**
 * POST /api/parent/bind
 * Binds a parent to a student using a 6-digit binding code.
 */
export async function POST(req: Request) {
  try {
    const { bindingCode } = await req.json();

    if (!bindingCode || bindingCode.length !== 6) {
      return NextResponse.json(
        { error: "请输入 6 位绑定码" },
        { status: 400 }
      );
    }

    // TODO: Verify binding code against DB, create parent_child_bindings record
    return NextResponse.json({
      message: "绑定请求已发送，等待学生确认",
      status: "pending",
    });
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
}
