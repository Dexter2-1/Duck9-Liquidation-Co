import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// Calls the Anthropic API to draft a sales description from the pallet's manifest + attributes.
// Requires ANTHROPIC_API_KEY to be set in your environment (see README).
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pallet = await prisma.pallet.findUnique({ where: { id: params.id } });
  if (!pallet) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "your-anthropic-api-key-here") {
    return NextResponse.json(
      { error: "No ANTHROPIC_API_KEY configured. Add one to your .env file to enable AI descriptions." },
      { status: 400 }
    );
  }

  const manifestSummary = pallet.manifestJson
    ? JSON.stringify(JSON.parse(pallet.manifestJson)).slice(0, 4000)
    : "No manifest uploaded — write a general description based on the title and category only.";

  const prompt = `Write a 150-250 word sales description for a liquidation pallet listing.
Title: ${pallet.title}
Category: ${pallet.category}
Condition grade: ${pallet.condition}
Weight: ${pallet.weightLbs} lbs
Manifest data (JSON, may be partial): ${manifestSummary}

Write in plain, honest, upbeat retail copy. Do not invent specific item counts or brands that aren't in the manifest data. Mention that contents are sold as-is and item counts are estimates. Do not use markdown headers.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    return NextResponse.json({ error: `Anthropic API error: ${errText}` }, { status: 500 });
  }

  const data = await res.json();
  const text = data.content?.map((b: any) => b.text || "").join("\n") ?? "";

  return NextResponse.json({ description: text });
}
