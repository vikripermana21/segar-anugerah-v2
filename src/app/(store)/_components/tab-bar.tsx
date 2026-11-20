"use client";

import Link from "./transition-link";
import { usePathname } from "next/navigation";
import { House, LayoutGrid, ShoppingBag, User } from "lucide-react";
import { useCart } from "../cart";

const items = [
  { href: "/", label: "Beranda", icon: House },
  { href: "/products", label: "Produk", icon: LayoutGrid },
  { href: "/cart", label: "Keranjang", icon: ShoppingBag },
  { href: "/account", label: "Akun", icon: User },
];

function activeFor(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/account") {
    return pathname === "/account" || pathname.startsWith("/account/orders") || pathname.startsWith("/account/addresses");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function TabBar() {
  const pathname = usePathname();
  const { count, ready } = useCart();

  return (
    <div className="tabbar-shell lg:hidden">
      <nav
        aria-label="Navigasi utama"
        className="tabbar-pill mx-auto flex h-[58px] w-full max-w-[430px] items-center gap-0 p-[6px]"
      >
        {items.map((item) => {
          const active = activeFor(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`relative flex h-[46px] flex-1 flex-col items-center justify-center gap-0.5 rounded-[23px] transition-colors ${
                active ? "bg-brand-soft text-brand" : "text-ink-2 hover:bg-surface-2"
              }`}
            >
              <Icon size={18} strokeWidth={active ? 2.1 : 1.8} />
              <span className={`text-[9.5px] leading-none ${active ? "font-bold" : "font-medium"}`}>
                {item.label}
              </span>
              {item.href === "/cart" && ready && count > 0 ? (
                <span className="absolute right-[18px] top-[7px] flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-accent px-1 text-[8px] font-bold leading-none text-white">
                  {count}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
