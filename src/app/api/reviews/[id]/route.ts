import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activityLog";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const review = await prisma.review.update({ where: { id: params.id }, data: body });

  await logActivity(session.id, "MODERATE_REVIEW", review.id, `Fields changed: ${Object.keys(body).join(", ")}`);
  return NextResponse.json(review);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.review.delete({ where: { id: params.id } });
  await logActivity(session.id, "DELETE_REVIEW", params.id, "Review removed");
  return NextResponse.json({ ok: true });
}
