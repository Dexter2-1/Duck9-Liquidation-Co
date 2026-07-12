import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail, orderNotificationEmail, customerInvoiceEmail } from "@/lib/email";
import { sendOrderSms } from "@/lib/sms";
import { generateInvoicePdf } from "@/lib/invoice";

// body: {
//   items: [{ palletId, qty }],
//   customer: { firstName, lastName, email, phone },
//   fulfillment: { mode: "delivery" | "pickup", address?, warehouse? }
// }
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { items, customer, fulfillment } = body;

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Your load is empty." }, { status: 400 });
  }

  const pallets = await prisma.pallet.findMany({ where: { id: { in: items.map((i: any) => i.palletId) } } });

  // Validate stock before committing anything
  for (const item of items) {
    const p = pallets.find((x) => x.id === item.palletId);
    if (!p || p.quantityAvailable < item.qty) {
      return NextResponse.json(
        { error: `"${p?.title ?? "A pallet"}" no longer has enough stock available. Please refresh your load.` },
        { status: 409 }
      );
    }
  }

  const subtotal = items.reduce((sum: number, item: any) => {
    const p = pallets.find((x) => x.id === item.palletId)!;
    return sum + p.price * item.qty;
  }, 0);

  const settings = await prisma.siteSettings.upsert({ where: { id: "main" }, update: {}, create: { id: "main" } });

  // Look up (or create) the customer record by email, so repeat/wholesale buyers
  // can be flagged in the admin panel for future automatic discounts.
  const customerRecord = await prisma.customer.upsert({
    where: { email: customer.email },
    update: { name: `${customer.firstName} ${customer.lastName}`.trim(), phone: customer.phone },
    create: { email: customer.email, name: `${customer.firstName} ${customer.lastName}`.trim(), phone: customer.phone },
  });

  // Two possible discounts: (1) a manual-payment-method discount for orders over
  // a threshold, since Zelle/Cash App/etc. cost nothing in processing fees, and
  // (2) a per-customer wholesale discount set by the admin. We apply whichever is larger.
  const paymentDiscountAmount =
    settings.paymentDiscountEnabled && subtotal >= settings.paymentDiscountThreshold
      ? subtotal * (settings.paymentDiscountPercent / 100)
      : 0;
  const wholesaleDiscountAmount = subtotal * (customerRecord.wholesaleDiscountPercent / 100);

  let discountAmount = 0;
  let discountReason: string | null = null;
  if (wholesaleDiscountAmount > paymentDiscountAmount) {
    discountAmount = wholesaleDiscountAmount;
    discountReason = `Wholesale buyer discount (${customerRecord.wholesaleDiscountPercent}%)`;
  } else if (paymentDiscountAmount > 0) {
    discountAmount = paymentDiscountAmount;
    discountReason = `Manual payment discount (${settings.paymentDiscountPercent}%)`;
  }

  const totalPrice = subtotal - discountAmount;

  const orderNumber = "D9-" + Math.floor(100000 + Math.random() * 900000);

  const order = await prisma.order.create({
    data: {
      orderNumber,
      customerName: `${customer.firstName} ${customer.lastName}`.trim(),
      customerEmail: customer.email,
      customerPhone: customer.phone,
      fulfillmentMode: fulfillment.mode,
      deliveryAddress: fulfillment.mode === "delivery" ? fulfillment.address : null,
      pickupWarehouse: fulfillment.mode === "pickup" ? fulfillment.warehouse : null,
      subtotal,
      discountAmount,
      discountReason,
      totalPrice,
      status: "PENDING",
      paymentStatus: "UNPAID",
      items: {
        create: items.map((item: any) => {
          const p = pallets.find((x) => x.id === item.palletId)!;
          return { palletId: p.id, price: p.price, quantity: item.qty };
        }),
      },
    },
    include: { items: { include: { pallet: true } } },
  });

  // Decrement stock, mark sold out if it hits zero
  for (const item of items) {
    const p = pallets.find((x) => x.id === item.palletId)!;
    const remaining = p.quantityAvailable - item.qty;
    await prisma.pallet.update({
      where: { id: p.id },
      data: {
        quantityAvailable: remaining,
        status: remaining <= 0 ? "SOLD" : p.status,
      },
    });
  }

  // Generate the invoice PDF once, then email it to the customer and admin at the
  // same time — a hiccup in either email should never block the order itself.
  let invoiceAttachment: { filename: string; content: string }[] | undefined;
  try {
    const pdfBytes = await generateInvoicePdf(order, settings);
    const base64 = Buffer.from(pdfBytes).toString("base64");
    invoiceAttachment = [{ filename: `Invoice-${order.orderNumber}.pdf`, content: base64 }];
  } catch (err) {
    console.error("Invoice PDF generation failed (emails will still send without it):", err);
  }

  await Promise.all([
    sendEmail(
      settings.adminNotificationEmail,
      `New order ${order.orderNumber} — $${totalPrice.toLocaleString()}`,
      orderNotificationEmail(order),
      invoiceAttachment
    ).catch((err) => console.error("Admin order email failed (order was still saved):", err)),

    sendEmail(
      order.customerEmail,
      `Your Dock9 invoice — Order ${order.orderNumber}`,
      customerInvoiceEmail(order, settings),
      invoiceAttachment
    ).catch((err) => console.error("Customer invoice email failed (order was still saved):", err)),

    sendOrderSms(
      settings.adminNotificationPhone,
      `Dock9: New order ${order.orderNumber} for $${totalPrice.toLocaleString()} from ${order.customerName}. ${order.fulfillmentMode === "pickup" ? "Pickup" : "Delivery"} — marked UNPAID.`
    ).catch((err) => console.error("Order SMS notification failed (order was still saved):", err)),
  ]);

  return NextResponse.json({
    ok: true,
    orderNumber: order.orderNumber,
    subtotal,
    discountAmount,
    discountReason,
    totalPrice,
    paymentInstructions: settings.paymentInstructions,
  });
}
