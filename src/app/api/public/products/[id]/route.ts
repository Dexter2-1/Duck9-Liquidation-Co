import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const pallet = await prisma.pallet.findUnique({
    where: { id: params.id },
    select: {
      id: true, sku: true, title: true, category: true, condition: true,
      itemsRange: true, weightLbs: true, location: true, imageUrl: true, imagesJson: true,
      retailValue: true, price: true, compareAtPrice: true, quantityAvailable: true, description: true, status: true,
    },
  });
  if (!pallet || pallet.status === "WRITTEN_OFF") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({
    ...pallet,
    images: pallet.imagesJson ? JSON.parse(pallet.imagesJson) : [],
  });
}
