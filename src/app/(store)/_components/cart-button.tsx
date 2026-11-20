"use client";

import Link from "./transition-link";
import { usePathname } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { useCart } from "../cart";

export default function CartButton({ size = 38 }: { size?: 36 | 38 }) {
  const { count, ready } = useCart();
  const pathname = usePathname();
  const active = pathname === "/cart";

  return (
    <Link
      href="/cart"
      aria-label={count > 0 ? `Keranjang, ${count} barang` : "Keranjang"}
      aria-current={active ? "page" : undefined}
      className={`relative inline-flex items-center justify-center rounded-xl border transition-colors ${
        active
          ? "border-brand/30 bg-brand-soft text-brand"
          : "border-border bg-surface text-ink hover:bg-brand-soft"
      }`}
      style={{ width: size, height: size }}
    >
      <ShoppingBag size={size === 36 ? 17 : 18} strokeWidth={1.9} />
      {ready && count > 0 ? (
        <span className="absolute -top-px right-0 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-accent px-1 text-[9.5px] font-bold leading-none text-white">
          {count}
        </span>
      ) : null}
    </Link>
  );
}
