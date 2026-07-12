import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activityLog";
import { sendEmail, customerInvoiceEmail } from "@/lib/email";
import { generateInvoicePdf } from "@/lib/invoice";

// body: { action: "accept" | "decline" }
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action } = await req.json();
  const offer = await prisma.offer.findUnique({ where: { id: params.id }, include: { pallet: true } });
  if (!offer) return NextResponse.json({ error: "Offer not found" }, { status: 404 });
  if (offer.status !== "PENDING") return NextResponse.json({ error: "This offer was already handled." }, { status: 400 });

  if (action === "decline") {
    const updated = await prisma.offer.update({ where: { id: params.id }, data: { status: "DECLINED" } });
    await logActivity(session.id, "DECLINE_OFFER", offer.pallet.sku, `Declined $${offer.offerPrice} offer from ${offer.customerEmail}`);

    try {
      await sendEmail(
        offer.customerEmail,
        `Update on your offer for LOAD #${offer.pallet.sku}`,
        `<p>Hi ${offer.customerName},</p><p>Thanks for your offer of $${offer.offerPrice.toLocaleString()} on LOAD #${offer.pallet.sku} — unfortunately we're not able to accept it. The pallet is still listed at $${offer.pallet.price.toLocaleString()} if you'd like to purchase at that price.</p>`
      );
    } catch (err) {
      console.error("Offer decline email failed:", err);
    }

    return NextResponse.json({ ok: true, offer: updated });
  }

  if (action === "accept") {
    if (offer.pallet.quantityAvailable < 1) {
      return NextResponse.json({ error: "This pallet is no longer in stock." }, { status: 409 });
    }

    const orderNumber = "D9-" + Math.floor(100000 + Math.random() * 900000);
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerName: offer.customerName,
        customerEmail: offer.customerEmail,
        customerPhone: offer.customerPhone,
        fulfillmentMode: "pickup",
        pickupWarehouse: offer.pallet.location || "Contact us to confirm pickup location",
        subtotal: offer.offerPrice,
        totalPrice: offer.offerPrice,
        discountAmount: 0,
        discountReason: "Accepted offer price",
        status: "PENDING",
        paymentStatus: "UNPAID",
        items: { create: [{ palletId: offer.palletId, price: offer.offerPrice, quantity: 1 }] },
      },
      include: { items: { include: { pallet: true } } },
    });

    const remaining = offer.pallet.quantityAvailable - 1;
    await prisma.pallet.update({
      where: { id: offer.palletId },
      data: { quantityAvailable: remaining, status: remaining <= 0 ? "SOLD" : offer.pallet.status },
    });

    const updated = await prisma.offer.update({ where: { id: params.id }, data: { status: "ACCEPTED" } });
    await logActivity(session.id, "ACCEPT_OFFER", offer.pallet.sku, `Accepted $${offer.offerPrice} offer from ${offer.customerEmail} — created order ${orderNumber}`);

    const settings = await prisma.siteSettings.upsert({ where: { id: "main" }, update: {}, create: { id: "main" } });

    let invoiceAttachment: { filename: string; content: string }[] | undefined;
    try {
      const pdfBytes = await generateInvoicePdf(order, settings);
      invoiceAttachment = [{ filename: `Invoice-${orderNumber}.pdf`, content: Buffer.from(pdfBytes).toString("base64") }];
    } catch (err) {
      console.error("Invoice PDF generation failed on offer acceptance:", err);
    }

    await Promise.all([
      sendEmail(
        offer.customerEmail,
        `Your offer was accepted — Invoice ${orderNumber}`,
        `<p>Hi ${offer.customerName},</p><p>Good news — we accepted your offer of $${offer.offerPrice.toLocaleString()} on LOAD #${offer.pallet.sku}. Your order number is <b>${orderNumber}</b> and your invoice is attached.</p><p>${settings.paymentInstructions}</p>`,
        invoiceAttachment
      ).catch((err) => console.error("Offer acceptance customer email failed:", err)),

      sendEmail(
        settings.adminNotificationEmail,
        `Offer accepted — Order ${orderNumber}`,
        `<p>You accepted ${offer.customerName}'s offer of $${offer.offerPrice.toLocaleString()} on LOAD #${offer.pallet.sku}. Order ${orderNumber} created, marked UNPAID.</p>`,
        invoiceAttachment
      ).catch((err) => console.error("Offer acceptance admin email failed:", err)),
    ]);

    return NextResponse.json({ ok: true, offer: updated, orderNumber });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
