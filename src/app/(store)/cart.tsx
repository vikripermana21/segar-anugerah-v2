"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Product, StoreSettings, Variant } from "@/lib/catalog-types";
import { buildVariantIndex } from "@/lib/catalog-client";

type CartState = Record<string, number>;

export type CartLine = {
  product: Product;
  variant: Variant;
  quantity: number;
  lineTotal: number;
  out: boolean;
};

export type CartApi = {
  cart: CartState;
  lines: CartLine[];
  /** jumlah baris (satu baris = satu varian), bukan jumlah unit */
  count: number;
  /** jumlah unit, dipakai di ringkasan bila perlu */
  units: number;
  /** hanya baris yang masih tersedia */
  subtotal: number;
  ready: boolean;
  add: (variantId: string, delta?: number) => boolean;
  setQuantity: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartApi | null>(null);
const StoreContext = createContext<{ settings: StoreSettings } | null>(null);
const STORAGE_KEY = "sa.cart.v2";

/** Pengaturan toko untuk komponen klien (nama, WhatsApp, gratis ongkir). */
export function useStoreSettings(): StoreSettings {
  const api = useContext(StoreContext);
  if (!api) throw new Error("useStoreSettings dipakai di luar CartProvider");
  return api.settings;
}

export function useCart(): CartApi {
  const api = useContext(CartContext);
  if (!api) throw new Error("useCart dipakai di luar CartProvider");
  return api;
}

export function CartProvider({
  products,
  settings,
  children,
}: {
  products: Product[];
  settings: StoreSettings;
  children: React.ReactNode;
}) {
  const [cart, setCart] = useState<CartState>({});
  const [ready, setReady] = useState(false);
  const variantIndex = useMemo(() => buildVariantIndex(products), [products]);

  // Keranjang tinggal di perangkat dan bertahan setelah halaman ditutup
  // (PRD Epik 3). Baca dulu, baru menulis: tanpa penanda `ready`, tulisan
  // pertama akan menimpa isi tersimpan dengan keranjang kosong.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          const clean: CartState = {};
          for (const [id, value] of Object.entries(parsed as Record<string, unknown>)) {
            if (
              typeof value === "number" &&
              Number.isFinite(value) &&
              value > 0 &&
              variantIndex.has(id)
            ) {
              clean[id] = Math.floor(value);
            }
          }
          // Dibaca setelah mount, bukan saat render pertama: server tidak
          // melihat localStorage, jadi nilai awal berbeda akan memecah hidrasi.
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setCart(clean);
        }
      }
    } catch {
      // Perangkat memblokir penyimpanan: keranjang tetap jalan, hanya tidak bertahan.
    }
    setReady(true);
  }, [variantIndex]);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Sama seperti di atas.
    }
  }, [cart, ready]);

  const add = useCallback((variantId: string, delta = 1) => {
    const found = variantIndex.get(variantId);
    if (!found || found.variant.stock <= 0) return false;

    let accepted = true;
    setCart((prev) => {
      const next = { ...prev };
      const current = next[variantId] ?? 0;
      const value = Math.min(found.variant.stock, current + delta);
      if (value > 0) next[variantId] = value;
      else delete next[variantId];
      accepted = value !== current;
      return next;
    });
    return accepted;
  }, [variantIndex]);

  const setQuantity = useCallback((variantId: string, quantity: number) => {
    const found = variantIndex.get(variantId);
    if (!found) return;
    const value = Math.min(found.variant.stock, Math.max(0, Math.floor(quantity)));
    setCart((prev) => {
      const next = { ...prev };
      if (value > 0) next[variantId] = value;
      else delete next[variantId];
      return next;
    });
  }, [variantIndex]);

  const remove = useCallback((variantId: string) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[variantId];
      return next;
    });
  }, []);

  const clear = useCallback(() => setCart({}), []);

  const { lines, count, units, subtotal } = useMemo(() => {
    const rows: CartLine[] = [];
    let unitCount = 0;
    let sum = 0;

    for (const [variantId, quantity] of Object.entries(cart)) {
      const found = variantIndex.get(variantId);
      if (!found) continue;
      const out = found.variant.stock <= 0;
      const lineTotal = found.variant.price * quantity;
      rows.push({
        product: found.product,
        variant: found.variant,
        quantity,
        lineTotal,
        out,
      });
      unitCount += quantity;
      if (!out) sum += lineTotal;
    }

    return { lines: rows, count: rows.length, units: unitCount, subtotal: sum };
  }, [cart, variantIndex]);

  const value = useMemo<CartApi>(
    () => ({
      cart,
      lines,
      count,
      units,
      subtotal,
      ready,
      add,
      setQuantity,
      remove,
      clear,
    }),
    [cart, lines, count, units, subtotal, ready, add, setQuantity, remove, clear],
  );

  return (
    <StoreContext.Provider value={{ settings }}>
      <CartContext.Provider value={value}>{children}</CartContext.Provider>
    </StoreContext.Provider>
  );
}
