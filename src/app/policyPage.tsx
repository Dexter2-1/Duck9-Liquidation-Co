"use client";
import { useEffect, useState } from "react";
import "./storefront.css";
import { StorefrontHeader, StorefrontFooter, CartDrawer, AnnouncementBar, WhatsAppButton } from "./storefront-components";

export function PolicyPage({ title, field }: { title: string; field: "shippingPolicy" | "refundsPolicy" | "termsPolicy" }) {
  const [text, setText] = useState("");

  useEffect(() => {
    fetch("/api/public/settings").then((r) => r.json()).then((data) => setText(data[field] || ""));
  }, [field]);

  return (
    <div className="sf-root">
      <AnnouncementBar />
      <StorefrontHeader />
      <section className="sf-section" style={{ paddingTop: 60 }}>
        <div className="sf-wrap" style={{ maxWidth: 720 }}>
          <h1 style={{ fontSize: 32, marginBottom: 24 }}>{title}</h1>
          <p style={{ color: "#C9CACC", fontSize: 15, whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{text}</p>
        </div>
      </section>
      <StorefrontFooter />
      <CartDrawer />
      <WhatsAppButton />
    </div>
  );
}
