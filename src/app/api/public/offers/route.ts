import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { palletId, customerName, customerEmail, customerPhone, offerPrice, message } = body;

  if (!palletId || !customerName || !customerEmail || !offerPrice) {
    return NextResponse.json({ error: "Name, email, and offer amount are required." }, { status: 400 });
  }

  const pallet = await prisma.pallet.findUnique({ where: { id: palletId } });
  if (!pallet) return NextResponse.json({ error: "Pallet not found." }, { status: 404 });

  const offer = await prisma.offer.create({
    data: {
      palletId,
      customerName,
      customerEmail,
      customerPhone: customerPhone || null,
      offerPrice: parseFloat(offerPrice),
      message: message || null,
      status: "PENDING",
    },
  });

  return NextResponse.json({ ok: true, offer });
}
