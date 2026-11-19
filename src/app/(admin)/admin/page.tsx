import { redirect } from "next/navigation";

import { db } from "@/db";
import { storeSetting } from "@/db/schema";
import { getSession } from "@/lib/auth";

import { adminLogout } from "./logout";

export const instant = false;

export default async function AdminDashboardPage() {
  const session = await getSession("admin");
  if (!session) redirect("/admin/login");

  const settings = (await db.select().from(storeSetting).limit(1))[0];

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-emerald-700 uppercase">
            {settings?.storeName ?? "Segar Anugerah"}
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-500">Masuk sebagai {session.name}</p>
        </div>
        <form action={adminLogout}>
          <button
            type="submit"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            Keluar
          </button>
        </form>
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <p className="text-sm text-zinc-500">Pesanan hari ini</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-900">0</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <p className="text-sm text-zinc-500">Omzet hari ini</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-900">Rp 0</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <p className="text-sm text-zinc-500">Gratis ongkir</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-900">
            {settings?.freeShippingActive ? "Aktif" : "Nonaktif"}
          </p>
        </div>
      </section>

      <p className="mt-8 text-sm text-zinc-500">
        Fase 1 — fondasi. Menu katalog, pesanan, dan laporan menyusul di fase berikutnya.
      </p>
    </main>
  );
}
