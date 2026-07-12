import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const palletId = req.nextUrl.searchParams.get("palletId");
  if (!palletId) return NextResponse.json({ error: "palletId is required" }, { status: 400 });

  const reviews = await prisma.review.findMany({
    where: { palletId, approved: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(reviews);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { palletId, authorName, rating, comment } = body;

  if (!authorName || !comment || !rating) {
    return NextResponse.json({ error: "Name, rating, and comment are required." }, { status: 400 });
  }
  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be between 1 and 5." }, { status: 400 });
  }

  const review = await prisma.review.create({
    data: { palletId: palletId || null, authorName, rating, comment, approved: false },
  });

  return NextResponse.json({ ok: true, review });
}
