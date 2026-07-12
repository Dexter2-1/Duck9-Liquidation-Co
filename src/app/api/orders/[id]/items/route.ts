import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activityLog";

// body: { updates: [{ orderItemId, quantity }], removeIds: [orderItemId, ...] }
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: { include: { pallet: true } } },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.status === "CANCELLED") return NextResponse.json({ error: "This order is cancelled." }, { status: 400 });

  const { updates = [], removeIds = [] } = await req.json();

  // Removing items: release their reserved stock, then delete the line.
  for (const itemId of removeIds) {
    const item = order.items.find((i) => i.id === itemId);
    if (!item) continue;
    await prisma.pallet.update({
      where: { id: item.palletId },
      data: {
        quantityAvailable: item.pallet.quantityAvailable + item.quantity,
        status: item.pallet.status === "SOLD" ? "ACTIVE" : item.pallet.status,
      },
    });
    await prisma.orderItem.delete({ where: { id: itemId } });
  }

  // Quantity changes: adjust the pallet's stock by the difference, both directions.
  for (const u of updates) {
    const item = order.items.find((i) => i.id === u.orderItemId);
    if (!item || removeIds.includes(u.orderItemId)) continue;
    const newQty = parseInt(u.quantity);
    if (!Number.isFinite(newQty) || newQty <= 0) continue;

    const delta = newQty - item.quantity; // positive = taking more stock, negative = releasing some back
    const freshPallet = await prisma.pallet.findUnique({ where: { id: item.palletId } });
    if (!freshPallet) continue;

    if (delta > 0 && freshPallet.quantityAvailable < delta) {
      return NextResponse.json(
        { error: `Only ${freshPallet.quantityAvailable} more of "${freshPallet.title}" available — can't increase that much.` },
        { status: 409 }
      );
    }

    await prisma.pallet.update({
      where: { id: item.palletId },
      data: {
        quantityAvailable: freshPallet.quantityAvailable - delta,
        status: freshPallet.quantityAvailable - delta <= 0 ? "SOLD" : (freshPallet.status === "SOLD" ? "ACTIVE" : freshPallet.status),
      },
    });
    await prisma.orderItem.update({ where: { id: item.id }, data: { quantity: newQty } });
  }

  const remaining = await prisma.orderItem.findMany({ where: { orderId: params.id } });
  if (remaining.length === 0) {
    return NextResponse.json(
      { error: "An order can't have zero items — use Cancel Order instead if you want to remove everything." },
      { status: 400 }
    );
  }

  const subtotal = remaining.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const totalPrice = Math.max(0, subtotal - order.discountAmount);

  const updatedOrder = await prisma.order.update({
    where: { id: params.id },
    data: { subtotal, totalPrice },
    include: { items: { include: { pallet: true } } },
  });

  await logActivity(session.id, "EDIT_ORDER_ITEMS", order.orderNumber, `${updates.length} quantity change(s), ${removeIds.length} item(s) removed`);

  return NextResponse.json(updatedOrder);
}
