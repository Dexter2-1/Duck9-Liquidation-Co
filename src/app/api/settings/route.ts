import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activityLog";

export async function GET() {
  const settings = await prisma.siteSettings.upsert({
    where: { id: "main" },
    update: {},
    create: { id: "main" },
  });
  return NextResponse.json({ ...settings, warehouses: JSON.parse(settings.warehousesJson) });
}

export async function PATCH(req: NextRequest) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { warehouses, ...rest } = body;

  const updated = await prisma.siteSettings.upsert({
    where: { id: "main" },
    update: {
      ...rest,
      ...(warehouses ? { warehousesJson: JSON.stringify(warehouses) } : {}),
    },
    create: { id: "main", ...rest, ...(warehouses ? { warehousesJson: JSON.stringify(warehouses) } : {}) },
  });

  await logActivity(session.id, "UPDATE_SETTINGS", "site settings", "Company info, address, or contact details changed");
  return NextResponse.json({ ...updated, warehouses: JSON.parse(updated.warehousesJson) });
}
