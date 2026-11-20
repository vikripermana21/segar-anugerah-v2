"use client";

import Image from "next/image";
import Link from "./transition-link";
import { ArrowRight, Info, ShoppingBag, Trash2 } from "lucide-react";
import { freeShippingLabel } from "@/lib/catalog-types";
import { rupiah } from "@/lib/store-data";
import { useCart, useStoreSettings } from "../cart";
import QtyStepper from "./qty-stepper";
import TabBar from "./tab-bar";
import { EmptyState, FreeShippingNote } from "./ui";

export function CartCount() {
  const { count, ready } = useCart();
  return (
    <span className="shrink-0 text-[11.5px] text-ink-2">
      {ready && count > 0 ? `${count} barang` : ""}
    </span>
  );
}

export default function CartView() {
  const { lines, count, subtotal, ready, setQuantity, remove } = useCart();
  const settings = useStoreSettings();
  const outLines = lines.filter((line) => line.out);

  if (!ready) {
    return (
      <main className="page pt-2" aria-busy="true" aria-label="Memuat keranjang">
        <div className="h-[120px] animate-pulse rounded-2xl bg-surface-2" />
      </main>
    );
  }

  if (count === 0) {
    return (
      <>
        <main className="page pb-[calc(96px+env(safe-area-inset-bottom))] pt-1 lg:pb-16">
          <EmptyState
            icon={ShoppingBag}
            title="Keranjang masih kosong"
            action="Lihat produk"
            actionHref="/products"
          >
            Produk yang Anda tambahkan muncul di sini. Keranjang tersimpan di perangkat ini.
          </EmptyState>
          <p className="flex items-start gap-2 px-2.5 text-[10.5px] leading-[1.45] text-ink-3">
            <Info size={13} className="mt-0.5 shrink-0" />
            Keranjang tidak menyimpan stok. Barang bisa habis sebelum Anda checkout.
          </p>
        </main>
        <TabBar />
      </>
    );
  }

  return (
    <>
      <main className="page pb-[calc(104px+env(safe-area-inset-bottom))] pt-1 lg:pb-16">
        {outLines.length > 0 ? (
          <div className="mb-3 flex gap-2.5 rounded-[14px] bg-danger-soft px-3 py-3">
            <span className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full bg-white/70 text-danger">
              <Info size={14} />
            </span>
            <div>
              <p className="text-[11.5px] font-bold text-danger">
                {outLines[0].product.name} {outLines[0].variant.label} baru saja habis
              </p>
              <p className="mt-0.5 text-[10.5px] leading-[1.45] text-[#7a4638]">
                Baris ini tidak dihitung ke subtotal. Hapus, atau pilih ukuran lain.
              </p>
            </div>
          </div>
        ) : null}

        <div className="lg:grid lg:grid-cols-[1.4fr_1fr] lg:items-start lg:gap-8">
          <div>
            <div className="overflow-hidden rounded-2xl border border-border bg-surface">
              {lines.map((line, index) => (
                <div
                  key={line.variant.id}
                  className={`flex gap-3 px-3 py-3 ${
                    index > 0 ? "border-t border-border" : ""
                  }`}
                >
                  <div
                    className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-[11px] bg-surface-2 ${
                      line.out ? "opacity-55" : ""
                    }`}
                  >
                    <Image
                      src={line.product.image}
                      alt={line.product.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-[12.5px] font-bold ${
                        line.out ? "text-ink-2" : "text-ink"
                      }`}
                    >
                      {line.product.name}
                    </p>
                    <p className="mt-0.5 text-[10.5px] text-ink-3">
                      {line.variant.label} · {rupiah(line.variant.price)}
                    </p>

                    {line.out ? (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="pill border border-border bg-surface-2 text-ink-2">
                          Habis
                        </span>
                        <Link
                          href={`/products/${line.product.slug}`}
                          className="text-[10.5px] font-bold text-brand"
                        >
                          Pilih ukuran lain
                        </Link>
                      </div>
                    ) : (
                      <div className="mt-2">
                        <QtyStepper
                          value={line.quantity}
                          onChange={(value) => setQuantity(line.variant.id, value)}
                          max={line.variant.stock}
                          min={0}
                          label={`${line.product.name} ${line.variant.label}`}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end justify-between gap-2">
                    <p className="tabular text-[12px] font-bold">
                      {line.out ? rupiah(line.variant.price) : rupiah(line.lineTotal)}
                    </p>
                    <button
                      type="button"
                      onClick={() => remove(line.variant.id)}
                      aria-label={`Hapus ${line.product.name} ${line.variant.label}`}
                      className="grid h-[22px] w-[22px] place-items-center rounded-[7px] text-ink-3 hover:bg-surface-2 hover:text-danger"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-3 flex items-start gap-2 px-0.5 text-[10.5px] leading-[1.4] text-ink-3">
              <Info size={13} className="mt-0.5 shrink-0" />
              Harga di keranjang hanya tampilan. Checkout mengambil harga terbaru dari database.
            </p>
          </div>

          <div className="mt-3 space-y-3 lg:mt-0">
            <div className="rounded-2xl border border-border bg-surface p-4">
              <h2 className="text-[13px] font-bold">Ringkasan</h2>
              <dl className="mt-2.5 space-y-2">
                <div className="flex items-center justify-between gap-3 text-[12px]">
                  <dt className="text-ink-2">
                    Subtotal
                    {outLines.length > 0
                      ? ` (${lines.filter((line) => !line.out).length} barang)`
                      : ""}
                  </dt>
                  <dd className="tabular font-medium">{rupiah(subtotal)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 text-[12px]">
                  <dt className="text-ink">Ongkir</dt>
                  <dd className="font-medium text-brand">Dihitung di checkout</dd>
                </div>
                <div className="h-px bg-border" />
                <div className="flex items-center justify-between gap-3 text-[13px]">
                  <dt className="text-ink-2">Total sementara</dt>
                  <dd className="tabular font-bold">{rupiah(subtotal)}</dd>
                </div>
              </dl>
            </div>

            <FreeShippingNote>{freeShippingLabel(settings)}</FreeShippingNote>
          </div>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface">
        <div className="page flex items-center justify-between gap-3 py-3 pb-[calc(18px+env(safe-area-inset-bottom))]">
          <div className="min-w-0">
            <p className="text-[10.5px] text-ink-3">Total</p>
            <p className="tabular text-[16px] font-bold">{rupiah(subtotal)}</p>
          </div>
          <Link href="/checkout" className="btn-primary min-w-[180px] flex-1 sm:flex-none">
            Checkout
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </>
  );
}
