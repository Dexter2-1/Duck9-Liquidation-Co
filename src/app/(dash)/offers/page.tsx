"use client";
import { useEffect, useState } from "react";

export default function OffersPage() {
  const [offers, setOffers] = useState<any[]>([]);
  const [message, setMessage] = useState("");

  async function load() {
    const res = await fetch("/api/offers");
    setOffers(await res.json());
  }
  useEffect(() => { load(); }, []);

  async function act(id: string, action: "accept" | "decline") {
    const res = await fetch(`/api/offers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    setMessage(res.ok ? (action === "accept" ? `Accepted — order ${data.orderNumber} created.` : "Offer declined.") : data.error);
    load();
  }

  const pending = offers.filter((o) => o.status === "PENDING");
  const resolved = offers.filter((o) => o.status !== "PENDING");

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Offers</h1>
      <p className="text-sm text-gray-500 mb-6">Accepting an offer creates a real order at the offered price and emails the customer payment instructions. Declining emails them that the offer wasn't accepted.</p>
      {message && <div className="card p-3 mb-4 text-sm">{message}</div>}

      <h2 className="font-bold mb-3">Pending ({pending.length})</h2>
      <div className="card overflow-hidden mb-8">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs uppercase text-gray-500 bg-gray-50">
              <th className="table-cell">When</th>
              <th className="table-cell">Pallet</th>
              <th className="table-cell">Buyer</th>
              <th className="table-cell">Listed</th>
              <th className="table-cell">Offer</th>
              <th className="table-cell">Message</th>
              <th className="table-cell">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pending.map((o) => (
              <tr key={o.id}>
                <td className="table-cell text-xs">{new Date(o.createdAt).toLocaleDateString()}</td>
                <td className="table-cell text-xs">{o.pallet.sku} — {o.pallet.title}</td>
                <td className="table-cell text-xs">{o.customerName}<br /><span className="text-gray-500">{o.customerEmail}</span></td>
                <td className="table-cell text-xs">${o.pallet.price.toLocaleString()}</td>
                <td className="table-cell text-xs font-semibold">${o.offerPrice.toLocaleString()}</td>
                <td className="table-cell text-xs max-w-xs">{o.message || "—"}</td>
                <td className="table-cell text-xs space-x-2 whitespace-nowrap">
                  <button className="underline text-green-700" onClick={() => act(o.id, "accept")}>Accept</button>
                  <button className="underline text-red-600" onClick={() => act(o.id, "decline")}>Decline</button>
                </td>
              </tr>
            ))}
            {pending.length === 0 && <tr><td colSpan={7} className="table-cell text-center text-gray-500">No pending offers.</td></tr>}
          </tbody>
        </table>
      </div>

      <h2 className="font-bold mb-3">Resolved</h2>
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs uppercase text-gray-500 bg-gray-50">
              <th className="table-cell">When</th>
              <th className="table-cell">Pallet</th>
              <th className="table-cell">Buyer</th>
              <th className="table-cell">Offer</th>
              <th className="table-cell">Status</th>
            </tr>
          </thead>
          <tbody>
            {resolved.map((o) => (
              <tr key={o.id}>
                <td className="table-cell text-xs">{new Date(o.createdAt).toLocaleDateString()}</td>
                <td className="table-cell text-xs">{o.pallet.sku}</td>
                <td className="table-cell text-xs">{o.customerName}</td>
                <td className="table-cell text-xs">${o.offerPrice.toLocaleString()}</td>
                <td className="table-cell">
                  <span className={`text-xs px-2 py-1 rounded ${o.status === "ACCEPTED" ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"}`}>{o.status}</span>
                </td>
              </tr>
            ))}
            {resolved.length === 0 && <tr><td colSpan={5} className="table-cell text-center text-gray-500">Nothing resolved yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
