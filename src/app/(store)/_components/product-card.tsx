"use client";

import Image from "next/image";
import Link from "./transition-link";
import { useEffect, useRef, useState } from "react";
import { Check, Plus } from "lucide-react";
import { defaultVariant, lowestPrice, totalStock } from "@/lib/catalog-types";
import type { Product } from "@/lib/catalog-types";
import { rupiah } from "@/lib/store-data";
import { useCart } from "../cart";

export default function ProductCard({
  product,
  showFrom = false,
  priority = false,
}: {
  product: Product;
  showFrom?: boolean;
  priority?: boolean;
}) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const timer = useRef<number | null>(null);
  const out = totalStock(product) === 0;
  const variant = defaultVariant(product);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  function handleAdd() {
    if (!variant || out) return;
    add(variant.id, 1);
    setAdded(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setAdded(false), 900);
  }

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-border bg-surface">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-2">
          <Image
            src={product.image}
            alt={product.name}
            fill
            priority={priority}
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 260px"
            className={`object-cover transition-transform duration-500 group-hover:scale-[1.03] ${
              out ? "opacity-55 saturate-[0.75]" : ""
            }`}
          />
          {out ? (
            <span className="absolute left-2 top-2 rounded-full bg-cream/90 px-2 py-0.5 text-[9.5px] font-bold text-ink-2 backdrop-blur">
              Habis
            </span>
          ) : null}
        </div>

        <div className="px-2.5 pb-3 pt-2.5">
          <h3
            className={`line-clamp-1 pr-8 text-[13px] font-bold leading-tight ${
              out ? "text-ink-2" : "text-ink"
            }`}
          >
            {product.name}
          </h3>
          <div className="mt-1.5 flex items-end gap-1">
            {showFrom && !out ? (
              <span className="pb-px text-[9.5px] text-ink-3">dari</span>
            ) : null}
            <span
              className={`tabular text-[12.5px] font-bold leading-none ${
                out ? "text-ink-2" : "text-ink"
              }`}
            >
              {rupiah(lowestPrice(product))}
            </span>
            <span className="pb-px text-[10px] leading-none text-ink-3">
              / {product.unit}
            </span>
          </div>
        </div>
      </Link>

      <button
        type="button"
        onClick={handleAdd}
        disabled={out}
        aria-label={out ? `${product.name} habis` : `Tambah ${product.name} ke keranjang`}
        className={`absolute bottom-2.5 right-2.5 grid h-[30px] w-[30px] place-items-center rounded-[9px] transition-colors ${
          out
            ? "cursor-not-allowed bg-surface-2 text-ink-3"
            : added
              ? "bg-brand text-cream"
              : "bg-brand-soft text-brand hover:bg-brand hover:text-cream"
        }`}
      >
        {added ? <Check size={14} strokeWidth={2.4} /> : <Plus size={14} strokeWidth={2.2} />}
      </button>
    </article>
  );
}
