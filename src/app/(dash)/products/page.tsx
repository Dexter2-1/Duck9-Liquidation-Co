"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Pallet = {
  id: string; sku: string; title: string; category: string; price: number; floorPrice: number;
  status: string; condition: string; binLocation: string | null; imageUrl: string | null;
};

export default function ProductsPage() {
  const [pallets, setPallets] = useState<Pallet[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState("adjustPricePct");
  const [bulkValue, setBulkValue] = useState("");
  const [message, setMessage] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");

  async function load() {
    const res = await fetch("/api/products");
    setPallets(await res.json());
  }
  useEffect(() => { load(); }, []);

  function toggle(id: string) {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  }
  function toggleAll() {
    setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map((p) => p.id)));
  }

  async function runBulk() {
    if (selected.size === 0) return;
    const res = await fetch("/api/products/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selected), action: bulkAction, value: bulkValue }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage(`Updated ${data.updated} pallet(s).${data.skipped?.length ? ` Skipped (below floor price): ${data.skipped.join(", ")}` : ""}`);
      setSelected(new Set());
      load();
    } else {
      setMessage(data.error || "Bulk action failed.");
    }
  }

  async function toggleHidden(p: Pallet) {
    const newStatus = p.status === "HIDDEN" ? "ACTIVE" : "HIDDEN";
    await fetch(`/api/products/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    load();
  }

  const filtered = pallets.filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return p.sku.toLowerCase().includes(q) || p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <button className="btn btn-yellow" onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? "Cancel" : "+ Quick Add Pallet"}
        </button>
      </div>

      {showAdd && <QuickAdd onDone={() => { setShowAdd(false); load(); }} />}

      <div className="card p-4 mb-4 flex flex-wrap items-center gap-3">
        <span className="text-sm font-semibold">{selected.size} selected</span>
        <select className="input w-auto" value={bulkAction} onChange={(e) => setBulkAction(e.target.value)}>
          <option value="adjustPricePct">Adjust price by %</option>
          <option value="setPrice">Set exact price</option>
          <option value="setCategory">Set category</option>
          <option value="setStatus">Set status</option>
          <option value="appendDescription">Append to description</option>
        </select>
        <input
          className="input w-auto"
          placeholder={bulkAction === "adjustPricePct" ? "e.g. 5 or -10" : "value"}
          value={bulkValue}
          onChange={(e) => setBulkValue(e.target.value)}
        />
        <button className="btn btn-primary" onClick={runBulk}>Apply to selected</button>
        <input
          className="input w-auto ml-auto"
          placeholder="Search SKU, title, category…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {message && <span className="text-sm text-gray-600 w-full">{message}</span>}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs uppercase text-gray-500 bg-gray-50">
              <th className="table-cell"><input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} /></th>
              <th className="table-cell">Photo</th>
              <th className="table-cell">SKU</th>
              <th className="table-cell">Title</th>
              <th className="table-cell">Category</th>
              <th className="table-cell">Condition</th>
              <th className="table-cell">Bin</th>
              <th className="table-cell">Price</th>
              <th className="table-cell">Status</th>
              <th className="table-cell">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td className="table-cell"><input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} /></td>
                <td className="table-cell">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt="" className="w-12 h-12 object-cover rounded" />
                  ) : (
                    <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center text-[9px] text-gray-400 text-center leading-tight">No photo</div>
                  )}
                </td>
                <td className="table-cell font-mono text-xs">{p.sku}</td>
                <td className="table-cell">
                  <Link href={`/products/${p.id}`} className="underline">{p.title}</Link>
                </td>
                <td className="table-cell">{p.category}</td>
                <td className="table-cell text-xs">{p.condition.replace("_", " ")}</td>
                <td className="table-cell text-xs">{p.binLocation || "—"}</td>
                <td className="table-cell">${p.price.toLocaleString()}</td>
                <td className="table-cell">
                  <span className={`text-xs px-2 py-1 rounded ${p.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"}`}>
                    {p.status}
                  </span>
                </td>
                <td className="table-cell">
                  <button className="text-xs underline" onClick={() => toggleHidden(p)}>
                    {p.status === "HIDDEN" ? "Unhide" : "Hide"}
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="table-cell text-center text-gray-500">No pallets match "{search}".</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function QuickAdd({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState({ sku: "", title: "", category: "General", weightLbs: "", cost: "", price: "", compareAtPrice: "", floorPrice: "", binLocation: "", imageUrl: "" });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    onDone();
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/uploads", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);
    if (res.ok) setForm((f) => ({ ...f, imageUrl: data.url }));
    else setUploadError(data.error);
    e.target.value = "";
  }

  return (
    <form onSubmit={submit} className="card p-5 mb-4 grid grid-cols-3 gap-3">
      <input className="input" placeholder="SKU (e.g. DK-2400)" required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
      <input className="input col-span-2" placeholder="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      <input className="input" placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
      <input className="input" placeholder="Weight (lbs)" required value={form.weightLbs} onChange={(e) => setForm({ ...form, weightLbs: e.target.value })} />
      <input className="input" placeholder="Bin location" value={form.binLocation} onChange={(e) => setForm({ ...form, binLocation: e.target.value })} />
      <input className="input" placeholder="Cost" required value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
      <input className="input" placeholder="Listed price" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
      <input className="input" placeholder="Was price (optional — shows a Sale badge)" value={form.compareAtPrice} onChange={(e) => setForm({ ...form, compareAtPrice: e.target.value })} />
      <input className="input" placeholder="Floor price (min)" value={form.floorPrice} onChange={(e) => setForm({ ...form, floorPrice: e.target.value })} />
      <div className="col-span-3 flex items-center gap-3">
        <input type="file" accept="image/*" onChange={handleFileUpload} disabled={uploading} className="text-sm" />
        {uploading && <span className="text-xs text-gray-500">Uploading…</span>}
        {form.imageUrl && !uploading && <img src={form.imageUrl} alt="" className="w-10 h-10 object-cover rounded" />}
      </div>
      {uploadError && <p className="col-span-3 text-xs text-red-600">{uploadError}</p>}
      <input className="input col-span-3" placeholder="Or paste a photo URL instead" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
      <button className="btn btn-primary col-span-3" type="submit">Add pallet</button>
    </form>
  );
}
