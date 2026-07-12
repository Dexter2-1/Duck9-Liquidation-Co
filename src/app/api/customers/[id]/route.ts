import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activityLog";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const customer = await prisma.customer.update({ where: { id: params.id }, data: body });

  await logActivity(session.id, "UPDATE_CUSTOMER", customer.email, `Fields changed: ${Object.keys(body).join(", ")}`);
  return NextResponse.json(customer);
}
