import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const testimonials = await prisma.review.findMany({
    where: { approved: true, featured: true },
    orderBy: { createdAt: "desc" },
    take: 6,
  });
  return NextResponse.json(testimonials);
}
