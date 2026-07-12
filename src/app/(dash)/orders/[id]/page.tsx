"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [form, setForm] = useState<any>(null);
  const [qtyEdits, setQtyEdits] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);

  async function load() {
    const res = await fetch(`/api/orders/${id}`);
    const data = await res.json();
    setOrder(data);
    setForm({
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone || "",
      fulfillmentMode: data.fulfillmentMode,
      deliveryAddress: data.deliveryAddress || "",
      pickupWarehouse: data.pickupWarehouse || "",
    });
    const qe: Record<string, string> = {};
    data.items.forEach((i: any) => { qe[i.id] = String(i.quantity); });
    setQtyEdits(qe);
  }
  useEffect(() => { load(); }, [id]);

  if (!order || !form) return <div>Loading…</div>;

  async function saveDetails() {
    setMessage(""); setError("");
    const res = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) { setMessage("Order details saved."); load(); } else { setError(data.error); }
  }

  async function saveItems() {
    setMessage(""); setError("");
    const updates = order.items
      .filter((i: any) => qtyEdits[i.id] !== undefined && parseInt(qtyEdits[i.id]) !== i.quantity)
      .map((i: any) => ({ orderItemId: i.id, quantity: qtyEdits[i.id] }));

    if (updates.length === 0) { setMessage("No quantity changes to save."); return; }

    const res = await fetch(`/api/orders/${id}/items`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates, removeIds: [] }),
    });
    const data = await res.json();
    if (res.ok) { setMessage("Item quantities updated."); load(); } else { setError(data.error); }
  }

  async function removeItem(itemId: string) {
    if (order.items.length <= 1) {
      setError("Can't remove the last item — cancel the order instead if you want to remove everything.");
      return;
    }
    if (!confirm("Remove this pallet from the order? Its stock will be released back to the load board.")) return;
    setMessage(""); setError("");
    const res = await fetch(`/api/orders/${id}/items`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates: [], removeIds: [itemId] }),
    });
    const data = await res.json();
    if (res.ok) { setMessage("Item removed."); load(); } else { setError(data.error); }
  }

  async function cancelOrder() {
    const reason = prompt("Optional: reason for cancelling (shown in the activity log and customer email)") || "";
    if (!confirm("Cancel this order? Stock will be released back to the load board and the customer will be emailed.")) return;
    setCancelling(true);
    const res = await fetch(`/api/orders/${id}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    setCancelling(false);
    if (res.ok) { load(); } else { const data = await res.json(); setError(data.error); }
  }

  const isCancelled = order.status === "CANCELLED";

  return (
    <div className="max-w-3xl">
      <button className="text-xs underline mb-4" onClick={() => router.push("/orders")}>&larr; Back to Orders</button>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">{order.orderNumber}</h1>
          <div className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleString()}</div>
        </div>
        <div className="flex gap-2">
          <span className={`text-xs px-2 py-1 rounded ${order.paymentStatus === "PAID" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{order.paymentStatus}</span>
          <span className={`text-xs px-2 py-1 rounded ${isCancelled ? "bg-gray-300 text-gray-700" : order.status === "SHIPPED" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-800"}`}>{order.status}</span>
        </div>
      </div>

      {message && <div className="card p-3 mb-4 text-sm text-green-700">{message}</div>}
      {error && <div className="card p-3 mb-4 text-sm text-red-600">{error}</div>}
      {isCancelled && <div className="card p-3 mb-4 text-sm bg-gray-50">This order is cancelled. Stock has been released. Fields are read-only.</div>}

      <div className="card p-5 mb-6">
        <h2 className="font-bold mb-3">Customer & fulfillment</h2>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs font-semibold uppercase mb-1">Name</label>
            <input className="input" disabled={isCancelled} value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase mb-1">Email</label>
            <input className="input" disabled={isCancelled} value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase mb-1">Phone</label>
            <input className="input" disabled={isCancelled} value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase mb-1">Fulfillment</label>
            <select className="input" disabled={isCancelled} value={form.fulfillmentMode} onChange={(e) => setForm({ ...form, fulfillmentMode: e.target.value })}>
              <option value="delivery">Delivery</option>
              <option value="pickup">Pickup</option>
            </select>
          </div>
        </div>
        {form.fulfillmentMode === "delivery" ? (
          <div className="mb-3">
            <label className="block text-xs font-semibold uppercase mb-1">Delivery address</label>
            <input className="input" disabled={isCancelled} value={form.deliveryAddress} onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })} />
          </div>
        ) : (
          <div className="mb-3">
            <label className="block text-xs font-semibold uppercase mb-1">Pickup warehouse</label>
            <input className="input" disabled={isCancelled} value={form.pickupWarehouse} onChange={(e) => setForm({ ...form, pickupWarehouse: e.target.value })} />
          </div>
        )}
        {!isCancelled && <button className="btn btn-primary" onClick={saveDetails}>Save details</button>}
      </div>

      <div className="card p-5 mb-6">
        <h2 className="font-bold mb-3">Items</h2>
        <table className="w-full mb-3">
          <thead>
            <tr className="text-left text-xs uppercase text-gray-500">
              <th className="table-cell">Pallet</th>
              <th className="table-cell">Price</th>
              <th className="table-cell">Qty</th>
              <th className="table-cell">Line total</th>
              <th className="table-cell"></th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((i: any) => (
              <tr key={i.id}>
                <td className="table-cell text-sm">{i.pallet.title}<br /><span className="text-xs text-gray-500 font-mono">{i.pallet.sku}</span></td>
                <td className="table-cell text-sm">${i.price.toLocaleString()}</td>
                <td className="table-cell">
                  <input
                    type="number" min="1" className="input w-16 text-sm" disabled={isCancelled}
                    value={qtyEdits[i.id] ?? i.quantity}
                    onChange={(e) => setQtyEdits({ ...qtyEdits, [i.id]: e.target.value })}
                  />
                </td>
                <td className="table-cell text-sm">${(i.price * i.quantity).toLocaleString()}</td>
                <td className="table-cell">
                  {!isCancelled && <button className="text-xs text-red-600 underline" onClick={() => removeItem(i.id)}>Remove</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isCancelled && <button className="btn btn-outline text-sm" onClick={saveItems}>Save quantity changes</button>}

        <div className="border-t border-gray-100 mt-4 pt-4 text-sm space-y-1">
          <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>${order.subtotal.toLocaleString()}</span></div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between"><span className="text-gray-500">{order.discountReason || "Discount"}</span><span>-${order.discountAmount.toLocaleString()}</span></div>
          )}
          <div className="flex justify-between font-bold text-base"><span>Total</span><span>${order.totalPrice.toLocaleString()}</span></div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <a className="btn btn-outline text-sm" href={`/api/orders/${id}/invoice`} target="_blank" rel="noopener noreferrer">Download invoice</a>
        {!isCancelled && (
          <button className="btn text-sm bg-red-600 text-white" disabled={cancelling} onClick={cancelOrder}>
            {cancelling ? "Cancelling…" : "Cancel order"}
          </button>
        )}
      </div>
    </div>
  );
}
