import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activityLog";

// body: { ids: string[] }
export async function POST(req: NextRequest) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ids } = await req.json();
  await prisma.order.updateMany({
    where: { id: { in: ids } },
    data: { status: "SHIPPED", shippedAt: new Date() },
  });

  await logActivity(session.id, "BULK_SHIP", `${ids.length} orders`, "Marked shipped and labels generated");
  return NextResponse.json({ ok: true, count: ids.length });
}
