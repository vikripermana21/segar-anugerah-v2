import Link from "next/link";
import { ChevronLeft, ChevronRight, ClipboardList, Search } from "lucide-react";

import {
  ADMIN_ORDER_PAGE_SIZE,
  adminOrderFilters,
  countOrdersByStatus,
  findAdminOrderFilter,
  listAdminOrders,
} from "@/lib/admin-orders";
import type { OrderStatus } from "@/lib/order-status";
import { rupiah } from "@/lib/store-data";

import { Badge, Card, CardHead, EmptyNote } from "../_components/ui";

export const instant = false;

type SearchParams = Promise<{ status?: string; q?: string; page?: string }>;

function statusTone(status: OrderStatus): "muted" | "warn" | undefined {
  if (status === "paid_late") return "warn";
  if (status === "cancelled" || status === "expired" || status === "refunded") return "muted";
  if (status === "pending_payment") return "warn";
  return undefined;
}

function countFor(
  filter: (typeof adminOrderFilters)[number],
  counts: Record<OrderStatus, number>,
): number {
  if (!filter.statuses) return Object.values(counts).reduce((sum, value) => sum + value, 0);
  return filter.statuses.reduce((sum, status) => sum + (counts[status] ?? 0), 0);
}

export default async function AdminOrderListPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { status = "semua", q = "", page: rawPage = "1" } = await searchParams;
  const filter = findAdminOrderFilter(status);
  const page = Math.max(1, Math.trunc(Number(rawPage)) || 1);

  const [counts, result] = await Promise.all([
    countOrdersByStatus(),
    listAdminOrders({ filter, q, page }),
  ]);

  const start = result.total === 0 ? 0 : (result.page - 1) * ADMIN_ORDER_PAGE_SIZE + 1;
  const end = Math.min(result.page * ADMIN_ORDER_PAGE_SIZE, result.total);

  function filterHref(key: string) {
    const params = new URLSearchParams();
    if (key !== "semua") params.set("status", key);
    if (q) params.set("q", q);
    const query = params.toString();
    return query ? `/admin/pesanan?${query}` : "/admin/pesanan";
  }

  function pageHref(target: number) {
    const params = new URLSearchParams();
    if (filter.key !== "semua") params.set("status", filter.key);
    if (q) params.set("q", q);
    if (target > 1) params.set("page", String(target));
    const query = params.toString();
    return query ? `/admin/pesanan?${query}` : "/admin/pesanan";
  }

  const lateCount = counts.paid_late ?? 0;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="admin-h1">Pesanan</h1>
          <p className="admin-sub">
            {result.total} pesanan pada filter ini · {counts.paid ?? 0} perlu disiapkan
          </p>
        </div>

        {lateCount > 0 ? (
          <Link href="/admin/pesanan?status=perlu-ditinjau" className="admin-alert">
            <ClipboardList size={18} strokeWidth={2} className="text-amber-600" />
            <span>
              <span className="block text-[12.5px] font-semibold text-ink">
                {lateCount} pesanan perlu ditinjau
              </span>
              <span className="block text-[11px] text-ink-3">
                Pembayaran masuk setelah kedaluwarsa
              </span>
            </span>
          </Link>
        ) : null}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {adminOrderFilters.map((item) => (
          <Link
            key={item.key}
            href={filterHref(item.key)}
            className="admin-chip"
            data-active={item.key === filter.key}
          >
            {item.label}
            <span className="text-[10.5px] opacity-70">{countFor(item, counts)}</span>
          </Link>
        ))}
      </div>

      <Card className="mt-4">
        <CardHead
          title="Daftar pesanan"
          note={`${start}–${end} dari ${result.total} pesanan`}
          action={
            <form action="/admin/pesanan" className="admin-search h-9 w-[260px]">
              {filter.key !== "semua" ? (
                <input type="hidden" name="status" value={filter.key} />
              ) : null}
              <Search size={15} strokeWidth={2} aria-hidden="true" />
              <input
                name="q"
                defaultValue={q}
                placeholder="Cari nomor, nama, atau HP"
                aria-label="Cari pesanan"
                className="w-full bg-transparent text-[12px] text-ink outline-none placeholder:text-ink-3"
              />
            </form>
          }
        />

        {result.orders.length === 0 ? (
          <div className="admin-card-body">
            <EmptyNote>
              {q
                ? `Tidak ada pesanan yang cocok dengan “${q}”.`
                : "Belum ada pesanan pada filter ini."}
            </EmptyNote>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table min-w-[760px]">
              <thead>
                <tr>
                  <th>Nomor</th>
                  <th>Pembeli</th>
                  <th>Waktu</th>
                  <th>Barang</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th aria-label="Aksi" />
                </tr>
              </thead>
              <tbody>
                {result.orders.map((order) => (
                  <tr key={order.id}>
                    <td className="whitespace-nowrap">
                      <Link
                        href={`/admin/pesanan/${order.number}`}
                        className="admin-name hover:text-green-700"
                      >
                        {order.number}
                      </Link>
                    </td>
                    <td>
                      <span className="block font-medium text-ink">{order.customerName}</span>
                      <span className="admin-muted">{order.customerPhone}</span>
                    </td>
                    <td className="whitespace-nowrap">{order.createdAtLabel}</td>
                    <td>{order.itemCount} barang</td>
                    <td className="tabular whitespace-nowrap font-semibold text-ink">
                      {rupiah(order.total)}
                    </td>
                    <td>
                      <Badge tone={statusTone(order.status)}>{order.statusLabel}</Badge>
                    </td>
                    <td className="text-right">
                      <Link
                        href={`/admin/pesanan/${order.number}`}
                        className="admin-btn-ghost admin-btn-sm"
                      >
                        Buka
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {result.pageCount > 1 ? (
        <nav
          aria-label="Halaman pesanan"
          className="mt-4 flex items-center justify-between gap-3"
        >
          <p className="text-[11.5px] text-ink-3">
            Halaman {result.page} dari {result.pageCount}
          </p>
          <div className="flex gap-2">
            {result.page > 1 ? (
              <Link href={pageHref(result.page - 1)} className="admin-btn-ghost admin-btn-sm">
                <ChevronLeft size={14} strokeWidth={2} />
                Sebelumnya
              </Link>
            ) : (
              <span className="admin-btn-ghost admin-btn-sm pointer-events-none opacity-50">
                <ChevronLeft size={14} strokeWidth={2} />
                Sebelumnya
              </span>
            )}

            {result.page < result.pageCount ? (
              <Link href={pageHref(result.page + 1)} className="admin-btn-ghost admin-btn-sm">
                Berikutnya
                <ChevronRight size={14} strokeWidth={2} />
              </Link>
            ) : (
              <span className="admin-btn-ghost admin-btn-sm pointer-events-none opacity-50">
                Berikutnya
                <ChevronRight size={14} strokeWidth={2} />
              </span>
            )}
          </div>
        </nav>
      ) : null}
    </>
  );
}
