"use client";

import Link from "./transition-link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Clock, Info, MapPin, ShoppingBag, Truck } from "lucide-react";
import type { AddressRow, DeliveryArea } from "@/lib/address-types";
import {
  addressById,
  deliveryWindow,
  expiryTime,
  orderByNumber,
  rupiah,
  shippingFor,
  zoneByName,
} from "@/lib/store-data";
import { useCart } from "../cart";
import CheckoutSteps from "./checkout-steps";
import { EmptyState } from "./ui";

function newOrderNumber(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "00";
  const yymmdd = `${get("year").slice(2)}${get("month")}${get("day")}`;
  const suffix = String(Math.floor(1000 + Math.random() * 9000));
  return `SA-${yymmdd}-${suffix}`;
}

export type PaymentCheckout = { address: AddressRow; area: DeliveryArea };

export default function PaymentView({ checkout }: { checkout?: PaymentCheckout | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lines, count, subtotal, ready } = useCart();
  const [processing, setProcessing] = useState(false);
  const [expiry, setExpiry] = useState("");
  const [delivery, setDelivery] = useState<{ shipsToday: boolean; dateLabel: string } | null>(null);
  const timer = useRef<number | null>(null);

  const retryOrder = orderByNumber(searchParams.get("order") ?? "");
  const usingOrder = Boolean(retryOrder);
  const address = checkout?.address
    ? {
        label: checkout.address.label,
        kecamatan: checkout.address.kecamatan,
        addressLine: checkout.address.addressLine,
      }
    : addressById(searchParams.get("address") ?? retryOrder?.addressId ?? "rumah");
  const zoneName = checkout
    ? checkout.area.kecamatan
    : zoneByName(searchParams.get("zone") ?? address.kecamatan).name;
  const zoneFee = checkout
    ? checkout.area.fee
    : zoneByName(searchParams.get("zone") ?? address.kecamatan).fee;
  const note = searchParams.get("note") ?? "";
  const paySubtotal = retryOrder ? retryOrder.subtotal : subtotal;
  const shipping = shippingFor(paySubtotal, zoneFee);
  const outLines = usingOrder ? [] : lines.filter((line) => line.out);
  const payLines = retryOrder
    ? retryOrder.items.map((item) => ({
        key: `${item.name}-${item.variant}`,
        label: `${item.quantity} × ${item.name}${item.variant ? ` ${item.variant}` : ""}`,
        amount: item.lineTotal,
      }))
    : lines
        .filter((line) => !line.out)
        .map((line) => ({
          key: line.variant.id,
          label: `${line.quantity} × ${line.product.name} ${line.variant.label}`,
          amount: line.lineTotal,
        }));

  useEffect(() => {
    // Waktu dihitung setelah mount: jam server dan jam perangkat bisa berbeda,
    // dan teks waktu tidak boleh memecah hidrasi.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setExpiry(expiryTime());
    setDelivery(deliveryWindow());
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  if (!ready) {
    return <main className="page pt-2"><div className="h-[120px] animate-pulse rounded-2xl bg-surface-2" /></main>;
  }

  if (count === 0 && !usingOrder) {
    return (
      <main className="page pb-10 pt-1">
        <EmptyState
          icon={ShoppingBag}
          title="Keranjang masih kosong"
          action="Lihat produk"
          actionHref="/products"
        >
          Tambahkan barang dulu sebelum melanjutkan ke pembayaran.
        </EmptyState>
      </main>
    );
  }

  function pay() {
    if (processing || payLines.length === 0) return;
    setProcessing(true);
    const total = shipping.total;
    timer.current = window.setTimeout(() => {
      const number = newOrderNumber(new Date());
      const params = new URLSearchParams({ order: number, total: String(total) });
      if (!usingOrder) params.set("paid", "1");
      router.push(`/checkout/result?${params.toString()}`);
    }, 1400);
  }

  return (
    <>
      <main className="page pb-[calc(104px+env(safe-area-inset-bottom))] pt-1 lg:pb-16">
        <div className="lg:grid lg:grid-cols-[1.4fr_1fr] lg:items-start lg:gap-8">
          <div className="space-y-4">
            <CheckoutSteps step={2} label="Pembayaran" />

            {outLines.length > 0 ? (
              <div className="flex gap-2.5 rounded-[14px] bg-danger-soft px-3 py-3">
                <span className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full bg-white/70 text-danger">
                  <Info size={14} />
                </span>
                <div>
                  <p className="text-[11.5px] font-bold text-danger">Stok baru saja habis</p>
                  <p className="mt-0.5 text-[10.5px] leading-[1.45] text-[#7a4638]">
                    {outLines
                      .map((line) => `${line.product.name} ${line.variant.label}`)
                      .join(", ")}{" "}
                    dikeluarkan dari pembayaran. Baris itu tidak dihitung ke total.
                  </p>
                  <Link href="/cart" className="mt-1.5 inline-block text-[10.5px] font-bold text-danger">
                    Kembali ke keranjang
                  </Link>
                </div>
              </div>
            ) : null}

            <div className="flex items-center gap-2.5 rounded-[14px] border border-border bg-surface px-3.5 py-3">
              <MapPin size={16} className="shrink-0 text-brand" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-[12px] font-bold">
                    {address.label} · {address.kecamatan}
                  </p>
                  <Link href="/checkout" className="text-[10.5px] font-bold text-brand">
                    Ubah
                  </Link>
                </div>
                <p className="mt-0.5 text-[10.5px] leading-[1.45] text-ink-3">
                  {address.addressLine}
                </p>
              </div>
            </div>

            <section className="rounded-2xl border border-border bg-surface p-4">
              <h2 className="text-[12.5px] font-bold">Barang</h2>
              <ul className="mt-2.5 space-y-2">
                {payLines.map((line) => (
                  <li
                    key={line.key}
                    className="flex items-center justify-between gap-3 text-[12px]"
                  >
                    <span className="text-ink-2">{line.label}</span>
                    <span className="tabular font-medium">{rupiah(line.amount)}</span>
                  </li>
                ))}
              </ul>
              {note ? (
                <p className="mt-2.5 border-t border-border pt-2.5 text-[10px] leading-[1.45] text-ink-3">
                  Catatan kurir: {note}
                </p>
              ) : null}
            </section>

            {processing ? (
              <div className="flex gap-2.5 rounded-[14px] bg-surface-2 px-3 py-3">
                <span className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full bg-white/70 text-ink-2">
                  <Info size={14} />
                </span>
                <div>
                  <p className="text-[11.5px] font-bold text-ink-2">Pesanan sedang dibuat</p>
                  <p className="mt-0.5 text-[10.5px] leading-[1.45] text-ink-2">
                    Jangan tutup halaman ini. Pesanan dan penguncian stok dibuat dalam satu
                    transaksi.
                  </p>
                </div>
              </div>
            ) : null}

            <section className="rounded-2xl border border-border bg-surface p-4">
              <h2 className="text-[12.5px] font-bold">Total</h2>
              <dl className="mt-2.5 space-y-2">
                <div className="flex items-center justify-between gap-3 text-[12px]">
                  <dt className="text-ink-2">Subtotal</dt>
                  <dd className="tabular font-medium">{rupiah(paySubtotal)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 text-[12px]">
                  <dt className="text-ink-2">Ongkir {zoneName}</dt>
                  <dd className="tabular font-medium">{rupiah(shipping.fee)}</dd>
                </div>
                {shipping.discount > 0 ? (
                  <div className="flex items-center justify-between gap-3 text-[12px]">
                    <dt className="text-ink-2">Potongan gratis ongkir</dt>
                    <dd className="tabular font-medium text-brand">
                      −{rupiah(shipping.discount)}
                    </dd>
                  </div>
                ) : null}
                <div className="h-px bg-border" />
                <div className="flex items-center justify-between gap-3 text-[15px]">
                  <dt className="text-ink-2">Bayar</dt>
                  <dd className="tabular font-bold">{rupiah(shipping.total)}</dd>
                </div>
              </dl>
            </section>

            <div className="flex gap-2.5 px-0.5">
              <Truck size={15} className="mt-0.5 shrink-0 text-ink-2" />
              <div>
                <p className="text-[11.5px] font-bold">
                  Dikirim {delivery?.shipsToday === false ? "besok" : "hari ini"}
                  {delivery ? `, ${delivery.dateLabel}` : ""}
                </p>
                <p className="mt-0.5 text-[10.5px] leading-[1.4] text-ink-3">
                  Pesanan setelah pukul 16.00 WIB dikirim besok.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-3 lg:mt-0">
            <section>
              <h2 className="text-[12.5px] font-bold">Metode pembayaran</h2>
              <p className="mt-1 text-[11.5px] text-ink-2">QRIS, e-wallet, atau Virtual Account</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {["QRIS", "GoPay", "BCA VA"].map((method) => (
                  <span
                    key={method}
                    className="flex h-[26px] items-center rounded-[7px] border border-border bg-surface px-2.5 text-[9.5px] font-bold text-ink-2"
                  >
                    {method}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-[10.5px] text-ink-3">
                Dipilih di halaman Midtrans setelah menekan Bayar.
              </p>
            </section>

            <div className="flex gap-2.5 rounded-[14px] bg-accent-soft px-3 py-3">
              <span className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full bg-white/70 text-accent">
                <Clock size={14} />
              </span>
              <div>
                <p className="text-[12px] font-bold text-accent">Bayar dalam 30 menit</p>
                <p className="mt-0.5 text-[11px] leading-[1.45] text-brand">
                  Stok ditahan sampai {expiry || "30 menit"} WIB. Lewat itu pesanan kedaluwarsa dan
                  stok dilepas.
                </p>
              </div>
            </div>

            <p className="flex items-start gap-2 px-1 text-[10.5px] leading-[1.45] text-ink-3">
              <Info size={13} className="mt-0.5 shrink-0" />
              Nominal dan nomor pesanan dibuat ulang bila pembayaran kedaluwarsa.
            </p>
          </div>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface">
        <div className="page py-3 pb-[calc(18px+env(safe-area-inset-bottom))]">
          {payLines.length === 0 ? (
            <Link href="/cart" className="btn-secondary w-full">
              Kembali ke keranjang
            </Link>
          ) : (
            <button
              type="button"
              onClick={pay}
              disabled={processing}
              className="btn-primary w-full"
            >
              {processing ? (
                <>
                  <span className="h-[15px] w-[15px] animate-spin rounded-full border-2 border-cream border-t-transparent" />
                  Memproses…
                </>
              ) : (
                `Bayar ${rupiah(shipping.total)}`
              )}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
