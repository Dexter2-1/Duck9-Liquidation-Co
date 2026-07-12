"use client";
import { useEffect, useState } from "react";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [edits, setEdits] = useState<Record<string, { wholesaleDiscountPercent: number; notes: string }>>({});

  async function load() {
    const res = await fetch("/api/customers");
    const data = await res.json();
    setCustomers(data);
    const e: any = {};
    data.forEach((c: any) => { e[c.id] = { wholesaleDiscountPercent: c.wholesaleDiscountPercent, notes: c.notes || "" }; });
    setEdits(e);
  }
  useEffect(() => { load(); }, []);

  async function save(id: string) {
    await fetch(`/api/customers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(edits[id]),
    });
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Customers</h1>
      <p className="text-sm text-gray-500 mb-6">Customers are created automatically the first time someone checks out. Flag repeat or bulk buyers with a wholesale discount — it's applied automatically at checkout (whichever discount is bigger between this and the manual-payment discount wins, not both stacked).</p>
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs uppercase text-gray-500 bg-gray-50">
              <th className="table-cell">Email</th>
              <th className="table-cell">Name</th>
              <th className="table-cell">Phone</th>
              <th className="table-cell">Wholesale %</th>
              <th className="table-cell">Notes</th>
              <th className="table-cell"></th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id}>
                <td className="table-cell text-xs">{c.email}</td>
                <td className="table-cell text-xs">{c.name || "—"}</td>
                <td className="table-cell text-xs">{c.phone || "—"}</td>
                <td className="table-cell">
                  <input
                    type="number" min="0" max="100" className="input w-20 text-xs"
                    value={edits[c.id]?.wholesaleDiscountPercent ?? 0}
                    onChange={(e) => setEdits({ ...edits, [c.id]: { ...edits[c.id], wholesaleDiscountPercent: parseFloat(e.target.value) || 0 } })}
                  />
                </td>
                <td className="table-cell">
                  <input
                    className="input text-xs"
                    value={edits[c.id]?.notes ?? ""}
                    onChange={(e) => setEdits({ ...edits, [c.id]: { ...edits[c.id], notes: e.target.value } })}
                  />
                </td>
                <td className="table-cell"><button className="btn btn-outline text-xs" onClick={() => save(c.id)}>Save</button></td>
              </tr>
            ))}
            {customers.length === 0 && <tr><td colSpan={6} className="table-cell text-center text-gray-500">No customers yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
