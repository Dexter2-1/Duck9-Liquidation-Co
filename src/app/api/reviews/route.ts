import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const reviews = await prisma.review.findMany({
    include: { pallet: { select: { title: true, sku: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(reviews);
}
