import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { signToken, setSessionCookie } from "@/lib/auth/jwt";

export async function POST(request: NextRequest) {
  try {
    const { phone, password, nickname, role } = await request.json();

    // Validate
    if (!phone || !password || !nickname) {
      return NextResponse.json(
        { error: "手机号、密码和昵称为必填项" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "密码至少 6 位" },
        { status: 400 }
      );
    }

    // Check existing user
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      return NextResponse.json(
        { error: "该手机号已注册" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        phone,
        passwordHash,
        nickname,
        role: role === "parent" ? "parent" : "student",
      },
    });

    // Auto-login after registration
    const token = await signToken({ sub: user.id, role: user.role });
    await setSessionCookie(token);

    return NextResponse.json({
      user: { id: user.id, nickname: user.nickname, role: user.role },
    });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json(
      { error: "注册失败，请稍后重试" },
      { status: 500 }
    );
  }
}
