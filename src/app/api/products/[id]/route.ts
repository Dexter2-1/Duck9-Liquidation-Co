import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activityLog";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const pallet = await prisma.pallet.findUnique({
    where: { id: params.id },
    include: { descHistory: { orderBy: { createdAt: "desc" } } },
  });
  if (!pallet) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(pallet);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const before = await prisma.pallet.findUnique({ where: { id: params.id } });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Enforce floor price — never allow a price update below the floor
  if (body.price !== undefined && body.price < before.floorPrice) {
    return NextResponse.json(
      { error: `Price cannot be set below the floor price of $${before.floorPrice}.` },
      { status: 400 }
    );
  }

  const updated = await prisma.pallet.update({
    where: { id: params.id },
    data: body,
  });

  await logActivity(session.id, "UPDATE_PRODUCT", updated.sku, `Fields changed: ${Object.keys(body).join(", ")}`);
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pallet = await prisma.pallet.update({
    where: { id: params.id },
    data: { status: "WRITTEN_OFF" },
  });
  await logActivity(session.id, "WRITE_OFF_PRODUCT", pallet.sku, "Marked as damaged / written off for tax records");
  return NextResponse.json(pallet);
}
