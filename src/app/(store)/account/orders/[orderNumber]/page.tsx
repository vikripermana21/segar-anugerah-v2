import type { Metadata } from "next";
import Link from "../../../_components/transition-link";
import { notFound } from "next/navigation";
import { Check, Info, MapPin, Phone } from "lucide-react";

import { requireCustomer } from "@/lib/customer-guard";
import { getCustomerOrder } from "@/lib/order-view";
import { orderStatusMeta } from "@/lib/order-status";
import { rupiah, storeFacts } from "@/lib/store-data";

import { PageBar } from "../../../_components/app-bar";
import { OrderStatusPill } from "../../../_components/orders-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}): Promise<Metadata> {
  const { orderNumber } = await params;
  return { title: `Pesanan ${orderNumber}` };
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const session = await requireCustomer(`/account/orders/${orderNumber}`);
  const order = await getCustomerOrder(session.id, orderNumber);
  if (!order) notFound();

  const pending = order.status === "pending_payment";
  const late = order.status === "paid_late";

  return (
    <div className="min-h-dvh">
      <PageBar title="Pesanan" backHref="/account/orders" backLabel="Kembali ke pesanan saya" />

      <main className={`page pt-2 ${pending ? "pb-[calc(104px+env(safe-area-inset-bottom))]" : "pb-10"}`}>
        <div className="mx-auto max-w-[720px]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="font-display text-[22px] font-semibold leading-tight">
                {order.number}
              </h1>
              <p className="mt-1 text-[10.5px] text-ink-3">Dibuat {order.createdLabel}</p>
            </div>
            <OrderStatusPill status={order.status} />
          </div>

          {pending || late ? (
            <div
              className={`mt-3 flex gap-2.5 rounded-[14px] px-3 py-3 ${
                late ? "bg-danger-soft" : "bg-accent-soft"
              }`}
            >
              <span
                className={`grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full bg-white/70 ${
                  late ? "text-danger" : "text-accent"
                }`}
              >
                <Info size={14} />
              </span>
              <div>
                <p
                  className={`text-[11.5px] font-bold ${late ? "text-danger" : "text-accent"}`}
                >
                  {late ? "Pembayaran perlu ditinjau" : "Pembayaran belum selesai"}
                </p>
                <p className="mt-0.5 text-[10.5px] leading-[1.45] text-[#7a4638]">
                  {late
                    ? "Pembayaran masuk setelah pesanan kedaluwarsa. Toko akan menghubungi Anda untuk memastikan stok."
                    : `Stok masih ditahan sampai pukul ${order.expiresLabel ?? "—"}. Selesaikan pembayaran agar pesanan diteruskan ke toko.`}
                </p>
              </div>
            </div>
          ) : null}

          <section className="mt-4">
            <h2 className="text-[13px] font-bold">Riwayat</h2>
            <div className="mt-2 rounded-2xl border border-border bg-surface px-3.5 py-3">
              {order.timeline.map((step, index) => {
                const last = index === order.timeline.length - 1;
                return (
                  <div key={`${step.time}-${index}`} className="flex gap-2.5">
                    <div className="flex w-2.5 flex-col items-center gap-0.5">
                      <span
                        className={`mt-0.5 grid h-[9px] w-[9px] place-items-center rounded-full ${
                          last ? "border-[1.5px] border-brand bg-surface-2" : "bg-brand"
                        }`}
                      >
                        {last ? <Check size={5} className="text-brand" /> : null}
                      </span>
                      {!last ? <span className="w-px flex-1 bg-border" /> : null}
                    </div>
                    <div className={`min-w-0 flex-1 ${last ? "" : "pb-3"}`}>
                      <p className="text-[9.5px] text-ink-3">{step.time} WIB</p>
                      <p
                        className={`mt-0.5 text-[11.5px] ${
                          last ? "font-bold text-ink" : "font-medium text-ink-2"
                        }`}
                      >
                        {step.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="mt-4 rounded-2xl border border-border bg-surface p-4">
            <h2 className="text-[12.5px] font-bold">Barang</h2>
            <ul className="mt-2.5 space-y-2">
              {order.items.map((item) => (
                <li
                  key={item.key}
                  className="flex items-center justify-between gap-3 text-[12px]"
                >
                  <span className="text-ink-2">
                    {item.quantity} × {item.name} {item.variant}
                  </span>
                  <span className="tabular font-medium">{rupiah(item.lineTotal)}</span>
                </li>
              ))}
            </ul>

            <div className="my-2.5 h-px bg-border" />
            <dl className="space-y-2">
              <div className="flex items-center justify-between gap-3 text-[12px]">
                <dt className="text-ink-2">Subtotal</dt>
                <dd className="tabular font-medium">{rupiah(order.subtotal)}</dd>
              </div>
              {order.shippingFee > 0 ? (
                <div className="flex items-center justify-between gap-3 text-[12px]">
                  <dt className="text-ink-2">Ongkir</dt>
                  <dd className="tabular font-medium">{rupiah(order.shippingFee)}</dd>
                </div>
              ) : null}
              {order.shippingDiscount > 0 ? (
                <div className="flex items-center justify-between gap-3 text-[12px]">
                  <dt className="text-ink-2">Potongan gratis ongkir</dt>
                  <dd className="tabular font-medium text-brand">
                    −{rupiah(order.shippingDiscount)}
                  </dd>
                </div>
              ) : null}
              <div className="flex items-center justify-between gap-3 text-[13px]">
                <dt className="text-ink-2">Total</dt>
                <dd className="tabular font-bold">{rupiah(order.total)}</dd>
              </div>
            </dl>
          </section>

          <section className="mt-3 rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[12.5px] font-bold">Alamat pengiriman</h2>
              <span className="text-[10.5px] font-bold text-brand">{order.address.label}</span>
            </div>
            <p className="mt-1.5 text-[11.5px] font-semibold">
              {order.address.recipientName} · {order.address.phone}
            </p>
            <p className="mt-1 text-[10.5px] leading-[1.5] text-ink-3">
              {order.address.addressLine}
            </p>
            {order.address.notes ? (
              <p className="mt-1 text-[10.5px] leading-[1.5] text-ink-3">
                Catatan: {order.address.notes}
              </p>
            ) : null}
            <p className="mt-2 text-[10.5px] font-semibold text-ink-2">
              Dikirim {order.deliveryDateLabel}
            </p>
          </section>

          <section className="mt-3 rounded-2xl border border-border bg-surface p-4">
            <h2 className="text-[12.5px] font-bold">Pembayaran</h2>
            <dl className="mt-2 space-y-2">
              <div className="flex items-center justify-between gap-3 text-[12px]">
                <dt className="text-ink-2">Metode</dt>
                <dd className="font-medium">{order.paymentMethod ?? "—"}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 text-[12px]">
                <dt className="text-ink-2">{order.paidLabel ? "Dibayar" : "Status"}</dt>
                <dd className="text-right font-medium">
                  {order.paidLabel ?? orderStatusMeta[order.status].label}
                </dd>
              </div>
            </dl>
            <p className="mt-2 text-[10px] leading-[1.45] text-ink-3">
              {orderStatusMeta[order.status].note}
            </p>
          </section>

          {order.note ? (
            <p className="mt-3 rounded-[14px] bg-surface-2 px-3 py-2.5 text-[10.5px] leading-[1.45] text-ink-2">
              Catatan untuk kurir: {order.note}
            </p>
          ) : null}

          <div className="mt-3 flex gap-2.5 rounded-[14px] bg-surface-2 px-3 py-3">
            <span className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full bg-white/70 text-ink-2">
              <Phone size={14} />
            </span>
            <div>
              <p className="text-[11.5px] font-bold text-ink-2">Ada yang tidak sesuai?</p>
              <p className="mt-0.5 text-[10.5px] leading-[1.45] text-ink-2">
                Hubungi toko di {storeFacts.phone}. Pembatalan dan pengembalian dana hanya lewat
                admin.
              </p>
            </div>
          </div>

          <p className="mt-3 flex items-start gap-2 px-1 text-[10px] leading-[1.45] text-ink-3">
            <MapPin size={13} className="mt-0.5 shrink-0" />
            Pesanan lama menyimpan salinan alamatnya sendiri, jadi perubahan alamat tidak mengubah
            pesanan ini.
          </p>
        </div>
      </main>

      {pending ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface">
          <div className="page py-3 pb-[calc(18px+env(safe-area-inset-bottom))]">
            <Link
              href={`/checkout/payment?order=${order.number}`}
              className="btn-primary w-full"
            >
              Coba bayar lagi
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
