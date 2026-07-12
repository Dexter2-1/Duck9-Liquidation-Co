import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { generateInvoicePdf } from "@/lib/invoice";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: { include: { pallet: true } } },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const settings = await prisma.siteSettings.upsert({ where: { id: "main" }, update: {}, create: { id: "main" } });
  const pdfBytes = await generateInvoicePdf(order, settings, order.paymentStatus === "PAID");

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Invoice-${order.orderNumber}.pdf"`,
    },
  });
}
