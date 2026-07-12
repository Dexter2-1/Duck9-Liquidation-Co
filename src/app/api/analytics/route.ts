import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await prisma.orderItem.findMany({
    where: { order: { status: { not: "CANCELLED" }, paymentStatus: "PAID" } },
    include: { pallet: true, order: true },
  });

  const byCategory: Record<string, { revenue: number; units: number }> = {};
  const byCondition: Record<string, { revenue: number; units: number }> = {};
  let totalRevenue = 0;
  let daysToSellSum = 0;
  let daysToSellCount = 0;

  for (const item of items) {
    const revenue = item.price * item.quantity;
    totalRevenue += revenue;

    const cat = item.pallet.category;
    byCategory[cat] = byCategory[cat] || { revenue: 0, units: 0 };
    byCategory[cat].revenue += revenue;
    byCategory[cat].units += item.quantity;

    const cond = item.pallet.condition;
    byCondition[cond] = byCondition[cond] || { revenue: 0, units: 0 };
    byCondition[cond].revenue += revenue;
    byCondition[cond].units += item.quantity;

    const days = (item.order.createdAt.getTime() - item.pallet.createdAt.getTime()) / 86400000;
    if (days >= 0) {
      daysToSellSum += days;
      daysToSellCount += 1;
    }
  }

  const orderCount = await prisma.order.count({ where: { status: { not: "CANCELLED" }, paymentStatus: "PAID" } });

  return NextResponse.json({
    totalRevenue,
    orderCount,
    avgDaysToSell: daysToSellCount > 0 ? daysToSellSum / daysToSellCount : null,
    byCategory: Object.entries(byCategory)
      .map(([category, v]) => ({ category, ...v }))
      .sort((a, b) => b.revenue - a.revenue),
    byCondition: Object.entries(byCondition)
      .map(([condition, v]) => ({ condition, ...v }))
      .sort((a, b) => b.revenue - a.revenue),
  });
}
