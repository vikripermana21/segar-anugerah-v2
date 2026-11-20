"use client";

import Link from "./transition-link";
import { useRef, useState } from "react";
import { Clock, Info, MapPin, ShoppingBag, Truck } from "lucide-react";

import type { AddressRow, DeliveryArea } from "@/lib/address-types";
import type { OrderDetail } from "@/lib/order-view";
import { shippingFor } from "@/lib/shipping";
import { rupiah } from "@/lib/store-data";
import { useCart, useStoreSettings } from "../cart";
import CheckoutSteps from "./checkout-steps";
import { EmptyState } from "./ui";

export type PaymentCheckout = { address: AddressRow; area: DeliveryArea };

type Props =
  | { order: OrderDetail; checkout?: undefined; note?: undefined }
  | { checkout: PaymentCheckout; note?: string; order?: undefined };

type PayError = { message: string; outOfStock?: string[]; code?: string };

async function postJson<T>(url: string, body: unknown): Promise<{ status: number; data: T }> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await response.json().catch(() => ({}))) as T;
  return { status: response.status, data };
}

export default function PaymentView(props: Props) {
  const existing = props.order ?? null;
  const checkout = props.checkout ?? null;
  const { lines, count, subtotal, ready, clear } = useCart();
  const settings = useStoreSettings();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<PayError | null>(null);
  const idempotencyKey = useRef<string | null>(null);

  const playableLines = existing
    ? existing.items.map((item) => ({
        key: item.key,
        label: `${item.quantity} × ${item.name} ${item.variant}`,
        amount: item.lineTotal,
      }))
    : lines
        .filter((line) => !line.out)
        .map((line) => ({
          key: line.variant.id,
          label: `${line.quantity} × ${line.product.name} ${line.variant.label}`,
          amount: line.lineTotal,
        }));

  const outLines = existing ? [] : lines.filter((line) => line.out);

  const estimate = shippingFor(subtotal, checkout?.area.fee ?? 0, settings);
  const subtotalValue = existing ? existing.subtotal : subtotal;
  const shippingFee = existing ? existing.shippingFee : estimate.fee;
  const shippingDiscount = existing ? existing.shippingDiscount : estimate.discount;
  const total = existing ? existing.total : estimate.total;

  if (!existing && !ready) {
    return <main className="page pt-2"><div className="h-[120px] animate-pulse rounded-2xl bg-surface-2" /></main>;
  }

  if (!existing && count === 0) {
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

  const address = existing
    ? {
        label: existing.address.label,
        kecamatan: existing.address.kecamatan,
        addressLine: existing.address.addressLine,
      }
    : {
        label: checkout!.address.label,
        kecamatan: checkout!.area.kecamatan,
        addressLine: checkout!.address.addressLine,
      };

  async function pay() {
    if (processing) return;
    setError(null);
    setProcessing(true);

    try {
      let orderNumber = existing?.number;

      if (!orderNumber) {
        const key = idempotencyKey.current ?? crypto.randomUUID();
        idempotencyKey.current = key;

        const created = await postJson<
          | { ok: true; orderNumber: string }
          | { ok: false; code?: string; message?: string; outOfStock?: string[] }
        >("/api/checkout", {
          addressId: checkout!.address.id,
          kecamatan: checkout!.area.kecamatan,
          city: checkout!.area.city,
          note: props.note || undefined,
          idempotencyKey: key,
          items: lines
            .filter((line) => !line.out)
            .map((line) => ({ variantId: line.variant.id, quantity: line.quantity })),
        });

        if (!created.data.ok) {
          setError({
            message: created.data.message ?? "Pesanan gagal dibuat.",
            outOfStock: created.data.outOfStock,
            code: created.data.code,
          });
          setProcessing(false);
          return;
        }
        orderNumber = created.data.orderNumber;
      }

      const snap = await postJson<{ ok: boolean; redirectUrl?: string; message?: string }>(
        "/api/payments/snap",
        { orderNumber },
      );

      if (!snap.data.ok || !snap.data.redirectUrl) {
        setError({ message: snap.data.message ?? "Pembayaran gagal dibuka." });
        setProcessing(false);
        return;
      }

      if (!existing) clear();
      window.location.assign(snap.data.redirectUrl);
    } catch {
      setError({ message: "Jaringan bermasalah. Coba lagi." });
      setProcessing(false);
    }
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
                {playableLines.map((line) => (
                  <li
                    key={line.key}
                    className="flex items-center justify-between gap-3 text-[12px]"
                  >
                    <span className="text-ink-2">{line.label}</span>
                    <span className="tabular font-medium">{rupiah(line.amount)}</span>
                  </li>
                ))}
              </ul>
              {props.note ? (
                <p className="mt-2.5 border-t border-border pt-2.5 text-[10px] leading-[1.45] text-ink-3">
                  Catatan kurir: {props.note}
                </p>
              ) : null}
              {existing?.note ? (
                <p className="mt-2.5 border-t border-border pt-2.5 text-[10px] leading-[1.45] text-ink-3">
                  Catatan kurir: {existing.note}
                </p>
              ) : null}
            </section>

            {processing ? (
              <div className="flex gap-2.5 rounded-[14px] bg-surface-2 px-3 py-3">
                <span className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full bg-white/70 text-ink-2">
                  <Info size={14} />
                </span>
                <div>
                  <p className="text-[11.5px] font-bold text-ink-2">Menyiapkan pembayaran</p>
                  <p className="mt-0.5 text-[10.5px] leading-[1.45] text-ink-2">
                    Jangan tutup halaman ini. Stok dikunci saat pesanan dibuat.
                  </p>
                </div>
              </div>
            ) : null}

            {error ? (
              <div role="alert" className="rounded-[14px] bg-danger-soft px-3 py-3">
                <p className="text-[11.5px] font-bold text-danger">{error.message}</p>
                {error.outOfStock?.length ? (
                  <p className="mt-0.5 text-[10.5px] leading-[1.45] text-[#7a4638]">
                    Stok kurang: {error.outOfStock.join(", ")}.{" "}
                    <Link href="/cart" className="font-bold text-danger">
                      Ubah keranjang
                    </Link>
                  </p>
                ) : null}
                {error.code === "too_many_pending" ? (
                  <p className="mt-0.5 text-[10.5px] leading-[1.45] text-[#7a4638]">
                    <Link href="/account/orders" className="font-bold text-danger">
                      Lihat pesanan yang belum dibayar
                    </Link>
                  </p>
                ) : null}
              </div>
            ) : null}

            <section className="rounded-2xl border border-border bg-surface p-4">
              <h2 className="text-[12.5px] font-bold">Total</h2>
              <dl className="mt-2.5 space-y-2">
                <div className="flex items-center justify-between gap-3 text-[12px]">
                  <dt className="text-ink-2">Subtotal</dt>
                  <dd className="tabular font-medium">{rupiah(subtotalValue)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 text-[12px]">
                  <dt className="text-ink-2">Ongkir {address.kecamatan}</dt>
                  <dd className="tabular font-medium">{rupiah(shippingFee)}</dd>
                </div>
                {shippingDiscount > 0 ? (
                  <div className="flex items-center justify-between gap-3 text-[12px]">
                    <dt className="text-ink-2">Potongan gratis ongkir</dt>
                    <dd className="tabular font-medium text-brand">
                      −{rupiah(shippingDiscount)}
                    </dd>
                  </div>
                ) : null}
                <div className="h-px bg-border" />
                <div className="flex items-center justify-between gap-3 text-[15px]">
                  <dt className="text-ink-2">Bayar</dt>
                  <dd className="tabular font-bold">{rupiah(total)}</dd>
                </div>
              </dl>
            </section>

            <div className="flex gap-2.5 px-0.5">
              <Truck size={15} className="mt-0.5 shrink-0 text-ink-2" />
              <div>
                <p className="text-[11.5px] font-bold">
                  {existing
                    ? `Dikirim ${existing.deliveryDateLabel}`
                    : "Dikirim sesuai jadwal toko"}
                </p>
                <p className="mt-0.5 text-[10.5px] leading-[1.4] text-ink-3">
                  Pesanan setelah pukul {settings.cutoffHour}.00 WIB dikirim besok.
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
                  {existing?.expiresLabel
                    ? `Stok ditahan sampai ${existing.expiresLabel}.`
                    : "Stok ditahan 30 menit setelah pesanan dibuat."}{" "}
                  Lewat itu pesanan kedaluwarsa dan stok dilepas.
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
          {playableLines.length === 0 ? (
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
                `Bayar ${rupiah(total)}`
              )}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
