import Link from "next/link";
import { asc, count, eq, lte } from "drizzle-orm";
import { ClipboardList, Package, ShoppingBasket, TriangleAlert, Wallet } from "lucide-react";

import { db } from "@/db";
import { product, productVariant } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-guard";
import { countOrdersByStatus, listOrdersToPrepare } from "@/lib/admin-orders";
import { recentReportRange, revenueReport, todaySummary } from "@/lib/admin-reports";
import { rupiah } from "@/lib/store-data";

import { Badge, Card, CardBody, CardHead, EmptyNote, StatCard, Tile } from "./_components/ui";

export const instant = false;

export default async function AdminDashboardPage() {
  const session = await requireAdmin();
  const weekRange = recentReportRange(7);
  const weekPromise = revenueReport({ from: weekRange.fromKey, to: weekRange.toKey });

  const [counts, summary, toPrepare, [activeProductCount], lowStock, weekReport] =
    await Promise.all([
      countOrdersByStatus(),
      todaySummary(),
      listOrdersToPrepare(5),
      db.select({ value: count() }).from(product).where(eq(product.isActive, true)),
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
      weekPromise,
    ]);
  const prepareCount = (counts.paid ?? 0) + (counts.processing ?? 0);
  const maxWeekRevenue = Math.max(1, ...weekReport.daily.map((day) => day.revenue));

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="admin-h1">Dashboard</h1>
          <p className="admin-sub">
            Ringkasan hari ini · {activeProductCount?.value ?? 0} produk tampil di toko
          </p>
        </div>
        <Link href="/admin/pesanan?status=perlu-disiapkan" className="admin-btn">
          <ClipboardList size={15} strokeWidth={1.9} />
          {prepareCount > 0 ? `${prepareCount} perlu disiapkan` : "Buka pesanan"}
        </Link>
      </div>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Perlu disiapkan"
          value={String(prepareCount)}
          note="sudah dibayar, belum diantar"
          icon={<ClipboardList size={15} strokeWidth={2} />}
        />
        <StatCard
          label="Perlu ditinjau"
          value={String(counts.paid_late ?? 0)}
          note="pembayaran masuk setelah kedaluwarsa"
          icon={<TriangleAlert size={15} strokeWidth={2} />}
        />
        <StatCard
          label="Omzet hari ini"
          value={rupiah(summary.revenue)}
          note={`${summary.completedOrders} pesanan selesai`}
          icon={<Wallet size={15} strokeWidth={2} />}
        />
        <StatCard
          label="Pesanan hari ini"
          value={String(summary.ordersToday)}
          note={`${summary.pendingPayment} menunggu pembayaran`}
          icon={<ShoppingBasket size={15} strokeWidth={2} />}
        />
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardHead
            title="Perlu disiapkan"
            note="Pesanan dibayar, terlama dulu"
            action={
              <Link href="/admin/pesanan?status=perlu-disiapkan" className="admin-link">
                Lihat semua
              </Link>
            }
          />

          <div className="admin-card-body">
            {toPrepare.length === 0 ? (
              <EmptyNote>Tidak ada pesanan yang menunggu disiapkan.</EmptyNote>
            ) : (
              <ul className="flex flex-col">
                {toPrepare.map((order) => (
                  <li
                    key={order.id}
                    className="flex flex-wrap items-center gap-3 border-b border-line-soft py-3 last:border-b-0"
                  >
                    <Tile>
                      <ClipboardList size={16} strokeWidth={1.9} />
                    </Tile>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12.5px] font-semibold text-ink">
                        {order.number} · {order.customerName}
                      </span>
                      <span className="block text-[10.5px] text-ink-3">
                        {order.itemCount} barang · {order.createdAtLabel}
                      </span>
                    </span>
                    <span className="tabular text-[12.5px] font-semibold text-ink">
                      {rupiah(order.total)}
                    </span>
                    <Link
                      href={`/admin/pesanan/${order.number}`}
                      className="admin-btn-ghost admin-btn-sm"
                    >
                      Buka
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-4 text-[11px] leading-relaxed text-ink-3">
              Tekan “Sedang diantar” di halaman pesanan setelah barang diserahkan ke kurir.
            </p>
          </div>
        </Card>

        <Card>
          <CardHead
            title="Stok menipis"
            note="Varian dengan stok ≤ 10"
            action={
              <Link href="/admin/produk" className="admin-link">
                Kelola
              </Link>
            }
          />

          <div className="admin-card-body">
            {lowStock.length === 0 ? (
              <EmptyNote>Tidak ada varian di bawah 10 unit.</EmptyNote>
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

      <Card className="mt-4">
        <CardHead
          title="Tujuh hari terakhir"
          note={`${rupiah(weekReport.revenue)} dari ${weekReport.orderCount} pesanan selesai`}
          action={
            <Link href="/admin/laporan" className="admin-link">
              Buka laporan
            </Link>
          }
        />
        <CardBody>
          <div className="flex items-end gap-2 sm:gap-3">
            {weekReport.daily.map((day) => (
              <div key={day.key} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                <div
                  className="flex h-20 w-full items-end rounded-[4px] bg-surface-2"
                  title={`${day.label}: ${rupiah(day.revenue)}`}
                >
                  <div
                    className="w-full rounded-[4px] bg-green-600"
                    style={{
                      height:
                        day.revenue > 0
                          ? `${Math.max(4, (day.revenue / maxWeekRevenue) * 100)}%`
                          : 0,
                    }}
                  />
                </div>
                <span className="text-[10px] text-ink-3">{day.label}</span>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <p className="mt-6 text-[11px] text-ink-3">Masuk sebagai {session.name}</p>
    </>
  );
}
