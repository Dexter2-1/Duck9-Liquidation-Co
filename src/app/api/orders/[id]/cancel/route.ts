import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activityLog";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: { include: { pallet: true } } },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.status === "CANCELLED") return NextResponse.json({ error: "Already cancelled." }, { status: 400 });

  const { reason } = await req.json().catch(() => ({ reason: "" }));

  // Release the reserved stock back to the load board for every item on this order.
  for (const item of order.items) {
    const restoredQty = item.pallet.quantityAvailable + item.quantity;
    await prisma.pallet.update({
      where: { id: item.palletId },
      data: {
        quantityAvailable: restoredQty,
        status: item.pallet.status === "SOLD" ? "ACTIVE" : item.pallet.status,
      },
    });
  }

  const updated = await prisma.order.update({
    where: { id: params.id },
    data: { status: "CANCELLED" },
    include: { items: { include: { pallet: true } } },
  });

  await logActivity(session.id, "CANCEL_ORDER", order.orderNumber, reason ? `Cancelled — ${reason}` : "Cancelled by admin");

  try {
    await sendEmail(
      order.customerEmail,
      `Order ${order.orderNumber} cancelled`,
      `<p>Hi ${order.customerName},</p><p>Your order ${order.orderNumber} has been cancelled${reason ? ` (${reason})` : ""}. If you were charged, you will not be charged, and any reserved pallets are back on the load board. Reach out if you have questions.</p>`
    );
  } catch (err) {
    console.error("Cancel notification email failed (order was still cancelled):", err);
  }

  return NextResponse.json(updated);
}
