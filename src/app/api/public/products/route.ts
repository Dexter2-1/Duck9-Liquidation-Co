import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Public, unauthenticated endpoint for the storefront. Only exposes customer-safe
// fields — never cost, floorPrice, binLocation, or supplier.
export async function GET() {
  const pallets = await prisma.pallet.findMany({
    where: { status: "ACTIVE", quantityAvailable: { gt: 0 } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      sku: true,
      title: true,
      category: true,
      condition: true,
      itemsRange: true,
      weightLbs: true,
      location: true,
      imageUrl: true,
      retailValue: true,
      price: true,
      compareAtPrice: true,
      quantityAvailable: true,
      description: true,
    },
  });
  return NextResponse.json(pallets);
}
