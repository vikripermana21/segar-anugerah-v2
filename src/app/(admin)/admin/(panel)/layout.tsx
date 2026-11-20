import Link from "next/link";
import { Fish, Search } from "lucide-react";

import { db } from "@/db";
import { storeSetting } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-guard";

import { adminLogout } from "./logout";
import { AdminNav } from "./_components/admin-nav";

export const instant = false;

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  const settings = (await db.select().from(storeSetting).limit(1))[0];
  const cutoff = String(settings?.orderCutoffHour ?? 16).padStart(2, "0");

  return (
    <div className="admin-shell">
      <div className="flex min-h-dvh flex-col lg:flex-row">
        <aside className="admin-sidebar">
          <div>
            <Link href="/admin" className="admin-brand">
              <span className="admin-brand-mark">
                <Fish size={21} strokeWidth={1.9} />
              </span>
              <span>
                <span className="admin-brand-name block">
                  {settings?.storeName ?? "Segar Anugerah"}
                </span>
                <span className="admin-brand-role block">Admin toko</span>
              </span>
            </Link>

            <AdminNav />
          </div>

          <div className="admin-status">
            <p className="flex items-center gap-2 text-[12px] font-semibold text-green-700">
              <span className="h-[7px] w-[7px] rounded-full bg-green-600" aria-hidden="true" />
              Toko sedang buka
            </p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-ink-2">
              Pesanan masuk sampai {cutoff}.00 WIB
            </p>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="admin-appbar">
            <form action="/admin/produk" className="admin-search">
              <Search size={16} strokeWidth={2} aria-hidden="true" />
              <input
                name="q"
                placeholder="Cari produk"
                aria-label="Cari produk"
                className="w-full bg-transparent text-[12.5px] text-ink outline-none placeholder:text-ink-3"
              />
            </form>

            <div className="flex-1" />

            <div className="flex items-center gap-2.5">
              <span className="admin-avatar" aria-hidden="true">
                {initials(session.name)}
              </span>
              <span className="hidden sm:block">
                <span className="block text-[13px] font-semibold leading-tight text-ink">
                  {session.name}
                </span>
                <span className="block text-[11px] leading-tight text-ink-3">Admin</span>
              </span>
            </div>

            <span className="h-[26px] w-px bg-line" aria-hidden="true" />

            <form action={adminLogout}>
              <button type="submit" className="admin-btn-ghost h-9">
                Keluar
              </button>
            </form>
          </header>

          <main className="admin-content">{children}</main>
        </div>
      </div>
    </div>
  );
}
