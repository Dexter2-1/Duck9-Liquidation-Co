"use client";
import { useEffect, useState } from "react";

type Warehouse = { label: string; address: string };

export default function SettingsPage() {
  const [form, setForm] = useState<any>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [saved, setSaved] = useState(false);

  async function load() {
    const res = await fetch("/api/settings");
    const data = await res.json();
    setForm(data);
    setWarehouses(data.warehouses);
  }
  useEffect(() => { load(); }, []);

  if (!form) return <div>Loading…</div>;

  function updateField(key: string, value: string | number | boolean) {
    setForm({ ...form, [key]: value });
    setSaved(false);
  }
  function updateWarehouse(i: number, key: keyof Warehouse, value: string) {
    const next = [...warehouses];
    next[i] = { ...next[i], [key]: value };
    setWarehouses(next);
    setSaved(false);
  }
  function addWarehouse() {
    setWarehouses([...warehouses, { label: "", address: "" }]);
  }
  function removeWarehouse(i: number) {
    setWarehouses(warehouses.filter((_, idx) => idx !== i));
  }

  async function save() {
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyName: form.companyName,
        tagline: form.tagline,
        supportEmail: form.supportEmail,
        supportPhone: form.supportPhone,
        hoursText: form.hoursText,
        headquartersAddress: form.headquartersAddress,
        whatsappNumber: form.whatsappNumber,
        announcementBarText: form.announcementBarText,
        adminNotificationEmail: form.adminNotificationEmail,
        adminNotificationPhone: form.adminNotificationPhone,
        paymentInstructions: form.paymentInstructions,
        paymentDiscountEnabled: form.paymentDiscountEnabled,
        paymentDiscountThreshold: form.paymentDiscountThreshold,
        paymentDiscountPercent: form.paymentDiscountPercent,
        shippingPolicy: form.shippingPolicy,
        refundsPolicy: form.refundsPolicy,
        termsPolicy: form.termsPolicy,
        warehouses,
      }),
    });
    if (res.ok) setSaved(true);
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">Site Settings</h1>
      <p className="text-sm text-gray-500 mb-6">
        These fields are shown live on the public storefront — footer address, contact info, and hero tagline.
      </p>

      <div className="card p-5 mb-6 space-y-4">
        <h2 className="font-bold">Company & contact</h2>
        <div>
          <label className="block text-xs font-semibold uppercase mb-1">Company name</label>
          <input className="input" value={form.companyName} onChange={(e) => updateField("companyName", e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase mb-1">Hero tagline</label>
          <input className="input" value={form.tagline} onChange={(e) => updateField("tagline", e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase mb-1">Support email</label>
            <input className="input" value={form.supportEmail} onChange={(e) => updateField("supportEmail", e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase mb-1">Support phone</label>
            <input className="input" value={form.supportPhone} onChange={(e) => updateField("supportPhone", e.target.value)} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase mb-1">Hours text</label>
          <input className="input" value={form.hoursText} onChange={(e) => updateField("hoursText", e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase mb-1">Headquarters address</label>
          <input className="input" value={form.headquartersAddress} onChange={(e) => updateField("headquartersAddress", e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase mb-1">WhatsApp number (optional)</label>
          <input className="input" placeholder="+17045550139" value={form.whatsappNumber || ""} onChange={(e) => updateField("whatsappNumber", e.target.value)} />
          <p className="text-xs text-gray-500 mt-1">Adds a floating "Chat on WhatsApp" button to the storefront. Leave blank to hide it.</p>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase mb-1">Announcement bar text (optional)</label>
          <input className="input" placeholder="e.g. Call or text us to order — bulk buyers ask about wire transfer terms." value={form.announcementBarText || ""} onChange={(e) => updateField("announcementBarText", e.target.value)} />
          <p className="text-xs text-gray-500 mt-1">Shows as a thin bar above the header. Leave blank to hide it.</p>
        </div>
      </div>

      <div className="card p-5 mb-6 space-y-4">
        <h2 className="font-bold">Payments</h2>
        <p className="text-sm text-gray-500">Orders are not charged automatically — customers pay you manually (Zelle, Venmo, Chime, Apple Pay, or Cash App) after checkout, based on the instructions below.</p>
        <div>
          <label className="block text-xs font-semibold uppercase mb-1">Admin notification email</label>
          <input className="input" value={form.adminNotificationEmail} onChange={(e) => updateField("adminNotificationEmail", e.target.value)} />
          <p className="text-xs text-gray-500 mt-1">Every new order is emailed here.</p>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase mb-1">Admin notification phone (SMS alerts)</label>
          <input className="input" placeholder="+17045550139" value={form.adminNotificationPhone || ""} onChange={(e) => updateField("adminNotificationPhone", e.target.value)} />
          <p className="text-xs text-gray-500 mt-1">Optional. Use full international format (e.g. +1 for US). Leave blank to skip SMS and only get emails.</p>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase mb-1">Payment instructions (shown to customers after checkout)</label>
          <textarea className="input min-h-[90px]" value={form.paymentInstructions} onChange={(e) => updateField("paymentInstructions", e.target.value)} />
        </div>

        <div className="border-t border-gray-100 pt-4">
          <label className="flex items-center gap-2 mb-3">
            <input type="checkbox" checked={form.paymentDiscountEnabled} onChange={(e) => updateField("paymentDiscountEnabled", e.target.checked)} />
            <span className="text-sm font-semibold">Offer a discount for manual payment on larger orders</span>
          </label>
          <p className="text-xs text-gray-500 mb-3">Since Zelle/Cash App/etc. cost you nothing in card processing fees, you can pass some of that savings to buyers on orders over a threshold. Applied automatically at checkout — customers see it before they submit.</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase mb-1">Order subtotal threshold ($)</label>
              <input type="number" className="input" value={form.paymentDiscountThreshold} onChange={(e) => updateField("paymentDiscountThreshold", parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase mb-1">Discount (%)</label>
              <input type="number" className="input" value={form.paymentDiscountPercent} onChange={(e) => updateField("paymentDiscountPercent", parseFloat(e.target.value) || 0)} />
            </div>
          </div>
        </div>
      </div>

      <div className="card p-5 mb-6 space-y-4">
        <h2 className="font-bold">Policy pages</h2>
        <p className="text-sm text-gray-500">Shown at /shipping, /refunds, and /terms, linked from the storefront footer.</p>
        <div>
          <label className="block text-xs font-semibold uppercase mb-1">Shipping policy</label>
          <textarea className="input min-h-[100px]" value={form.shippingPolicy} onChange={(e) => updateField("shippingPolicy", e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase mb-1">Refunds policy</label>
          <textarea className="input min-h-[100px]" value={form.refundsPolicy} onChange={(e) => updateField("refundsPolicy", e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase mb-1">Terms & conditions</label>
          <textarea className="input min-h-[100px]" value={form.termsPolicy} onChange={(e) => updateField("termsPolicy", e.target.value)} />
        </div>
      </div>

      <div className="card p-5 mb-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="font-bold">Warehouse locations</h2>
          <button className="btn btn-outline text-xs" onClick={addWarehouse}>+ Add warehouse</button>
        </div>
        {warehouses.map((w, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-3 items-end border-b border-gray-100 pb-3">
            <div>
              <label className="block text-xs font-semibold uppercase mb-1">Label</label>
              <input className="input" value={w.label} onChange={(e) => updateWarehouse(i, "label", e.target.value)} placeholder="e.g. Charlotte, NC — Dock A" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase mb-1">Address</label>
              <input className="input" value={w.address} onChange={(e) => updateWarehouse(i, "address", e.target.value)} />
            </div>
            <button className="text-xs text-red-600 underline mb-2" onClick={() => removeWarehouse(i)}>Remove</button>
          </div>
        ))}
      </div>

      <button className="btn btn-primary" onClick={save}>Save settings</button>
      {saved && <span className="ml-3 text-sm text-green-700">Saved — live on the storefront now.</span>}
    </div>
  );
}
