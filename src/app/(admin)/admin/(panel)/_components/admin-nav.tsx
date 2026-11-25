"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, LayoutDashboard, Package, Settings, Tags, Truck } from "lucide-react";

const groups = [
  {
    label: null,
    items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Pesanan",
    items: [{ href: "/admin/pesanan", label: "Daftar pesanan", icon: ClipboardList }],
  },
  {
    label: "Katalog",
    items: [
      { href: "/admin/produk", label: "Produk", icon: Package },
      { href: "/admin/kategori", label: "Kategori", icon: Tags },
    ],
  },
  {
    label: "Pengiriman",
    items: [{ href: "/admin/zona", label: "Zona ongkir", icon: Truck }],
  },
  {
    label: "Toko",
    items: [{ href: "/admin/pengaturan", label: "Pengaturan", icon: Settings }],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Navigasi admin" className="admin-nav">
      {groups.map((group, index) => (
        <div key={group.label ?? index} className="admin-nav-group">
          {group.label ? <p className="admin-nav-label">{group.label}</p> : null}

          {group.items.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="admin-nav-item"
              >
                <Icon size={18} strokeWidth={active ? 2.1 : 1.9} />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
