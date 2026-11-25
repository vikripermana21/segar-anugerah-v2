import type { Metadata } from "next";
import Link from "../../_components/transition-link";
import { notFound, redirect } from "next/navigation";
import { Check, Clock, Info, Phone, X } from "lucide-react";

import { requireCustomer } from "@/lib/customer-guard";
import { getStoreSettings } from "@/lib/catalog";
import { getCustomerOrder } from "@/lib/order-view";
import { orderStatusMeta, type OrderStatus } from "@/lib/order-status";
import { rupiah } from "@/lib/store-data";
import { bankLines, whatsappOrderUrl } from "@/lib/whatsapp-order";

import { PageBar } from "../../_components/app-bar";

export const metadata: Metadata = {
  title: "Hasil pesanan",
};

type SearchParams = Promise<{ order?: string; order_id?: string }>;

const successStatuses: OrderStatus[] = ["paid", "processing", "out_for_delivery", "completed"];

function headline(
  status: OrderStatus,
  whatsappPending: boolean,
): {
  title: string;
  body: string;
  tone: "success" | "waiting" | "failed";
} {
  if (whatsappPending) {
    return {
      title: "Pesanan sudah dibuat",
      body: "Kirim ringkasan pesanan ke WhatsApp toko. Stok ditahan 12 jam sampai transfer dikonfirmasi.",
      tone: "waiting",
    };
  }
  if (successStatuses.includes(status)) {
    return {
      title: "Pembayaran berhasil",
      body: "Pesanan sudah dibayar dan diteruskan ke toko.",
      tone: "success",
    };
  }
  if (status === "pending_payment") {
    return {
      title: "Pembayaran belum selesai",
      body: "Kalau sudah membayar, status akan menyusul otomatis setelah konfirmasi Midtrans.",
      tone: "waiting",
    };
  }
  if (status === "paid_late") {
    return {
      title: "Pembayaran perlu ditinjau",
      body: "Pembayaran masuk setelah pesanan kedaluwarsa. Toko akan menghubungi Anda.",
      tone: "waiting",
    };
  }
  return {
    title: status === "expired" ? "Pesanan kedaluwarsa" : "Pesanan tidak dilanjutkan",
    body:
      status === "expired"
        ? "Batas pembayaran lewat. Stok sudah dikembalikan ke toko."
        : "Pesanan dibatalkan. Stok sudah dikembalikan ke toko.",
    tone: "failed",
  };
}

