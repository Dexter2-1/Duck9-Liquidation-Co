import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activityLog";

export async function GET() {
  const pallets = await prisma.pallet.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(pallets);
}

export async function POST(req: NextRequest) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const pallet = await prisma.pallet.create({
    data: {
      sku: body.sku,
      title: body.title,
      category: body.category,
      weightLbs: parseFloat(body.weightLbs),
      cost: parseFloat(body.cost),
      price: parseFloat(body.price),
      compareAtPrice: body.compareAtPrice ? parseFloat(body.compareAtPrice) : null,
      floorPrice: parseFloat(body.floorPrice ?? body.cost),
      condition: body.condition ?? "AS_IS",
      binLocation: body.binLocation ?? null,
      imageUrl: body.imageUrl || null,
      description: body.description ?? null,
      supplier: body.supplier ?? null,
    },
  });

  await logActivity(session.id, "CREATE_PRODUCT", pallet.sku, `Created pallet ${pallet.title}`);
  return NextResponse.json(pallet);
}
