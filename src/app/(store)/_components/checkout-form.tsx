"use client";

import Link from "./transition-link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronDown, MapPin, ShoppingBag, Truck } from "lucide-react";

import type { AddressRow, DeliveryArea } from "@/lib/address-types";
import { freeShippingLabel } from "@/lib/catalog-types";
import { deliveryWindow, shippingFor } from "@/lib/shipping";
import { rupiah } from "@/lib/store-data";
import { useCart, useStoreSettings } from "../cart";
import CheckoutSteps from "./checkout-steps";
import { EmptyState, FreeShippingNote } from "./ui";

export default function CheckoutForm({
  addresses,
  areas,
}: {
  addresses: AddressRow[];
  areas: DeliveryArea[];
}) {
  const router = useRouter();
  const { count, subtotal, ready } = useCart();
  const settings = useStoreSettings();

  const defaultAddress = addresses.find((address) => address.isDefault) ?? addresses[0];
  const [addressId, setAddressId] = useState(defaultAddress?.id ?? "");
  const [kecamatan, setKecamatan] = useState(defaultAddress?.kecamatan ?? areas[0]?.kecamatan ?? "");
  const [note, setNote] = useState("");
  const [delivery, setDelivery] = useState<{ shipsToday: boolean; dateLabel: string } | null>(null);

  useEffect(() => {
    // Tanggal dikirim baru diketahui di perangkat, bukan saat prerender.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDelivery(deliveryWindow(settings.cutoffHour));
  }, [settings.cutoffHour]);

  if (!ready) {
    return <main className="page pt-2"><div className="h-[120px] animate-pulse rounded-2xl bg-surface-2" /></main>;
  }

  if (addresses.length === 0) {
    return (
      <main className="page pb-10 pt-1">
        <EmptyState
          icon={MapPin}
          title="Belum ada alamat pengiriman"
          action="Tambah alamat"
          actionHref="/account/addresses"
        >
          Simpan alamat dulu, lalu kembali ke keranjang untuk menyelesaikan pesanan.
        </EmptyState>
      </main>
    );
  }

  if (count === 0) {
    return (
      <main className="page pb-10 pt-1">
        <EmptyState
          icon={ShoppingBag}
          title="Keranjang masih kosong"
          action="Lihat produk"
          actionHref="/products"
        >
          Tambahkan barang dulu sebelum mengisi alamat pengiriman.
        </EmptyState>
      </main>
    );
  }

  const area =
    areas.find((option) => option.kecamatan === kecamatan) ?? areas[0] ?? null;
  const shipping = shippingFor(subtotal, area?.fee ?? 0, settings);

  function selectAddress(address: AddressRow) {
    setAddressId(address.id);
    if (areas.some((option) => option.kecamatan === address.kecamatan)) {
      setKecamatan(address.kecamatan);
    }
  }

  function goToPayment() {
    if (!area) return;
    const params = new URLSearchParams({
      address: addressId,
      kecamatan: area.kecamatan,
      city: area.city,
    });
    if (note.trim()) params.set("note", note.trim());
    router.push(`/checkout/payment?${params.toString()}`);
  }

  return (
    <>
      <main className="page pb-[calc(104px+env(safe-area-inset-bottom))] pt-1 lg:pb-16">
        <div className="lg:grid lg:grid-cols-[1.4fr_1fr] lg:items-start lg:gap-8">
          <div className="space-y-4">
            <CheckoutSteps step={1} label="Alamat & pengiriman" />

            <section>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[13px] font-bold">Alamat pengiriman</h2>
                <Link href="/account/addresses" className="text-[11px] font-bold text-brand">
                  + Tambah
                </Link>
              </div>

              <div className="mt-2.5 space-y-2">
                {addresses.map((address) => {
                  const selected = address.id === addressId;
                  return (
                    <button
                      key={address.id}
                      type="button"
                      onClick={() => selectAddress(address)}
                      aria-pressed={selected}
                      className={`flex w-full gap-2.5 rounded-[14px] border px-3 py-3 text-left transition-colors ${
                        selected
                          ? "border-[1.5px] border-brand bg-brand-soft"
                          : "border-border bg-surface hover:bg-surface-2"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`mt-0.5 h-[18px] w-[18px] shrink-0 rounded-full bg-surface ${
                          selected ? "border-[5px] border-brand" : "border-[1.5px] border-border"
                        }`}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="text-[12.5px] font-bold">{address.label}</span>
                          {address.isDefault ? (
                            <span className="pill bg-brand text-cream">Utama</span>
                          ) : null}
                        </span>
                        <span className="mt-1 block text-[11px] text-ink-2">
                          {address.recipientName} · {address.phone}
                        </span>
                        <span className="mt-1 block text-[10.5px] leading-[1.45] text-ink-3">
                          {address.addressLine}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section>
              <label htmlFor="zone" className="text-[13px] font-bold">
                Kecamatan pengiriman
              </label>
              <div className="relative mt-1.5">
                <select
                  id="zone"
                  value={area?.kecamatan ?? ""}
                  onChange={(event) => setKecamatan(event.target.value)}
                  className="field h-[46px] appearance-none pr-10 text-[13px]"
                >
                  {areas.map((option) => (
                    <option key={`${option.kecamatan}|${option.city}`} value={option.kecamatan}>
                      {option.kecamatan} · {option.city}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-2"
                />
              </div>
              <p className="mt-1.5 text-[10.5px] text-ink-3">
                Kecamatan menentukan zona dan tarif ongkir.
              </p>
            </section>

            <section>
              <label htmlFor="note" className="text-[11.5px] font-bold text-ink-2">
                Catatan untuk kurir (opsional)
              </label>
              <textarea
                id="note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Contoh: titip ke penjaga, pagar hijau"
                rows={3}
                className="field mt-1.5 h-[74px] resize-none py-2.5 text-[12px]"
              />
            </section>
          </div>

          <div className="mt-4 space-y-3 lg:mt-0">
            <div className="rounded-2xl border border-border bg-surface p-4">
              <h2 className="text-[13px] font-bold">Ringkasan</h2>
              <dl className="mt-2.5 space-y-2">
                <div className="flex items-center justify-between gap-3 text-[12px]">
                  <dt className="text-ink-2">Subtotal</dt>
                  <dd className="tabular font-medium">{rupiah(subtotal)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 text-[12px]">
                  <dt className="text-ink">Ongkir {area?.kecamatan ?? "—"}</dt>
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
                  <dt className="text-ink-2">Total</dt>
                  <dd className="tabular font-bold">{rupiah(shipping.total)}</dd>
                </div>
              </dl>
              <div className="mt-3 flex gap-2.5 border-t border-border pt-3">
                <Truck size={15} className="mt-0.5 shrink-0 text-ink-2" />
                <div>
                  <p className="text-[11.5px] font-bold">
                    Dikirim {delivery?.shipsToday === false ? "besok" : "hari ini"}
                    {delivery ? `, ${delivery.dateLabel}` : ""}
                  </p>
                  <p className="mt-0.5 text-[10.5px] leading-[1.4] text-ink-3">
                    Pesanan setelah pukul {settings.cutoffHour}.00 WIB dikirim besok.
                  </p>
                </div>
              </div>
            </div>

            <FreeShippingNote>
              {freeShippingLabel(settings)}, termasuk {area?.kecamatan ?? "kecamatan Anda"}.
            </FreeShippingNote>

            <p className="flex items-start gap-2 px-1 text-[10.5px] leading-[1.45] text-ink-3">
              <MapPin size={13} className="mt-0.5 shrink-0" />
              Pesanan dikirim oleh kurir toko. Tarif ongkir mengikuti kecamatan yang dipilih.
            </p>
          </div>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface">
        <div className="page py-3 pb-[calc(18px+env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={goToPayment}
            disabled={!area}
            className="btn-primary w-full"
          >
            {settings.paymentMode === "whatsapp"
              ? "Lanjut konfirmasi pesanan"
              : "Lanjut ke pembayaran"}
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </>
  );
}
