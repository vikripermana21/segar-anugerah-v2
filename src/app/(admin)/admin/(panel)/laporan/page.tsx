import Link from "next/link";
import { BarChart3, CheckCircle2, Wallet } from "lucide-react";

import { requireAdmin } from "@/lib/admin-guard";
import { revenueReport } from "@/lib/admin-reports";
import { rupiah } from "@/lib/store-data";

import {
  Card,
  CardHead,
  EmptyNote,
  StatCard,
  Tile,
  inputClass,
} from "../_components/ui";

export const instant = false;

type SearchParams = Promise<{ from?: string; to?: string }>;

export default async function AdminReportPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAdmin();

  const { from, to } = await searchParams;
  const report = await revenueReport({ from, to });

  const maxQuantity = Math.max(1, ...report.topProducts.map((item) => item.quantity));

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="admin-h1">Laporan</h1>
          <p className="admin-sub">
            {report.range.label} · omzet dihitung saat pesanan selesai
          </p>
        </div>

        <form action="/admin/laporan" method="get" className="flex flex-wrap items-end gap-2">
          <label className="admin-label text-[11px]">
            Dari
            <input
              type="date"
              name="from"
              defaultValue={report.range.fromKey}
              className={`${inputClass} h-9 w-[148px]`}
            />
          </label>
          <label className="admin-label text-[11px]">
            Sampai
            <input
              type="date"
              name="to"
              defaultValue={report.range.toKey}
              className={`${inputClass} h-9 w-[148px]`}
            />
          </label>
          <button type="submit" className="admin-btn admin-btn-sm">
            Terapkan
          </button>
          <Link href="/admin/laporan" className="admin-btn-ghost admin-btn-sm">
            Bulan ini
          </Link>
        </form>
      </div>

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Omzet"
          value={rupiah(report.revenue)}
          note={`${report.orderCount} pesanan selesai`}
          icon={<Wallet size={15} strokeWidth={2} />}
        />
        <StatCard
          label="Pesanan selesai"
          value={String(report.orderCount)}
          note="dibatalkan dan kedaluwarsa tidak dihitung"
          icon={<CheckCircle2 size={15} strokeWidth={2} />}
        />
        <StatCard
          label="Rata-rata pesanan"
          value={rupiah(report.averageOrder)}
          note="omzet dibagi pesanan selesai"
          icon={<BarChart3 size={15} strokeWidth={2} />}
        />
      </section>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="min-w-0">
          <CardHead
            title="Omzet per hari"
            note="Hari tanpa pesanan selesai tetap tampil dengan nol"
            action={
              <Link href="/admin/pesanan?status=selesai" className="admin-link">
                Lihat pesanan
              </Link>
            }
          />

          {report.orderCount === 0 ? (
            <div className="admin-card-body">
              <EmptyNote>Belum ada pesanan selesai pada rentang ini.</EmptyNote>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Pesanan</th>
                    <th>Omzet</th>
                  </tr>
                </thead>
                <tbody>
                  {report.daily.map((day) => (
                    <tr key={day.key}>
                      <td className="whitespace-nowrap">{day.label}</td>
                      <td className="tabular">{day.orders}</td>
                      <td className="tabular whitespace-nowrap font-semibold text-ink">
                        {rupiah(day.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <CardHead title="Lima produk terlaris" note="Berdasarkan jumlah unit terjual" />

          <div className="admin-card-body">
            {report.topProducts.length === 0 ? (
              <EmptyNote>Belum ada produk terjual pada rentang ini.</EmptyNote>
            ) : (
              <ol className="flex flex-col gap-3">
                {report.topProducts.map((item, index) => (
                  <li key={item.name} className="flex items-start gap-3">
                    <Tile>
                      <span className="text-[12px] font-bold">{index + 1}</span>
                    </Tile>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-[12.5px] font-semibold text-ink">
                          {item.name}
                        </p>
                        <p className="tabular shrink-0 text-[12px] font-semibold text-ink">
                          {rupiah(item.revenue)}
                        </p>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
                        <div
                          className="h-full rounded-full bg-green-600"
                          style={{ width: `${Math.max(6, (item.quantity / maxQuantity) * 100)}%` }}
                        />
                      </div>
                      <p className="mt-1 text-[10.5px] text-ink-3">{item.quantity} unit terjual</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </Card>
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-ink-3">
        Omzet memakai total pesanan saat status berubah menjadi selesai, bukan waktu pembayaran.
        Pesanan batal, kedaluwarsa, dan dana dikembalikan tidak masuk hitungan.
      </p>
    </>
  );
}
