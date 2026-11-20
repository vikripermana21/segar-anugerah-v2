"use client";

import Link from "./transition-link";
import { useState } from "react";
import { ChevronRight, ClipboardList, Clock } from "lucide-react";
import { orders, rupiah } from "@/lib/store-data";
import type { Order, OrderStatus } from "@/lib/store-data";
import TabBar from "./tab-bar";
import { EmptyState } from "./ui";

const filters: { key: string; label: string; statuses?: OrderStatus[] }[] = [
  { key: "semua", label: "Semua" },
  { key: "belum", label: "Belum dibayar", statuses: ["pending_payment"] },
  { key: "diproses", label: "Diproses", statuses: [] },
  { key: "dikirim", label: "Dikirim", statuses: ["shipped"] },
  { key: "selesai", label: "Selesai", statuses: ["completed"] },
];

const tone: Record<OrderStatus, string> = {
  pending_payment: "bg-accent-soft text-accent",
  shipped: "bg-brand-soft text-brand",
  completed: "bg-surface-2 text-ink-2",
  cancelled: "bg-surface-2 text-ink-2",
};

export function OrderStatusPill({ order }: { order: Order }) {
  return (
    <span className={`pill ${tone[order.status]}`}>{order.statusLabel}</span>
  );
}

export default function OrdersView() {
  const [filter, setFilter] = useState("semua");
  const active = filters.find((item) => item.key === filter) ?? filters[0];
  const rows = active.statuses
    ? orders.filter((order) => active.statuses?.includes(order.status))
    : orders;

  return (
    <>
      <main className="page pb-[calc(84px+env(safe-area-inset-bottom))] pt-1 lg:pb-16">
        <div className="mx-auto max-w-[760px]">
          <div className="no-scrollbar -mx-5 flex gap-1.5 overflow-x-auto px-5 lg:mx-0 lg:flex-wrap lg:px-0">
            {filters.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                data-active={filter === item.key}
                aria-pressed={filter === item.key}
                className="chip h-[29px] text-[10.5px]"
              >
                {item.label}
              </button>
            ))}
          </div>

          {rows.length === 0 ? (
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
                    <OrderStatusPill order={order} />
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
                    {order.note}
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
            </div>
          )}
        </div>
      </main>

      <TabBar />
    </>
  );
}
