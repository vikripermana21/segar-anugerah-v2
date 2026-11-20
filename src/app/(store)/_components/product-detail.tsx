"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check } from "lucide-react";
import type { Product } from "@/lib/catalog-types";
import { rupiah } from "@/lib/store-data";
import { useCart } from "../cart";
import QtyStepper from "./qty-stepper";

const crops = ["50% 50%", "34% 42%", "66% 58%", "50% 68%"];

export default function ProductDetail({ product }: { product: Product }) {
  const { add } = useCart();
  const firstAvailable = product.variants.find((variant) => variant.stock > 0);
  const [variantId, setVariantId] = useState(firstAvailable?.id ?? product.variants[0].id);
  const [quantity, setQuantity] = useState(1);
  const [photo, setPhoto] = useState(0);
  const [added, setAdded] = useState(false);
  const timer = useRef<number | null>(null);

  const gallery = product.images.length
    ? product.images
    : [{ url: product.image, alt: product.name }];

  const variant = useMemo(
    () => product.variants.find((item) => item.id === variantId) ?? product.variants[0],
    [product.variants, variantId],
  );

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  function pickVariant(id: string) {
    setVariantId(id);
    setQuantity(1);
  }

  function handleAdd() {
    if (variant.stock <= 0) return;
    add(variant.id, quantity);
    setAdded(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setAdded(false), 1400);
  }

  return (
    <>
      <main className="page pb-[calc(104px+env(safe-area-inset-bottom))] pt-1 lg:pb-16">
        <div className="lg:grid lg:grid-cols-[1.05fr_1fr] lg:items-start lg:gap-10">
          <div className="lg:sticky lg:top-[82px]">
            <div className="relative h-[296px] overflow-hidden rounded-[18px] bg-surface-2 lg:h-[430px]">
              <Image
                src={gallery[Math.min(photo, gallery.length - 1)].url}
                alt={gallery[Math.min(photo, gallery.length - 1)].alt ?? product.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 560px"
                className="object-cover"
                style={{ objectPosition: crops[photo % crops.length] }}
              />
              <span className="absolute left-3 top-3 rounded-full bg-cream/90 px-2.5 py-1 text-[10px] font-bold text-ink-2 backdrop-blur">
                {Math.min(photo + 1, gallery.length)} / {gallery.length}
              </span>
            </div>

            <div className="mt-2 flex gap-2">
              {gallery.map((image, index) => (
                <button
                  key={`${image.url}-${index}`}
                  type="button"
                  onClick={() => setPhoto(index)}
                  aria-label={`Foto ${index + 1} dari ${product.name}`}
                  aria-pressed={photo === index}
                  className={`relative h-[58px] w-[58px] overflow-hidden rounded-xl border-2 bg-surface-2 ${
                    photo === index ? "border-brand" : "border-border"
                  }`}
                >
                  <Image
                    src={image.url}
                    alt=""
                    fill
                    sizes="58px"
                    className="object-cover"
                    style={{ objectPosition: crops[index % crops.length] }}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 lg:mt-0">
            <p className="text-[10.5px] font-bold tracking-[0.06em] text-accent uppercase">
              {product.categoryName} · per {product.unit}
            </p>
            <h1 className="mt-1 font-display text-[26px] font-semibold leading-tight">
              {product.name}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="tabular font-display text-[23px] font-semibold">
                {rupiah(variant.price)}
              </span>
              <span className="text-[10.5px] text-ink-3">/ {product.unit}</span>
              <span
                className={`pill ${
                  variant.stock > 0
                    ? "bg-brand-soft text-brand"
                    : "bg-surface-2 text-ink-2"
                }`}
              >
                {variant.stock > 0 ? `Stok ${variant.stock}` : "Habis"}
              </span>
            </div>

            <div className="my-4 h-px bg-border" />

            <fieldset>
              <legend className="text-[13px] font-bold">Pilih ukuran</legend>
              <div className="mt-2.5 flex flex-col gap-2">
                {product.variants.map((option) => {
                  const selected = option.id === variant.id;
                  const out = option.stock <= 0;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => pickVariant(option.id)}
                      disabled={out}
                      aria-pressed={selected}
                      className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                        selected
                          ? "border-[1.5px] border-brand bg-brand-soft"
                          : "border-border bg-surface hover:bg-surface-2"
                      } ${out ? "cursor-not-allowed opacity-80" : ""}`}
                    >
                      <span
                        aria-hidden="true"
                        className={`h-[18px] w-[18px] shrink-0 rounded-full bg-surface ${
                          selected
                            ? "border-[5px] border-brand"
                            : "border-[1.5px] border-border"
                        }`}
                      />
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block text-[12.5px] font-bold ${
                            out ? "text-ink-2" : "text-ink"
                          }`}
                        >
                          {option.label}
                        </span>
                        <span className="mt-0.5 block text-[10.5px] text-ink-3">
                          {rupiah(option.price)}
                          {out ? "" : ` · stok ${option.stock}`}
                        </span>
                      </span>
                      {out ? (
                        <span className="pill bg-surface-2 text-ink-2">Habis</span>
                      ) : null}
                      <span
                        className={`tabular shrink-0 text-[12px] font-bold ${
                          out ? "text-ink-3" : "text-ink"
                        }`}
                      >
                        {rupiah(option.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="mt-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-bold">Jumlah</p>
                <p className="text-[10.5px] text-ink-3">
                  {variant.stock > 0
                    ? `Maksimal ${variant.stock} untuk ukuran ini`
                    : "Ukuran ini sedang habis"}
                </p>
              </div>
              <QtyStepper
                value={quantity}
                onChange={setQuantity}
                min={1}
                max={Math.max(1, variant.stock)}
                size="md"
                label={`jumlah ${product.name} ${variant.label}`}
              />
            </div>

            <div className="mt-5">
              <h2 className="text-[13px] font-bold">Deskripsi</h2>
              <p className="mt-1.5 text-[12.5px] leading-[1.55] text-ink-2">
                {product.description}
              </p>
            </div>

            <button
              type="button"
              onClick={handleAdd}
              disabled={variant.stock <= 0}
              className="btn-primary mt-6 hidden w-full lg:flex"
            >
              {added ? <Check size={17} /> : null}
              {variant.stock <= 0
                ? "Stok habis"
                : added
                  ? "Ditambahkan ke keranjang"
                  : "Tambah ke keranjang"}
            </button>
          </div>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface px-5 pb-[calc(18px+env(safe-area-inset-bottom))] pt-3 lg:hidden">
        <button
          type="button"
          onClick={handleAdd}
          disabled={variant.stock <= 0}
          className="btn-primary w-full"
        >
          {added ? <Check size={17} /> : null}
          {variant.stock <= 0
            ? "Stok habis"
            : added
              ? "Ditambahkan ke keranjang"
              : "Tambah ke keranjang"}
        </button>
      </div>
    </>
  );
}
