"use client";

import Link from "./transition-link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Fish, Search, X } from "lucide-react";
import { useStoreSettings } from "../cart";
import CartButton from "./cart-button";

const navItems = [
  { href: "/", label: "Beranda" },
  { href: "/products", label: "Produk" },
  { href: "/cart", label: "Keranjang" },
  { href: "/account/orders", label: "Pesanan" },
  { href: "/account", label: "Akun" },
];

/** Bagian kota dari alamat toko: "Cilandak · Jakarta Selatan". */
function areaLabel(address: string): string {
  const parts = address
    .split(",")
    .map((part) => part.trim().replace(/\s+\d{4,6}$/, ""))
    .filter(Boolean);

  return parts.length >= 2 ? parts.slice(-2).join(" · ") : (parts[0] ?? "");
}

export function BrandBar() {
  const pathname = usePathname();
  const settings = useStoreSettings();

  return (
    <header className="store-bar">
      <div className="page flex h-[66px] items-center justify-between gap-3">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[13px] bg-brand text-cream">
            <Fish size={20} strokeWidth={1.9} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[15px] font-bold leading-tight">
              {settings.name}
            </span>
            <span className="block truncate text-[10.5px] leading-tight text-ink-2">
              {areaLabel(settings.address)}
            </span>
          </span>
        </Link>

        <nav aria-label="Navigasi toko" className="hidden items-center gap-6 lg:flex">
          {navItems.map((item) => {
            const active =
              item.href === "/account"
                ? pathname === "/account" || pathname.startsWith("/account/addresses")
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`text-[12.5px] font-semibold transition-colors hover:text-brand ${
                  active ? "text-brand" : "text-ink-2"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/products"
            aria-label="Cari produk"
            className="icon-btn"
          >
            <Search size={18} strokeWidth={1.9} />
          </Link>
          <CartButton />
        </div>
      </div>
    </header>
  );
}

export function PageBar({
  title,
  backHref = "/",
  backLabel = "Kembali",
  right,
  close = false,
}: {
  title: string;
  backHref?: string;
  backLabel?: string;
  right?: React.ReactNode;
  close?: boolean;
}) {
  return (
    <header className="store-bar">
      <div className="page flex h-[66px] items-center gap-3">
        <Link
          href={backHref}
          aria-label={backLabel}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-ink transition-colors hover:bg-brand-soft"
        >
          {close ? (
            <X size={17} strokeWidth={2} />
          ) : (
            <ArrowLeft size={17} strokeWidth={2} />
          )}
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-[15px] font-bold">{title}</h1>
        {right ?? <span className="h-9 w-9 shrink-0" aria-hidden="true" />}
      </div>
    </header>
  );
}

