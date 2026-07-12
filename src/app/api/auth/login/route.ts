import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signSession, SESSION_COOKIE } from "@/lib/auth";
import { logActivity } from "@/lib/activityLog";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });

  const token = signSession({ id: user.id, name: user.name, email: user.email, role: user.role as any });
  await logActivity(user.id, "LOGIN", "auth", `${user.email} logged in`);

  const res = NextResponse.json({ ok: true, user: { name: user.name, role: user.role } });
  res.cookies.set(SESSION_COOKIE, token, { httpOnly: true, path: "/", maxAge: 60 * 60 * 12 });
  return res;
}
