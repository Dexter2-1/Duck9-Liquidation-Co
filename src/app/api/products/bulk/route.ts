import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activityLog";

// body: { ids: string[], action: "setPrice"|"adjustPricePct"|"setCategory"|"setStatus"|"appendDescription", value: any }
export async function POST(req: NextRequest) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ids, action, value } = await req.json();
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "No pallets selected." }, { status: 400 });
  }

  const pallets = await prisma.pallet.findMany({ where: { id: { in: ids } } });
  let skipped: string[] = [];

  for (const p of pallets) {
    if (action === "setPrice") {
      const newPrice = parseFloat(value);
      if (newPrice < p.floorPrice) { skipped.push(p.sku); continue; }
      await prisma.pallet.update({ where: { id: p.id }, data: { price: newPrice } });
    } else if (action === "adjustPricePct") {
      const pct = parseFloat(value) / 100;
      const newPrice = Math.round(p.price * (1 + pct) * 100) / 100;
      if (newPrice < p.floorPrice) { skipped.push(p.sku); continue; }
      await prisma.pallet.update({ where: { id: p.id }, data: { price: newPrice } });
    } else if (action === "setCategory") {
      await prisma.pallet.update({ where: { id: p.id }, data: { category: value } });
    } else if (action === "setStatus") {
      await prisma.pallet.update({ where: { id: p.id }, data: { status: value } });
    } else if (action === "appendDescription") {
      const newDesc = `${p.description ?? ""}\n\n${value}`.trim();
      await prisma.pallet.update({ where: { id: p.id }, data: { description: newDesc } });
      await prisma.descriptionHistory.create({
        data: { palletId: p.id, body: newDesc, editedBy: session.name },
      });
    }
  }

  await logActivity(
    session.id,
    "BULK_EDIT",
    `${ids.length} pallets`,
    `Action: ${action}, value: ${value}${skipped.length ? `, skipped (below floor): ${skipped.join(", ")}` : ""}`
  );

  return NextResponse.json({ ok: true, updated: pallets.length - skipped.length, skipped });
}
