import Link from "next/link";
import { asc, count, eq, lte } from "drizzle-orm";
import { Package, Tags, TriangleAlert, Wallet } from "lucide-react";

import { db } from "@/db";
import { category, deliveryZone, product, productVariant, storeSetting } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-guard";
import { rupiah } from "@/lib/store-data";

import { Badge, Card, CardHead, StatCard, Tile } from "./_components/ui";

export const instant = false;

export default async function AdminDashboardPage() {
  const session = await requireAdmin();

  const [
    [settings],
    [productCount],
    [activeProductCount],
    [categoryCount],
    [zoneCount],
    lowStock,
  ] = await Promise.all([
    db.select().from(storeSetting).limit(1),
    db.select({ value: count() }).from(product),
    db.select({ value: count() }).from(product).where(eq(product.isActive, true)),
    db.select({ value: count() }).from(category),
    db.select({ value: count() }).from(deliveryZone),
    db
      .select({
        id: productVariant.id,
        label: productVariant.label,
        stock: productVariant.stock,
        productName: product.name,
      })
      .from(productVariant)
      .innerJoin(product, eq(productVariant.productId, product.id))
      .where(lte(productVariant.stock, 10))
      .orderBy(asc(productVariant.stock), asc(product.name))
      .limit(4),
  ]);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="admin-h1">Dashboard</h1>
          <p className="admin-sub">
            Ringkasan katalog · {(activeProductCount?.value ?? 0)} produk tampil di toko
          </p>
        </div>
        <span className="admin-btn-ghost pointer-events-none">
          <Package size={15} strokeWidth={1.9} />
          Fase 2 — katalog
        </span>
      </div>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Produk aktif"
          value={String(activeProductCount?.value ?? 0)}
          note={`${productCount?.value ?? 0} produk total`}
          icon={<Package size={15} strokeWidth={2} />}
        />
        <StatCard
          label="Kategori"
          value={String(categoryCount?.value ?? 0)}
          note="dipakai filter di toko"
          icon={<Tags size={15} strokeWidth={2} />}
        />
        <StatCard
          label="Stok menipis"
          value={String(lowStock.length)}
          note="varian dengan stok ≤ 10"
          icon={<TriangleAlert size={15} strokeWidth={2} />}
        />
        <StatCard
          label="Gratis ongkir"
          value={settings?.freeShippingActive ? "Aktif" : "Nonaktif"}
          note={
            settings?.freeShippingMinSubtotal
              ? `min. ${rupiah(settings.freeShippingMinSubtotal)}`
              : "tanpa minimum"
          }
          icon={<Wallet size={15} strokeWidth={2} />}
        />
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardHead
            title="Langkah berikutnya"
            note="Isi katalog dari halaman admin, bukan dari kode."
          />
          <div className="admin-card-body">
            <ol className="flex flex-col gap-3">
              {[
                {
                  href: "/admin/kategori",
                  title: "Isi kategori",
                  note: `${categoryCount?.value ?? 0} kategori tersimpan`,
                },
                {
                  href: "/admin/produk",
                  title: "Tambah produk dan varian",
                  note: "Harga dan stok disimpan di tiap varian",
                },
                {
                  href: "/admin/zona",
                  title: "Atur zona ongkir",
                  note: `${zoneCount?.value ?? 0} zona tersimpan`,
                },
              ].map((step, index) => (
                <li key={step.href}>
                  <Link
                    href={step.href}
                    className="flex items-center gap-3 rounded-[10px] border border-line px-3.5 py-3 hover:bg-green-50"
                  >
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-green-50 text-[11px] font-bold text-green-700">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12.5px] font-semibold text-ink">
                        {step.title}
                      </span>
                      <span className="block text-[11px] text-ink-3">{step.note}</span>
                    </span>
                    <span className="text-[12px] font-semibold text-green-700">Buka</span>
                  </Link>
                </li>
              ))}
            </ol>

            <p className="mt-4 text-[11px] leading-relaxed text-ink-3">
              Toko masih membaca data contoh sampai katalog tersambung ke database.
              Pesanan dan laporan menyusul setelah pembayaran tersambung.
            </p>
          </div>
        </Card>

        <Card>
          <CardHead
            title="Stok menipis"
            note="Varian di bawah 10 unit"
            action={
              <Link href="/admin/produk" className="admin-link">
                Kelola
              </Link>
            }
          />

          <div className="admin-card-body">
            {lowStock.length === 0 ? (
              <p className="admin-empty">Tidak ada varian di bawah 10 unit.</p>
            ) : (
              <ul className="flex flex-col">
                {lowStock.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 border-b border-line-soft py-3 last:border-b-0"
                  >
                    <Tile>
                      <Package size={16} strokeWidth={1.9} />
                    </Tile>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] font-semibold text-ink">
                        {item.productName}
                      </span>
                      <span className="block text-[10.5px] text-ink-3">{item.label}</span>
                    </span>
                    <Badge tone={item.stock === 0 ? "warn" : undefined}>
                      {item.stock === 0 ? "Habis" : `Sisa ${item.stock}`}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </section>

      <p className="mt-6 text-[11px] text-ink-3">Masuk sebagai {session.name}</p>
    </>
  );
}
