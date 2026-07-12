import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const orders = await prisma.order.findMany({
    include: { items: { include: { pallet: true } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(orders);
}
