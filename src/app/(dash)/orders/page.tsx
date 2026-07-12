"use client";
import { useEffect, useState } from "react";

function hoursWaiting(createdAt: string) {
  return (Date.now() - new Date(createdAt).getTime()) / 36e5;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  async function load() {
    const res = await fetch("/api/orders");
    setOrders(await res.json());
  }
  useEffect(() => {
    load();
    const t = setInterval(load, 60000); // refresh timers every minute
    return () => clearInterval(t);
  }, []);

  function toggle(id: string) {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  }

  async function bulkShip() {
    if (selected.size === 0) return;
    const res = await fetch("/api/orders/bulk-ship", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selected) }),
    });
    const data = await res.json();
    setMessage(`Marked ${data.count} order(s) shipped and generated labels. Tracking emails would be sent now.`);
    setSelected(new Set());
    load();
  }

  async function markShipped(id: string) {
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "SHIPPED" }),
    });
    load();
  }

  async function markPaid(id: string) {
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentStatus: "PAID" }),
    });
    load();
  }

  function printLabels() {
    window.print();
  }

  const filtered = orders.filter((o) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerEmail.toLowerCase().includes(q) ||
      o.items.some((i: any) => i.pallet.sku.toLowerCase().includes(q))
    );
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Orders</h1>

      <div className="card p-4 mb-4 flex items-center gap-3 flex-wrap">
        <span className="text-sm font-semibold">{selected.size} selected</span>
        <button className="btn btn-primary" onClick={bulkShip}>Mark shipped + generate labels</button>
        <button className="btn btn-outline" onClick={printLabels}>Print labels</button>
        <input
          className="input w-auto ml-auto"
          placeholder="Search order #, customer, SKU…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {message && <span className="text-sm text-gray-600 w-full">{message}</span>}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs uppercase text-gray-500 bg-gray-50">
              <th className="table-cell"><input type="checkbox" onChange={() => setSelected(selected.size === orders.length ? new Set() : new Set(orders.map((o) => o.id)))} /></th>
              <th className="table-cell">Order #</th>
              <th className="table-cell">Customer</th>
              <th className="table-cell">Pallets</th>
              <th className="table-cell">Total</th>
              <th className="table-cell">Waiting</th>
              <th className="table-cell">Payment</th>
              <th className="table-cell">Status</th>
              <th className="table-cell">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => {
              const hrs = hoursWaiting(o.createdAt);
              const urgent = o.status === "PENDING" && hrs > 24;
              const isCancelled = o.status === "CANCELLED";
              return (
                <tr key={o.id} className={isCancelled ? "opacity-50" : ""}>
                  <td className="table-cell"><input type="checkbox" checked={selected.has(o.id)} onChange={() => toggle(o.id)} /></td>
                  <td className="table-cell font-mono text-xs">
                    <a href={`/orders/${o.id}`} className="underline">{o.orderNumber}</a>
                  </td>
                  <td className="table-cell">{o.customerName}</td>
                  <td className="table-cell text-xs">{o.items.map((i: any) => `${i.pallet.sku}${i.quantity > 1 ? ` ×${i.quantity}` : ""}`).join(", ")}</td>
                  <td className="table-cell">${o.totalPrice.toLocaleString()}</td>
                  <td className="table-cell">
                    {o.status === "PENDING" ? (
                      <span className={urgent ? "text-red-600 font-semibold" : "text-gray-600"}>
                        {Math.floor(hrs)}h {urgent ? "— URGENT" : ""}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="table-cell">
                    <span className={`text-xs px-2 py-1 rounded ${o.paymentStatus === "PAID" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{o.paymentStatus}</span>
                  </td>
                  <td className="table-cell">
                    <span className={`text-xs px-2 py-1 rounded ${isCancelled ? "bg-gray-300 text-gray-700" : o.status === "SHIPPED" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-800"}`}>{o.status}</span>
                  </td>
                  <td className="table-cell">
                    <div className="flex flex-col gap-1">
                      <a className="text-xs underline" href={`/orders/${o.id}`}>Edit</a>
                      <a className="text-xs underline" href={`/api/orders/${o.id}/invoice`} target="_blank" rel="noopener noreferrer">Download invoice</a>
                      {!isCancelled && o.paymentStatus !== "PAID" && (
                        <button className="text-xs underline" onClick={() => markPaid(o.id)}>Mark paid</button>
                      )}
                      {!isCancelled && o.status === "PENDING" && (
                        <button className="text-xs underline" onClick={() => markShipped(o.id)}>Mark shipped</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="table-cell text-center text-gray-500">No orders match "{search}".</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
