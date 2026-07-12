import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activityLog";

// body: { palletId: string, csvText: string }
// Expected CSV columns (flexible): item_name, quantity, unit_retail_price, category
export async function POST(req: NextRequest) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { palletId, csvText } = await req.json();
  const pallet = await prisma.pallet.findUnique({ where: { id: palletId } });
  if (!pallet) return NextResponse.json({ error: "Pallet not found" }, { status: 404 });

  const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  if (parsed.errors.length > 0) {
    return NextResponse.json({ error: "Could not parse CSV.", details: parsed.errors }, { status: 400 });
  }

  const rows = parsed.data as Record<string, string>[];

  const updated = await prisma.pallet.update({
    where: { id: palletId },
    data: { manifestJson: JSON.stringify(rows) },
  });

  await logActivity(session.id, "MANIFEST_UPLOAD", pallet.sku, `${rows.length} manifest rows uploaded`);
  return NextResponse.json({ ok: true, rowCount: rows.length, pallet: updated });
}
