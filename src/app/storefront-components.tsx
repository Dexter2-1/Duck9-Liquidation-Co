"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStorefront } from "@/lib/storefrontContext";

function money(n: number) {
  return "$" + Math.round(n).toLocaleString();
}

export function StorefrontHeader({ search, onSearchChange }: { search?: string; onSearchChange?: (v: string) => void }) {
  const { cart, setDrawerOpen } = useStorefront();
  const router = useRouter();
  const totalQty = cart.reduce((a, c) => a + c.qty, 0);
  const [localSearch, setLocalSearch] = useState("");

  return (
    <header className="sf-header">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      <div className="sf-nav sf-wrap">
        <a href="/" className="sf-logo">
          <img src="/logo-icon.png" alt="Dock9" className="sf-logo-icon" />
          <div>
            <div className="big">DOCK<span>9</span></div>
            <div className="sub">Liquidation Co.</div>
          </div>
        </a>
        <nav className="sf-links">
          <a href="/#board">Load Board</a>
          <a href="/#how">How It Works</a>
          <a href="/#faq">FAQ</a>
          <a href="/#contact">Contact</a>
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="sf-search">
            <input
              type="text"
              placeholder="Search loads…"
              value={onSearchChange ? search : localSearch}
              onChange={(e) => (onSearchChange ? onSearchChange(e.target.value) : setLocalSearch(e.target.value))}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                const q = onSearchChange ? search : localSearch;
                if (onSearchChange) {
                  document.getElementById("board")?.scrollIntoView({ behavior: "smooth" });
                } else {
                  router.push(`/?search=${encodeURIComponent(q || "")}#board`);
                }
              }}
            />
          </div>
          <button className="sf-cart-btn" onClick={() => setDrawerOpen(true)}>
            Your Load <span className="sf-cart-count sf-mono">{totalQty}</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export function StorefrontFooter() {
  const { settings } = useStorefront();
  return (
    <footer className="sf-footer" id="contact">
      <div className="sf-wrap">
        <div className="sf-foot-grid">
          <div>
            <h5>{settings?.companyName || "Dock9 Liquidation Co."}</h5>
            <p>Sourcing and reselling manifested liquidation pallets from major retail returns centers.</p>
            <p>{settings?.headquartersAddress}</p>
          </div>
          <div>
            <h5>Warehouses</h5>
            {settings?.warehouses.map((w, i) => <p key={i}>{w.label}</p>)}
          </div>
          <div>
            <h5>Contact</h5>
            <a href={`mailto:${settings?.supportEmail}`}>{settings?.supportEmail}</a>
            <a href={`tel:${settings?.supportPhone}`}>{settings?.supportPhone}</a>
            <p>{settings?.hoursText}</p>
          </div>
        </div>
        <div className="sf-foot-links">
          <a href="/shipping">Shipping</a>
          <a href="/refunds">Refunds</a>
          <a href="/terms">Terms</a>
        </div>
        <div className="sf-fine">
          Photos are representative of typical pallet condition, not the exact contents of any single load. All sales final. © 2026 {settings?.companyName || "Dock9 Liquidation Co."}
        </div>
      </div>
    </footer>
  );
}

