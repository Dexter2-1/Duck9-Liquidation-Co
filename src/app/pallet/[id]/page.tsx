"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import "../../storefront.css";
import { useStorefront } from "@/lib/storefrontContext";
import { StorefrontHeader, StorefrontFooter, CartDrawer, AnnouncementBar, WhatsAppButton, money } from "../../storefront-components";

const conditionMeta: Record<string, { label: string; stamp: string }> = {
  AS_IS: { label: "As-Is", stamp: "sf-stamp-returns" },
  MINOR_SCRATCHES: { label: "Minor Scratches", stamp: "sf-stamp-shelf" },
  HEAVY_WEAR: { label: "Heavy Wear", stamp: "sf-stamp-returns" },
  LIKE_NEW: { label: "Like New", stamp: "sf-stamp-over" },
};

export default function PalletDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { cart, addToCart } = useStorefront();
  const [pallet, setPallet] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [offerOpen, setOfferOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/public/products/${id}`).then((r) => r.json()).then((data) => {
      setPallet(data);
      setActiveImage(data.imageUrl || null);
    });
    fetch(`/api/public/reviews?palletId=${id}`).then((r) => r.json()).then(setReviews);
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("offer") === "1") setOfferOpen(true);
    } catch {}
  }, [id]);

  if (!pallet) return <div className="sf-root" style={{ padding: 60 }}><StorefrontHeader /></div>;
  if (pallet.error) return <div className="sf-root" style={{ padding: 60, color: "#fff" }}><StorefrontHeader /><p style={{ padding: 24 }}>Pallet not found.</p></div>;

  const meta = conditionMeta[pallet.condition] || conditionMeta.AS_IS;
  const inCartQty = cart.find((c: any) => c.id === pallet.id)?.qty || 0;
  const maxedOut = inCartQty >= pallet.quantityAvailable;
  const gallery = [pallet.imageUrl, ...(pallet.images || [])].filter(Boolean);

  return (
    <div className="sf-root">
      <AnnouncementBar />
      <StorefrontHeader />

      <section className="sf-section" style={{ paddingTop: 40 }}>
        <div className="sf-wrap" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }}>
          <div>
            <div style={{ height: 340, background: "#E1DCCB", borderRadius: 4, overflow: "hidden", marginBottom: 12 }}>
              {activeImage ? (
                <img src={activeImage} alt={pallet.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#A39D8A" }}>No photo yet</div>
              )}
            </div>
            {gallery.length > 1 && (
              <div style={{ display: "flex", gap: 8 }}>
                {gallery.map((url: string, i: number) => (
                  <button key={i} onClick={() => setActiveImage(url)} style={{ width: 60, height: 60, border: activeImage === url ? "2px solid #F4B400" : "1px solid #43464C", borderRadius: 4, padding: 0, overflow: "hidden", background: "none" }}>
                    <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="sf-tag-top" style={{ padding: 0, marginBottom: 10 }}>
              <span className="sf-load-no">LOAD #{pallet.sku}</span>
              <span className={`sf-stamp ${meta.stamp}`}>{meta.label}</span>
            </div>
            <h1 style={{ fontSize: 30, marginBottom: 16 }}>{pallet.title}</h1>
            <div className="sf-manifest-lines" style={{ marginBottom: 16 }}>
              <div><span>Items</span><b>{pallet.itemsRange || "Varies"}</b></div>
              <div><span>Manifest weight</span><b>{pallet.weightLbs.toLocaleString()} lbs</b></div>
              <div><span>Location</span><b>{pallet.location || "—"}</b></div>
              <div><span>Category</span><b>{pallet.category}</b></div>
            </div>
            <div className="sf-price-row" style={{ marginBottom: 20 }}>
              <div>
                {pallet.compareAtPrice && pallet.compareAtPrice > pallet.price ? (
                  <>
                    <span className="sf-retail" style={{ fontSize: 16, display: "block", marginBottom: 4 }}>{money(pallet.compareAtPrice)}</span>
                    <div className="sf-price" style={{ fontSize: 36 }}>{money(pallet.price)}</div>
                  </>
                ) : (
                  <>
                    {pallet.retailValue && <div className="sf-retail" style={{ fontSize: 13, marginBottom: 4 }}>Retail value {money(pallet.retailValue)}</div>}
                    <div className="sf-price" style={{ fontSize: 36 }}>{money(pallet.price)}</div>
                  </>
                )}
              </div>
              {pallet.quantityAvailable <= 3 && <span className="sf-low-stock">Only {pallet.quantityAvailable} left</span>}
            </div>
            <button className="sf-add-btn" disabled={maxedOut} onClick={() => addToCart(pallet)}>
              {maxedOut ? "Max in Load" : "Add to Load"}
            </button>
            <button className="sf-offer-btn" onClick={() => setOfferOpen(true)}>Make an Offer</button>

            {pallet.description && (
              <div style={{ marginTop: 28 }}>
                <h3 style={{ fontSize: 16, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em", color: "#9A9C9F" }}>Description</h3>
                <p style={{ color: "#C9CACC", fontSize: 14.5, whiteSpace: "pre-wrap" }}>{pallet.description}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="sf-section sf-section-alt">
        <div className="sf-wrap" style={{ maxWidth: 720 }}>
          <div className="sf-sec-head"><div><h2>Reviews for this pallet</h2></div></div>
          {reviews.length === 0 && <p style={{ color: "#9A9C9F", marginBottom: 20 }}>No reviews yet for this pallet — be the first to leave one.</p>}
          <div style={{ marginBottom: 28 }}>
            {reviews.map((r) => (
              <div key={r.id} style={{ borderBottom: "1px solid #43464C", padding: "16px 0" }}>
                <div style={{ color: "#F4B400", marginBottom: 6 }}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
                <p style={{ color: "#C9CACC", fontSize: 14, marginBottom: 6 }}>{r.comment}</p>
                <div style={{ fontSize: 12, color: "#9A9C9F", fontFamily: "IBM Plex Mono, monospace" }}>— {r.authorName}</div>
              </div>
            ))}
          </div>
          <ReviewForm palletId={pallet.id} />
        </div>
      </section>

      <StorefrontFooter />
      <CartDrawer />
      <WhatsAppButton />
      {offerOpen && <OfferModal pallet={pallet} onClose={() => setOfferOpen(false)} />}
    </div>
  );
}

function ReviewForm({ palletId }: { palletId: string }) {
  const [form, setForm] = useState({ authorName: "", rating: 5, comment: "" });
  const [submitted, setSubmitted] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/public/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, palletId }),
    });
    setSubmitted(true);
  }

  if (submitted) {
    return <p style={{ color: "#4C9A5B", fontSize: 14 }}>Thanks — your review is submitted and will show once approved.</p>;
  }

  return (
    <form onSubmit={submit}>
      <h3 style={{ fontSize: 16, marginBottom: 12 }}>Leave a review</h3>
      <div className="sf-field-row" style={{ marginBottom: 12 }}>
        <div className="sf-field" style={{ marginBottom: 0 }}>
          <label style={{ color: "#9A9C9F" }}>Your name</label>
          <input required value={form.authorName} onChange={(e) => setForm({ ...form, authorName: e.target.value })} style={{ background: "#2B2E33", color: "#fff", borderColor: "#43464C" }} />
        </div>
        <div className="sf-field" style={{ marginBottom: 0 }}>
          <label style={{ color: "#9A9C9F" }}>Rating</label>
          <select value={form.rating} onChange={(e) => setForm({ ...form, rating: parseInt(e.target.value) })} style={{ background: "#2B2E33", color: "#fff", borderColor: "#43464C", width: "100%", padding: 12, borderRadius: 2 }}>
            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n > 1 ? "s" : ""}</option>)}
          </select>
        </div>
      </div>
      <div className="sf-field">
        <label style={{ color: "#9A9C9F" }}>Comment</label>
        <textarea required value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} rows={3} style={{ width: "100%", padding: 12, borderRadius: 2, background: "#2B2E33", color: "#fff", border: "1px solid #43464C", fontFamily: "inherit" }} />
      </div>
      <button type="submit" className="sf-modal-btn" style={{ width: "auto", padding: "12px 28px" }}>Submit review</button>
    </form>
  );
}

function OfferModal({ pallet, onClose }: { pallet: any; onClose: () => void }) {
  const [form, setForm] = useState({ customerName: "", customerEmail: "", customerPhone: "", offerPrice: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await fetch("/api/public/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, palletId: pallet.id }),
    });
    setSubmitting(false);
    setSubmitted(true);
  }

  return (
    <div className="sf-modal">
      <div className="sf-modal-card">
        {submitted ? (
          <>
            <div className="sf-confirm-icon">✓</div>
            <h3>Offer sent</h3>
            <p className="sf-modal-sub">We'll review your offer on LOAD #{pallet.sku} and get back to you by email.</p>
            <button className="sf-modal-btn" onClick={onClose}>Close</button>
          </>
        ) : (
          <>
            <h3>Make an offer</h3>
            <p className="sf-modal-sub">LOAD #{pallet.sku} — listed at {money(pallet.price)}</p>
            <form onSubmit={submit}>
              <div className="sf-field"><label>Your name</label><input required value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} /></div>
              <div className="sf-field"><label>Email</label><input type="email" required value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} /></div>
              <div className="sf-field"><label>Phone (optional)</label><input value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} /></div>
              <div className="sf-field"><label>Your offer</label><input type="number" min="1" required placeholder="$" value={form.offerPrice} onChange={(e) => setForm({ ...form, offerPrice: e.target.value })} /></div>
              <div className="sf-field"><label>Message (optional)</label><input value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></div>
              <button type="submit" className="sf-modal-btn" disabled={submitting}>{submitting ? "Sending…" : "Send Offer"}</button>
              <button type="button" className="sf-modal-cancel" onClick={onClose}>Cancel</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
