import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activityLog";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { description } = await req.json();

  const pallet = await prisma.pallet.update({
    where: { id: params.id },
    data: { description },
  });

  await prisma.descriptionHistory.create({
    data: { palletId: params.id, body: description, editedBy: session.name },
  });

  await logActivity(session.id, "EDIT_DESCRIPTION", pallet.sku, "Description updated");
  return NextResponse.json(pallet);
}