export function CartDrawer() {
  const { cart, changeQty, removeItem, drawerOpen, setDrawerOpen } = useStorefront();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const totalQty = cart.reduce((a, c) => a + c.qty, 0);
  const totalWeight = cart.reduce((a, c) => a + c.weightLbs * c.qty, 0);
  const subtotal = cart.reduce((a, c) => a + c.price * c.qty, 0);

  return (
    <>
      <div
        className={`sf-overlay ${drawerOpen || checkoutOpen ? "show" : ""}`}
        onClick={() => { setDrawerOpen(false); setCheckoutOpen(false); }}
      />
      <div className={`sf-drawer ${drawerOpen ? "open" : ""}`}>
        <div className="sf-drawer-head"><h3>Your Load</h3><button className="sf-close-x" onClick={() => setDrawerOpen(false)}>&times;</button></div>
        <div className="sf-drawer-body">
          {cart.length === 0 ? (
            <div className="sf-empty-cart">Your load is empty. Add a pallet from the load board to get started.</div>
          ) : cart.map((c) => (
            <div className="sf-cart-item" key={c.id}>
              <div style={{ flex: 1 }}>
                <div className="sf-ci-title">{c.title}</div>
                <div className="sf-ci-load sf-mono">LOAD #{c.sku} · {money(c.price)}</div>
                <div className="sf-qty-row">
                  <button className="sf-qty-btn" onClick={() => changeQty(c.id, -1)}>−</button>
                  <span className="sf-mono">{c.qty}</span>
                  <button className="sf-qty-btn" onClick={() => changeQty(c.id, 1)} disabled={c.qty >= c.quantityAvailable}>+</button>
                </div>
                <button className="sf-ci-remove" onClick={() => removeItem(c.id)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
        {cart.length > 0 && (
          <div className="sf-drawer-foot">
            <div className="sf-sum-row"><span>Pallets</span><span>{totalQty}</span></div>
            <div className="sf-sum-row"><span>Est. total weight</span><span>{totalWeight.toLocaleString()} lbs</span></div>
            <div className="sf-sum-row total"><span>Subtotal</span><span>{money(subtotal)}</span></div>
            <button className="sf-modal-btn" onClick={() => { setDrawerOpen(false); setCheckoutOpen(true); }}>Proceed to Dispatch</button>
          </div>
        )}
      </div>
      {checkoutOpen && <CheckoutFlow onClose={() => setCheckoutOpen(false)} />}
    </>
  );
}

function CheckoutFlow({ onClose }: { onClose: () => void }) {
  const { cart, settings, clearCart } = useStorefront();
  const [confirmData, setConfirmData] = useState<{ orderNumber: string; total: number; method: string; discountAmount: number } | null>(null);
  const [deliveryMode, setDeliveryMode] = useState<"delivery" | "pickup">("delivery");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", address: "", warehouse: "" });

  const subtotal = cart.reduce((a, c) => a + c.price * c.qty, 0);
  const qualifiesForDiscount = settings?.paymentDiscountEnabled && subtotal >= (settings?.paymentDiscountThreshold ?? Infinity);
  const estDiscount = qualifiesForDiscount ? subtotal * ((settings?.paymentDiscountPercent ?? 0) / 100) : 0;

  async function submitOrder(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    const res = await fetch("/api/public/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cart.map((c) => ({ palletId: c.id, qty: c.qty })),
        customer: form,
        fulfillment: { mode: deliveryMode, address: form.address, warehouse: form.warehouse },
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) { setSubmitError(data.error || "Something went wrong."); return; }
    setConfirmData({
      orderNumber: data.orderNumber,
      total: data.totalPrice,
      discountAmount: data.discountAmount || 0,
      method: deliveryMode === "delivery" ? "Freight Delivery" : "Dock Pickup",
    });
    clearCart();
  }

  if (confirmData) {
    return (
      <div className="sf-modal">
        <div className="sf-modal-card">
          <div className="sf-confirm-icon">✓</div>
          <h3>Order received</h3>
          <p className="sf-modal-sub">Your load is reserved. An invoice has been emailed to you and to our team.</p>
          <div className="sf-order-box">
            <div><span>Order #</span><span>{confirmData.orderNumber}</span></div>
            {confirmData.discountAmount > 0 && <div><span>Discount applied</span><span>-{money(confirmData.discountAmount)}</span></div>}
            <div><span>Amount due</span><span>{money(confirmData.total)}</span></div>
            <div><span>Fulfillment</span><span>{confirmData.method}</span></div>
          </div>
          <div className="sf-modal-note"><b>How to pay:</b> {settings?.paymentInstructions}</div>
          <button className="sf-modal-btn" onClick={onClose}>Back to Load Board</button>
        </div>
      </div>
    );
  }

  return (
    <div className="sf-modal">
      <div className="sf-modal-card">
        <h3>Dispatch Order</h3>
        <p className="sf-modal-sub">Load #{cart.reduce((a, c) => a + c.qty, 0)} pallet(s) — confirm delivery details below.</p>

        {qualifiesForDiscount && (
          <div className="sf-modal-note" style={{ background: "#EAF7EC", color: "#166534" }}>
            🎉 You qualify for {settings?.paymentDiscountPercent}% off (~{money(estDiscount)}) since we only accept manual payment methods — no card processing fees means savings for you.
          </div>
        )}

        <div className="sf-delivery-toggle">
          <button type="button" className={`sf-dt-btn ${deliveryMode === "delivery" ? "active" : ""}`} onClick={() => setDeliveryMode("delivery")}>Freight Delivery</button>
          <button type="button" className={`sf-dt-btn ${deliveryMode === "pickup" ? "active" : ""}`} onClick={() => setDeliveryMode("pickup")}>Dock Pickup</button>
        </div>
        <form onSubmit={submitOrder}>
          <div className="sf-field-row">
            <div className="sf-field"><label>First name</label><input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></div>
            <div className="sf-field"><label>Last name</label><input required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></div>
          </div>
          <div className="sf-field"><label>Email</label><input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div className="sf-field"><label>Phone</label><input type="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          {deliveryMode === "delivery" ? (
            <div className="sf-field"><label>Delivery address</label><input required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          ) : (
            <div className="sf-field">
              <label>Pickup warehouse</label>
              <select value={form.warehouse} onChange={(e) => setForm({ ...form, warehouse: e.target.value })}>
                <option value="">Select a warehouse…</option>
                {settings?.warehouses.map((w, i) => <option key={i} value={w.label}>{w.label}</option>)}
              </select>
            </div>
          )}
          <div className="sf-modal-note">No payment is collected here. You'll get payment instructions by email once you submit.</div>
          {submitError && <div style={{ color: "#C0392B", fontSize: 13, marginBottom: 12 }}>{submitError}</div>}
          <button type="submit" className="sf-modal-btn" disabled={submitting}>{submitting ? "Submitting…" : "Reserve My Load"}</button>
          <button type="button" className="sf-modal-cancel" onClick={onClose}>Back to Your Load</button>
        </form>
      </div>
    </div>
  );
}

export function AnnouncementBar() {
  const { settings } = useStorefront();
  if (!settings?.announcementBarText) return null;
  return (
    <div style={{ background: "#F4B400", color: "#17181A", textAlign: "center", fontSize: 13, fontWeight: 600, padding: "8px 16px" }}>
      {settings.announcementBarText}
    </div>
  );
}

export function WhatsAppButton() {
  const { settings } = useStorefront();
  if (!settings?.whatsappNumber) return null;
  const digits = settings.whatsappNumber.replace(/[^\d]/g, "");
  return (
    <a
      href={`https://wa.me/${digits}`}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        position: "fixed", bottom: 24, right: 24, zIndex: 80,
        background: "#25D366", color: "#fff", width: 56, height: 56, borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
      }}
      aria-label="Chat on WhatsApp"
    >
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    </a>
  );
}

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const res = await fetch("/api/public/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setStatus(res.ok ? "done" : "error");
  }

  return (
    <section className="sf-section sf-section-alt">
      <div className="sf-wrap" style={{ textAlign: "center", maxWidth: 560 }}>
        <h2 style={{ marginBottom: 8 }}>Stay Ahead in Wholesale Liquidation</h2>
        <p style={{ color: "#9A9C9F", marginBottom: 20, fontSize: 14.5 }}>Get an email when new loads hit the board — no spam, just fresh inventory alerts.</p>
        {status === "done" ? (
          <p style={{ color: "#4C9A5B" }}>You're subscribed — thanks!</p>
        ) : (
          <form onSubmit={submit} style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <input
              type="email" required placeholder="you@example.com" value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ padding: "12px 16px", borderRadius: 2, border: "1px solid #43464C", background: "#2B2E33", color: "#fff", minWidth: 240 }}
            />
            <button type="submit" className="sf-btn sf-btn-primary" disabled={status === "sending"}>
              {status === "sending" ? "Subscribing…" : "Subscribe"}
            </button>
          </form>
        )}
        {status === "error" && <p style={{ color: "#C0392B", marginTop: 10, fontSize: 13 }}>Something went wrong — try again.</p>}
      </div>
    </section>
  );
}

export { money };
