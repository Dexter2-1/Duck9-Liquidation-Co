"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function ManifestPage() {
  const [pallets, setPallets] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/products");
    setPallets(await res.json());
  }
  useEffect(() => { load(); }, []);

  async function setGrade(id: string, condition: string) {
    await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ condition }),
    });
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Manifest Manager</h1>
      <p className="text-sm text-gray-500 mb-6">Upload supplier manifests from a pallet's detail page. This view shows manifest status across all loads and lets you adjust grade quickly if you open a pallet and find it doesn't match.</p>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs uppercase text-gray-500 bg-gray-50">
              <th className="table-cell">SKU</th>
              <th className="table-cell">Title</th>
              <th className="table-cell">Manifest</th>
              <th className="table-cell">Grade</th>
              <th className="table-cell">What's inside</th>
            </tr>
          </thead>
          <tbody>
            {pallets.map((p) => {
              const rows = p.manifestJson ? JSON.parse(p.manifestJson) : null;
              return (
                <React.Fragment key={p.id}>
                  <tr>
                    <td className="table-cell font-mono text-xs">{p.sku}</td>
                    <td className="table-cell"><Link href={`/products/${p.id}`} className="underline">{p.title}</Link></td>
                    <td className="table-cell text-xs">{rows ? `${rows.length} line items` : "Not uploaded"}</td>
                    <td className="table-cell">
                      <select className="input w-auto text-xs" value={p.condition} onChange={(e) => setGrade(p.id, e.target.value)}>
                        <option value="LIKE_NEW">Like New</option>
                        <option value="MINOR_SCRATCHES">Minor Scratches</option>
                        <option value="HEAVY_WEAR">Heavy Wear</option>
                        <option value="AS_IS">As-Is</option>
                      </select>
                    </td>
                    <td className="table-cell">
                      {rows && (
                        <button className="text-xs underline" onClick={() => setExpanded(expanded === p.id ? null : p.id)}>
                          {expanded === p.id ? "Hide" : "View"}
                        </button>
                      )}
                    </td>
                  </tr>
                  {expanded === p.id && rows && (
                    <tr>
                      <td colSpan={5} className="table-cell bg-gray-50">
                        <ul className="list-disc pl-5 text-sm space-y-1">
                          {rows.map((r: any, i: number) => (
                            <li key={i}>
                              {r.item_name || r.Item || Object.values(r)[0]} — qty {r.quantity || r.Quantity || "?"}
                              {r.unit_retail_price ? ` · $${r.unit_retail_price} retail each` : ""}
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
