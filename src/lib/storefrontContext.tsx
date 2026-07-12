"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Pallet = {
  id: string; sku: string; title: string; category: string; condition: string;
  itemsRange: string | null; weightLbs: number; location: string | null;
  imageUrl: string | null; retailValue: number | null; price: number; compareAtPrice?: number | null; quantityAvailable: number;
  description?: string | null;
};
export type Settings = {
  companyName: string; tagline: string; supportEmail: string; supportPhone: string;
  hoursText: string; headquartersAddress: string; warehouses: { label: string; address: string }[];
  paymentInstructions: string; paymentDiscountEnabled: boolean; paymentDiscountThreshold: number; paymentDiscountPercent: number;
  whatsappNumber?: string | null; announcementBarText?: string | null;
};
export type CartLine = Pallet & { qty: number };

type StorefrontContextValue = {
  settings: Settings | null;
  cart: CartLine[];
  addToCart: (p: Pallet) => void;
  changeQty: (id: string, delta: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  drawerOpen: boolean;
  setDrawerOpen: (v: boolean) => void;
};

const StorefrontContext = createContext<StorefrontContextValue | null>(null);

const CART_KEY = "dock9_cart_v1";

export function StorefrontProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    fetch("/api/public/settings").then((r) => r.json()).then(setSettings);
    try {
      const saved = localStorage.getItem(CART_KEY);
      if (saved) setCart(JSON.parse(saved));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {}
  }, [cart, hydrated]);

  function addToCart(p: Pallet) {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === p.id);
      if (existing) {
        if (existing.qty >= p.quantityAvailable) return prev;
        return prev.map((c) => (c.id === p.id ? { ...c, qty: c.qty + 1 } : c));
      }
      return [...prev, { ...p, qty: 1 }];
    });
    setDrawerOpen(true);
  }
  function changeQty(id: string, delta: number) {
    setCart((prev) => prev.map((c) => (c.id === id ? { ...c, qty: c.qty + delta } : c)).filter((c) => c.qty > 0));
  }
  function removeItem(id: string) {
    setCart((prev) => prev.filter((c) => c.id !== id));
  }
  function clearCart() {
    setCart([]);
  }

  const value = useMemo(
    () => ({ settings, cart, addToCart, changeQty, removeItem, clearCart, drawerOpen, setDrawerOpen }),
    [settings, cart, drawerOpen]
  );

  return <StorefrontContext.Provider value={value}>{children}</StorefrontContext.Provider>;
}

export function useStorefront() {
  const ctx = useContext(StorefrontContext);
  if (!ctx) throw new Error("useStorefront must be used within StorefrontProvider");
  return ctx;
}
