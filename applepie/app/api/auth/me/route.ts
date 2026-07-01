import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/jwt";
import { prisma } from "@/lib/db/prisma";

/** Return current authenticated user info (or 401) */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { id: true, nickname: true, role: true, phone: true, avatarUrl: true },
  });

  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user });
}
