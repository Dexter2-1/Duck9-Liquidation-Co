import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activityLog";
import { sendEmail, customerInvoiceEmail } from "@/lib/email";
import { generateInvoicePdf } from "@/lib/invoice";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: { include: { pallet: true } } },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json(order);
}

const EDITABLE_FIELDS = ["customerName", "customerEmail", "customerPhone", "fulfillmentMode", "deliveryAddress", "pickupWarehouse"] as const;

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const editableUpdates: Record<string, any> = {};
  for (const field of EDITABLE_FIELDS) {
    if (body[field] !== undefined) editableUpdates[field] = body[field];
  }

  const order = await prisma.order.update({
    where: { id: params.id },
    data: {
      ...editableUpdates,
      ...(body.status ? { status: body.status, shippedAt: body.status === "SHIPPED" ? new Date() : undefined } : {}),
      ...(body.paymentStatus ? { paymentStatus: body.paymentStatus } : {}),
    },
    include: { items: { include: { pallet: true } } },
  });

  if (Object.keys(editableUpdates).length > 0) {
    await logActivity(session.id, "EDIT_ORDER", order.orderNumber, `Fields changed: ${Object.keys(editableUpdates).join(", ")}`);
  }

  if (body.status === "SHIPPED") {
    await logActivity(session.id, "MARK_SHIPPED", order.orderNumber, "Marked shipped");
    await sendEmail(
      order.customerEmail,
      `Your order ${order.orderNumber} has shipped`,
      `<p>Hi ${order.customerName},</p><p>Your Dock9 load (${order.orderNumber}) is on its way. Thanks for your business!</p>`
    );
  }

  if (body.paymentStatus === "PAID") {
    await logActivity(session.id, "MARK_PAID", order.orderNumber, "Payment confirmed manually by admin");

    // Regenerate the invoice with a PAID stamp and send it to the customer again
    // (and to the admin inbox for the paper trail), so there's always one final,
    // correct copy of the invoice reflecting its real status.
    const settings = await prisma.siteSettings.upsert({ where: { id: "main" }, update: {}, create: { id: "main" } });
    try {
      const pdfBytes = await generateInvoicePdf(order, settings, true);
      const attachment = [{ filename: `Invoice-${order.orderNumber}-PAID.pdf`, content: Buffer.from(pdfBytes).toString("base64") }];

      await Promise.all([
        sendEmail(
          order.customerEmail,
          `Paid — Invoice ${order.orderNumber}`,
          customerInvoiceEmail(order, settings).replace(
            "Thanks for your order",
            "Payment received — thank you"
          ),
          attachment
        ),
        sendEmail(
          settings.adminNotificationEmail,
          `Marked paid — Invoice ${order.orderNumber}`,
          `<p>Order ${order.orderNumber} was marked paid by ${session.name}. Updated invoice attached for your records.</p>`,
          attachment
        ),
      ]);
    } catch (err) {
      console.error("Failed to regenerate/send paid invoice (payment status was still updated):", err);
    }
  }

  return NextResponse.json(order);
}
