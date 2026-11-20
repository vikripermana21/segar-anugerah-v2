"use client";

import Link from "./transition-link";
import { useRef, useState } from "react";
import { ChevronRight, ClipboardList, Clock } from "lucide-react";

import { rupiah } from "@/lib/store-data";
import {
  orderFilters,
  orderStatusMeta,
  type OrderStatus,
} from "@/lib/order-status";
import type { OrderPage, OrderSummary } from "@/lib/order-view";
import TabBar from "./tab-bar";
import { EmptyState } from "./ui";

export function OrderStatusPill({ status }: { status: OrderStatus }) {
  const meta = orderStatusMeta[status];
  return <span className={`pill ${meta.tone}`}>{meta.label}</span>;
}

async function fetchPage(status: string, cursor: string | null): Promise<OrderPage> {
  const params = new URLSearchParams({ status });
  if (cursor) params.set("cursor", cursor);
  const response = await fetch(`/api/orders?${params.toString()}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Gagal memuat pesanan.");
  const data = (await response.json()) as { ok: boolean } & OrderPage;
  return { orders: data.orders, nextCursor: data.nextCursor };
}

export default function OrdersView({
  initialOrders,
  initialCursor,
  initialFilter,
}: {
  initialOrders: OrderSummary[];
  initialCursor: string | null;
  initialFilter: string;
}) {
  const [filter, setFilter] = useState(initialFilter);
  const [rows, setRows] = useState(initialOrders);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const requestId = useRef(0);

  async function load(nextFilter: string, nextCursor: string | null, append: boolean) {
    const id = requestId.current + 1;
    requestId.current = id;
    setLoading(true);
    setError("");

    try {
      const page = await fetchPage(nextFilter, nextCursor);
      if (requestId.current !== id) return;
      setRows((prev) => (append ? [...prev, ...page.orders] : page.orders));
      setCursor(page.nextCursor);
    } catch {
      if (requestId.current !== id) return;
      setError("Pesanan gagal dimuat. Coba lagi.");
    } finally {
      if (requestId.current === id) setLoading(false);
    }
  }

  function chooseFilter(key: string) {
    if (key === filter || loading) return;
    setFilter(key);
    setRows([]);
    setCursor(null);
    void load(key, null, false);
  }

  return (
    <>
      <main className="page pb-[calc(84px+env(safe-area-inset-bottom))] pt-1 lg:pb-16">
        <div className="mx-auto max-w-[760px]">
          <div className="no-scrollbar -mx-5 flex gap-1.5 overflow-x-auto px-5 lg:mx-0 lg:flex-wrap lg:px-0">
            {orderFilters.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => chooseFilter(item.key)}
                data-active={filter === item.key}
                aria-pressed={filter === item.key}
                className="chip h-[29px] text-[10.5px]"
              >
                {item.label}
              </button>
            ))}
          </div>

          {loading && rows.length === 0 ? (
            <div className="mt-3.5 space-y-2.5">
              {[0, 1].map((key) => (
                <div key={key} className="h-[132px] animate-pulse rounded-[15px] bg-surface-2" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="Belum ada pesanan"
              action="Lihat produk"
              actionHref="/products"
            >
              Pesanan yang sudah dibuat muncul di sini beserta statusnya.
            </EmptyState>
          ) : (
            <div className="mt-3.5 space-y-2.5">
              {rows.map((order) => (
                <article
                  key={order.number}
                  className="rounded-[15px] border border-border bg-surface px-3.5 py-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-[12.5px] font-bold">{order.number}</h2>
                    <OrderStatusPill status={order.status} />
                  </div>
                  <p className="mt-1 text-[10.5px] text-ink-3">
                    {order.dateLabel} · {order.itemCount} barang
                  </p>

                  <p
                    className={`mt-2 flex items-start gap-1.5 text-[10.5px] leading-[1.4] ${
                      order.status === "pending_payment"
                        ? "font-semibold text-accent"
                        : "text-ink-3"
                    }`}
                  >
                    {order.status === "pending_payment" ? (
                      <Clock size={13} className="mt-0.5 shrink-0" />
                    ) : null}
                    {orderStatusMeta[order.status].note}
                  </p>

                  <div className="my-2.5 h-px bg-border" />

                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[9.5px] text-ink-3">Total</p>
                      <p className="tabular text-[13px] font-bold">{rupiah(order.total)}</p>
                    </div>

                    {order.status === "pending_payment" ? (
                      <Link
                        href={`/account/orders/${order.number}`}
                        className="inline-flex h-[34px] min-w-[96px] items-center justify-center rounded-[9px] bg-brand px-3 text-[13.5px] font-bold text-cream"
                      >
                        Bayar
                      </Link>
                    ) : (
                      <Link
                        href={`/account/orders/${order.number}`}
                        className="flex items-center gap-1 text-[10.5px] font-bold text-ink-2"
                      >
                        Lihat detail
                        <ChevronRight size={13} />
                      </Link>
                    )}
                  </div>
                </article>
              ))}

              {cursor ? (
                <button
                  type="button"
                  onClick={() => void load(filter, cursor, true)}
                  disabled={loading}
                  className="btn-secondary mt-1 w-full text-[12px]"
                >
                  {loading ? "Memuat…" : "Muat pesanan lama"}
                </button>
              ) : null}
            </div>
          )}

          {error ? (
            <p role="alert" className="mt-3 text-[11px] font-semibold text-danger">
              {error}
            </p>
          ) : null}
        </div>
      </main>

      <TabBar />
    </>
  );
}