export default async function PaymentResultPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  // Snap menambahkan `order_id` sendiri saat mengalihkan ke URL dashboard.
  const orderNumber = params.order ?? params.order_id;
  if (!orderNumber) redirect("/account/orders");

  const session = await requireCustomer(`/account/orders/${orderNumber}`);
  const order = await getCustomerOrder(session.id, orderNumber);
  if (!order) notFound();

  const settings = await getStoreSettings();
  const whatsappPending =
    order.status === "pending_payment" && order.paymentMethod === "whatsapp";
  const waUrl = whatsappPending ? whatsappOrderUrl(order, settings) : null;

  const info = headline(order.status, whatsappPending);
  const paid = successStatuses.includes(order.status);
  const bank = bankLines(settings);

  return (
    <div className="min-h-dvh">
      <PageBar
        title={whatsappPending ? "Konfirmasi" : "Pembayaran"}
        backHref="/account/orders"
        backLabel="Tutup"
        close
      />

      <main className="page pb-10 pt-2">
        <div className="mx-auto max-w-[520px]">
          <section className="flex flex-col items-center gap-2 pt-4 text-center">
            <span
              className={`grid h-[76px] w-[76px] place-items-center rounded-full ${
                info.tone === "success"
                  ? "bg-brand-soft text-brand"
                  : info.tone === "waiting"
                    ? "bg-accent-soft text-accent"
                    : "bg-surface-2 text-ink-2"
              }`}
            >
              {info.tone === "success" ? (
                <Check size={32} strokeWidth={2.2} />
              ) : info.tone === "waiting" ? (
                <Clock size={30} strokeWidth={2} />
              ) : (
                <X size={30} strokeWidth={2} />
              )}
            </span>
            <h1 className="mt-1 font-display text-[24px] font-semibold">{info.title}</h1>
            <p className="max-w-[38ch] text-[11.5px] leading-[1.5] text-ink-2">{info.body}</p>
          </section>

          {whatsappPending ? (
            <section className="mt-3 rounded-2xl border border-border bg-surface p-4">
              <h2 className="text-[12.5px] font-bold">Transfer bank</h2>
              {bank.length > 0 ? (
                <div className="mt-2">
                  {bank.map((line) => (
                    <p key={line} className="text-[12.5px] font-semibold">
                      {line}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="mt-1.5 text-[11px] leading-[1.45] text-ink-3">
                  Detail rekening dikirim toko lewat WhatsApp.
                </p>
              )}
              <p className="mt-2 text-[10.5px] leading-[1.45] text-ink-3">
                Kirim bukti transfer di chat WhatsApp. Pesanan dibatalkan otomatis setelah 12 jam
                tanpa konfirmasi.
              </p>
            </section>
          ) : null}

          <section className="mt-4 rounded-2xl border border-border bg-surface p-4">
            <dl className="space-y-2.5">
              {[
                ["Nomor pesanan", order.number],
                [paid ? "Total dibayar" : "Total pesanan", rupiah(order.total)],
                [
                  "Metode",
                  order.paymentMethod === "whatsapp" ? "Transfer bank" : (order.paymentMethod ?? "—"),
                ],
                [
                  paid ? "Dibayar" : "Status",
                  order.paidLabel ??
                    (whatsappPending
                      ? "Menunggu konfirmasi"
                      : orderStatusMeta[order.status].label),
                ],
                ["Dikirim", order.deliveryDateLabel],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3 text-[12px]">
                  <dt className="text-ink-2">{label}</dt>
                  <dd
                    className={`tabular text-right ${
                      label === "Nomor pesanan" ? "font-bold" : "font-medium"
                    }`}
                  >
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          {whatsappPending && waUrl ? (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary mt-4 w-full"
            >
              Buka WhatsApp toko
            </a>
          ) : order.status === "pending_payment" ? (
            <Link href={`/checkout/payment?order=${order.number}`} className="btn-primary mt-4 w-full">
              Lanjutkan pembayaran
            </Link>
          ) : (
            <Link href={`/account/orders/${order.number}`} className="btn-primary mt-4 w-full">
              Lihat pesanan
            </Link>
          )}

          {whatsappPending ? (
            <Link href={`/account/orders/${order.number}`} className="btn-secondary mt-2.5 w-full">
              Lihat pesanan
            </Link>
          ) : (
            <Link href="/account/orders" className="btn-secondary mt-2.5 w-full">
              Semua pesanan
            </Link>
          )}

          <div className="mt-4 flex gap-2.5 rounded-[14px] bg-surface-2 px-3 py-3">
            <span className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full bg-white/70 text-ink-2">
              <Info size={14} />
            </span>
            <p className="text-[10.5px] leading-[1.45] text-ink-2">
              {whatsappPending
                ? "Pesanan dianggap dibayar setelah admin mengonfirmasi transfer. Stok ditahan sampai konfirmasi atau 12 jam."
                : "Pesanan baru dianggap dibayar setelah Midtrans mengirim konfirmasi. Kalau status belum berubah, muat ulang halaman ini beberapa saat lagi."}
            </p>
          </div>

          <p className="mt-4 flex items-center justify-center gap-2 text-[10px] text-ink-3">
            <Phone size={12} />
            Butuh bantuan? Hubungi admin toko.
          </p>
        </div>
      </main>
    </div>
  );
}
