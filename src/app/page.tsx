"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import "./storefront.css";
import { useStorefront, Pallet } from "@/lib/storefrontContext";
import { StorefrontHeader, StorefrontFooter, CartDrawer, AnnouncementBar, WhatsAppButton, NewsletterSignup, money } from "./storefront-components";
import { CategoryIcon } from "./categoryIcons";

const conditionMeta: Record<string, { label: string; badge: string }> = {
  AS_IS: { label: "As-Is", badge: "sf-cond-returns" },
  MINOR_SCRATCHES: { label: "Minor Scratches", badge: "sf-cond-shelf" },
  HEAVY_WEAR: { label: "Heavy Wear", badge: "sf-cond-returns" },
  LIKE_NEW: { label: "Like New", badge: "sf-cond-over" },
};
const conditionFilterGroups: Record<string, string[]> = {
  all: [], returns: ["AS_IS", "HEAVY_WEAR"], shelf: ["MINOR_SCRATCHES"], over: ["LIKE_NEW"],
};
const PAGE_SIZE = 6;

export default function StorefrontPage() {
  const { cart, addToCart } = useStorefront();
  const router = useRouter();

  const [pallets, setPallets] = useState<Pallet[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [conditionFilter, setConditionFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    fetch("/api/public/products").then((r) => r.json()).then(setPallets);
    fetch("/api/public/testimonials").then((r) => r.json()).then(setTestimonials);
    try {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("search");
      if (q) setSearch(q);
    } catch {}
  }, []);

  const categories = useMemo(() => Array.from(new Set(pallets.map((p) => p.category))), [pallets]);

  const filtered = useMemo(() => {
    let list = pallets;
    if (conditionFilter !== "all") {
      const allowed = conditionFilterGroups[conditionFilter];
      list = list.filter((p) => allowed.includes(p.condition));
    }
    if (categoryFilter) list = list.filter((p) => p.category === categoryFilter);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((p) =>
        p.title.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [pallets, conditionFilter, categoryFilter, search]);

  const visible = filtered.slice(0, visibleCount);

  return (
    <div className="sf-root">
      <AnnouncementBar />
      <StorefrontHeader search={search} onSearchChange={(v) => { setSearch(v); setVisibleCount(PAGE_SIZE); }} />

      <section className="sf-hero">
        <div className="sf-wrap sf-hero-grid">
          <div>
            <div className="sf-eyebrow">Load Board Updated Daily</div>
            <h1>Fresh loads.<br /><em>Liquidation prices.</em></h1>
            <p className="sf-lede">Mixed general merchandise pallets — customer returns, shelf pulls, and overstock — sourced straight from major retailers and sold straight off our dock to yours.</p>
            <div className="sf-btn-row">
              <a href="#board" className="sf-btn sf-btn-primary">View Live Load Board ↓</a>
              <a href="#how" className="sf-btn sf-btn-ghost">How Buying Works</a>
            </div>
            <div className="sf-stat-row">
              <div className="sf-stat"><div className="num">1,240+</div><div className="lbl">Loads Shipped</div></div>
              <div className="sf-stat"><div className="num">68%</div><div className="lbl">Avg. Off Retail</div></div>
              <div className="sf-stat"><div className="num">48</div><div className="lbl">States Delivered</div></div>
            </div>
          </div>
          <div className="sf-hero-art">
            <svg viewBox="0 0 420 380" xmlns="http://www.w3.org/2000/svg">
              <rect width="420" height="380" fill="#1F2124" />
              <rect x="60" y="300" width="300" height="16" fill="#5A4632" />
              <rect x="70" y="200" width="280" height="100" rx="2" fill="#F6F3EC" stroke="#C7C2B4" strokeWidth={2} />
              <rect x="95" y="215" width="90" height="35" fill="#EDEAE3" stroke="#C7C2B4" />
              <rect x="200" y="215" width="60" height="35" fill="#EDEAE3" stroke="#C7C2B4" />
              <rect x="275" y="215" width="60" height="70" fill="#EDEAE3" stroke="#C7C2B4" />
              <rect x="90" y="140" width="240" height="55" rx="2" fill="#F4B400" />
              <text x="110" y="173" fontFamily="Oswald" fontWeight={700} fontSize="18" fill="#17181A">LOAD #DK-2291</text>
              <path d="M55 300 L20 340 L400 340 L365 300 Z" fill="#2B2E33" stroke="#43464C" strokeWidth={2} />
            </svg>
          </div>
        </div>
      </section>

      <div className="sf-hazard" />

      <section className="sf-section" id="board">
        <div className="sf-wrap">
          <div className="sf-sec-head">
            <div>
              <h2>Live Load Board</h2>
              <p>Every listing below is one physical pallet, currently on our dock and ready to ship.</p>
            </div>
          </div>

          <div className="sf-cat-row">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`sf-cat-chip ${categoryFilter === cat ? "active" : ""}`}
                onClick={() => { setCategoryFilter(categoryFilter === cat ? null : cat); setVisibleCount(PAGE_SIZE); }}
              >
                <CategoryIcon category={cat} />
                <span>{cat}</span>
              </button>
            ))}
          </div>

          <div className="sf-filters">
            {[["all", "All Loads"], ["returns", "Customer Returns"], ["shelf", "Shelf Pulls"], ["over", "Overstock"]].map(([key, label]) => (
              <button key={key} className={`sf-filter-btn ${conditionFilter === key ? "active" : ""}`} onClick={() => { setConditionFilter(key); setVisibleCount(PAGE_SIZE); }}>{label}</button>
            ))}
          </div>

          <div className="sf-board">
            {visible.map((p) => {
              const meta = conditionMeta[p.condition] || conditionMeta.AS_IS;
              const inCartQty = cart.find((c) => c.id === p.id)?.qty || 0;
              const maxedOut = inCartQty >= p.quantityAvailable;
              const onSale = p.compareAtPrice && p.compareAtPrice > p.price;
              return (
                <div className="sf-tag" key={p.id} onClick={() => router.push(`/pallet/${p.id}`)}>
                  <div className="sf-tag-photo">
                    {p.imageUrl ? <img src={p.imageUrl} alt={p.title} /> : <div className="sf-tag-photo-empty">No photo yet</div>}
                    {onSale && <span className="sf-sale-ribbon">Sale</span>}
                    <span className={`sf-cond-badge ${meta.badge}`}>{meta.label}</span>
                  </div>
                  <div className="sf-tag-body">
                    <span className="sf-load-no">LOAD #{p.sku}</span>
                    <h3>{p.title}</h3>
                    <div className="sf-stars">★★★★★</div>
                    <div className="sf-tag-meta">{p.itemsRange || "Varies"} · {p.weightLbs.toLocaleString()} lbs · {p.location || "—"}</div>
                    <div className="sf-price-row">
                      {onSale ? (
                        <><span className="sf-retail">{money(p.compareAtPrice!)}</span><span className="sf-price">{money(p.price)}</span></>
                      ) : (
                        <span className="sf-price">{money(p.price)}</span>
                      )}
                    </div>
                    {p.quantityAvailable <= 3 && <span className="sf-low-stock">Only {p.quantityAvailable} left</span>}
                    <button
                      className="sf-add-btn"
                      disabled={maxedOut}
                      onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                    >
                      {maxedOut ? "Max in Load" : "Add to Load"}
                    </button>
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <button className="sf-offer-btn" style={{ marginTop: 0, width: "auto", flex: 1 }} onClick={(e) => { e.stopPropagation(); router.push(`/pallet/${p.id}`); }}>
                        View Details
                      </button>
                      <button className="sf-offer-btn" style={{ marginTop: 0, width: "auto", flex: 1 }} onClick={(e) => { e.stopPropagation(); router.push(`/pallet/${p.id}?offer=1`); }}>
                        Make an Offer
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <p style={{ color: "#9A9C9F" }}>{search ? `No loads match "${search}".` : "No loads currently match this filter."}</p>
            )}
          </div>

          {visibleCount < filtered.length && (
            <button className="sf-load-more" onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}>
              Load More Loads ({filtered.length - visibleCount} more)
            </button>
          )}
        </div>
      </section>

      <section className="sf-section sf-section-alt" id="how">
        <div className="sf-wrap">
          <div className="sf-sec-head"><div><h2>How buying a load works</h2><p>Three steps from load board to loading dock.</p></div></div>
          <div className="sf-steps">
            <div className="sf-step"><div className="step-no sf-mono">STEP 1</div><h4>Pick your load</h4><p>Browse the live board and add pallets to Your Load, or make an offer on any listing.</p></div>
            <div className="sf-step"><div className="step-no sf-mono">STEP 2</div><h4>Dispatch your order</h4><p>Check out with delivery or dock pickup. We confirm freight and send an order ticket.</p></div>
            <div className="sf-step"><div className="step-no sf-mono">STEP 3</div><h4>Receive & resell</h4><p>Loads ship via freight or are held for will-call pickup. Most orders move within 3–5 business days.</p></div>
          </div>
        </div>
      </section>

      {testimonials.length > 0 && (
        <section className="sf-section" id="reviews">
          <div className="sf-wrap">
            <div className="sf-sec-head"><div><h2>What buyers say</h2></div></div>
            <div className="sf-testimonials">
              {testimonials.map((t) => (
                <div className="sf-testimonial" key={t.id}>
                  <div className="stars">{"★".repeat(t.rating)}{"☆".repeat(5 - t.rating)}</div>
                  <p>"{t.comment}"</p>
                  <div className="author">— {t.authorName}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="sf-section sf-section-alt" id="faq">
        <div className="sf-wrap">
          <div className="sf-sec-head"><div><h2>Frequently asked</h2></div></div>
          <div className="sf-faq">
            <details open><summary>What do the condition grades mean?</summary><p><b>Customer Returns:</b> condition varies from unopened to used. <b>Shelf Pulls:</b> discontinued stock, generally unused. <b>Overstock:</b> excess new inventory, factory sealed.</p></details>
            <details><summary>Are item counts and contents guaranteed?</summary><p>Item counts are ranges based on the manifest at time of packing. Pallets are sold as manifested lots, not itemized listings.</p></details>
            <details><summary>Do you offer freight, or is pickup required?</summary><p>Both — select delivery at checkout for a freight quote, or choose will-call pickup at no additional cost.</p></details>
            <details><summary>Can I negotiate the price?</summary><p>Yes — every pallet's detail page has a "Make an Offer" option. We review offers and get back to you by email.</p></details>
            <details><summary>What's your return policy?</summary><p>All pallet sales are final due to the liquidation nature of the inventory. See our full <a href="/refunds" style={{ textDecoration: "underline" }}>Refunds Policy</a>.</p></details>
          </div>
        </div>
      </section>

      <NewsletterSignup />

      <StorefrontFooter />
      <CartDrawer />
      <WhatsAppButton />
    </div>
  );
}
